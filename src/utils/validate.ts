import type { CMS1500Data } from '../types/cms1500';

export type CMS1500IssueSeverity = 'error' | 'warning';

export interface CMS1500ValidationIssue {
  /** Dot/bracket path to the offending field, e.g. `patientProcedureCodes[2].diagnosisFirstPointers`. */
  field: string;
  /** Stable machine-readable code, e.g. `DIAGNOSIS_POINTER_OUT_OF_RANGE`. */
  code: string;
  /** Human-readable explanation. */
  message: string;
  severity: CMS1500IssueSeverity;
}

export interface CMS1500ValidationResult {
  /** True when there are no `error`-severity issues. */
  valid: boolean;
  errors: CMS1500ValidationIssue[];
  warnings: CMS1500ValidationIssue[];
}

/** Box 21 caps at 12 diagnoses; Box 24 at 6 service lines. */
const MAX_DIAGNOSIS = 12;
const MAX_SERVICE_LINES = 6;

const NPI_RE = /^\d{10}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/;

/** Letter (A–L) or number (1–12) pointer → its 1-based index; 0 if present but
 *  invalid; null if absent. */
function pointerIndex(pointer?: string): number | null {
  const p = pointer != null ? String(pointer).trim() : '';
  if (!p) return null;
  if (/^[A-La-l]$/.test(p)) return p.toUpperCase().charCodeAt(0) - 64;
  const n = parseInt(p, 10);
  if (Number.isInteger(n) && n >= 1 && n <= MAX_DIAGNOSIS) return n;
  return 0;
}

function isValidDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const month = Number(m[2]);
  const day = Number(m[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

function countDiagnoses(data: CMS1500Data): number {
  if (data.diagnisisCodeData?.length) {
    return data.diagnisisCodeData.filter((d) => d?.code?.trim()).length;
  }
  if (data.diagnosisCodes) {
    return Object.values(data.diagnosisCodes).filter((v) => v?.trim()).length;
  }
  return 0;
}

/**
 * Validate a CMS-1500 payload for claim-readiness. Returns blocking `errors`
 * (invalid NPI/date, diagnosis pointers that reference a non-existent Box 21
 * code, missing required fields) and non-blocking `warnings` (overflow beyond
 * the 12-diagnosis / 6-line form caps, missing recommended fields).
 *
 * This never throws and never mutates the input.
 */
export function validateCMS1500(data: CMS1500Data): CMS1500ValidationResult {
  const errors: CMS1500ValidationIssue[] = [];
  const warnings: CMS1500ValidationIssue[] = [];

  const err = (field: string, code: string, message: string) =>
    errors.push({ field, code, message, severity: 'error' });
  const warn = (field: string, code: string, message: string) =>
    warnings.push({ field, code, message, severity: 'warning' });

  if (!data.patientName?.trim()) {
    err('patientName', 'PATIENT_NAME_REQUIRED', 'Box 2: patient name is required.');
  }

  const diagnosisCount = countDiagnoses(data);
  if (diagnosisCount === 0) {
    err('diagnisisCodeData', 'DIAGNOSIS_REQUIRED', 'Box 21: at least one diagnosis code is required.');
  } else if (diagnosisCount > MAX_DIAGNOSIS) {
    warn(
      'diagnisisCodeData',
      'DIAGNOSIS_OVERFLOW',
      `Box 21: ${diagnosisCount} diagnoses provided; only the first ${MAX_DIAGNOSIS} are printed.`
    );
  }

  const lines = data.patientProcedureCodes ?? [];
  if (lines.length === 0) {
    err('patientProcedureCodes', 'SERVICE_LINE_REQUIRED', 'Box 24: at least one service line is required.');
  } else if (lines.length > MAX_SERVICE_LINES) {
    warn(
      'patientProcedureCodes',
      'SERVICE_LINE_OVERFLOW',
      `Box 24: ${lines.length} service lines provided; only the first ${MAX_SERVICE_LINES} are printed. Split the rest onto a separate claim.`
    );
  }

  lines.forEach((entry, i) => {
    const pointers: Array<keyof typeof entry> = [
      'diagnosisFirstPointers',
      'diagnosisSecondPointers',
      'diagnosisThirdPointers',
      'diagnosisFourthPointers',
    ];
    pointers.forEach((key) => {
      const idx = pointerIndex(entry?.[key] as string | undefined);
      if (idx === null) return;
      const path = `patientProcedureCodes[${i}].${String(key)}`;
      if (idx === 0) {
        err(path, 'DIAGNOSIS_POINTER_INVALID', `Box 24E: "${entry[key]}" is not a valid diagnosis pointer (A–L or 1–12).`);
      } else if (idx > diagnosisCount) {
        err(
          path,
          'DIAGNOSIS_POINTER_OUT_OF_RANGE',
          `Box 24E: diagnosis pointer references position ${idx}, but only ${diagnosisCount} diagnosis code(s) are present.`
        );
      }
    });
  });

  const npiFields: Array<[string, string | undefined]> = [
    ['billingProviderNPI', data.billingProviderNPI],
    ['billingProviderGroupNPI', data.billingProviderGroupNPI],
    ['renderingProviderNPI', data.renderingProviderNPI],
    ['referringProviderNPI', data.referringProviderNPI],
  ];
  npiFields.forEach(([field, value]) => {
    if (value != null && value !== '' && !NPI_RE.test(value)) {
      err(field, 'NPI_INVALID', `${field}: NPI must be exactly 10 digits.`);
    }
  });

  const dateFields: Array<[string, string | undefined]> = [
    ['patientDOB', data.patientDOB],
    ['dateOfService', data.dateOfService],
    ['dateOfCurrentIllness', data.dateOfCurrentIllness],
    ['dateOfSimilarIllness', data.dateOfSimilarIllness],
    ['unableToWorkFrom', data.unableToWorkFrom],
    ['unableToWorkTo', data.unableToWorkTo],
    ['hospitalizationFrom', data.hospitalizationFrom],
    ['hospitalizationTo', data.hospitalizationTo],
    ['patientInsurance.dob', data.patientInsurance?.dob],
    ['physicianSignatureDate', data.physicianSignatureDate],
    ['patientSignatureDate', data.patientSignatureDate],
  ];
  dateFields.forEach(([field, value]) => {
    if (value != null && value !== '' && !isValidDate(value)) {
      err(field, 'DATE_INVALID', `${field}: expected an ISO date (YYYY-MM-DD).`);
    }
  });

  if (!data.billingProviderNPI?.trim()) {
    warn('billingProviderNPI', 'BILLING_NPI_MISSING', 'Box 33a: billing provider NPI is recommended.');
  }
  if (!data.insuranceId?.trim()) {
    warn('insuranceId', 'INSURANCE_ID_MISSING', "Box 1a: insured's ID number is recommended.");
  }

  return { valid: errors.length === 0, errors, warnings };
}
