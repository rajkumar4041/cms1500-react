import { PDFDocument, StandardFonts, PDFForm, PDFFont } from 'pdf-lib';
import type { CMS1500Data } from '../types/cms1500';
import {
  CARRIER_FIELDS,
  INSURED_ID_FIELD,
  PATIENT_NAME_FIELD,
  PATIENT_DOB_FIELDS,
  INSURED_NAME_FIELD,
  PATIENT_ADDRESS_FIELDS,
  RELATIONSHIP_FIELD,
  INSURED_ADDRESS_FIELDS,
  OTHER_INSURED_FIELDS,
  CONDITION_FIELDS,
  INSURED_POLICY_FIELDS,
  SIGNATURE_FIELDS,
  CURRENT_ILLNESS_FIELDS,
  SIMILAR_ILLNESS_FIELDS,
  WORK_FIELDS,
  REFERRING_PROVIDER_FIELDS,
  HOSPITALIZATION_FIELDS,
  OUTSIDE_LAB_FIELDS,
  DIAGNOSIS_FIELDS,
  RESUBMISSION_FIELDS,
  PRIOR_AUTH_FIELD,
  SERVICE_LINE_FIELDS,
  TAX_ID_FIELDS,
  PATIENT_ACCOUNT_FIELD,
  ASSIGNMENT_FIELD,
  CHARGE_FIELDS,
  PHYSICIAN_FIELDS,
  FACILITY_FIELDS,
  BILLING_PROVIDER_FIELDS,
  NUCC_USE_FIELD,
} from '../constants';

/**
 * Parse a date string (YYYY-MM-DD or ISO) into MM, DD, YY components.
 */
export function parseDateParts(dateStr?: string): { MM: string; DD: string; YY: string } {
  if (!dateStr) return { MM: '', DD: '', YY: '' };
  const parts = dateStr.split('-');
  if (parts.length < 3) return { MM: '', DD: '', YY: '' };
  return {
    MM: parts[1],
    DD: parts[2].slice(0, 2),
    YY: parts[0],
  };
}

/**
 * Extract the first value from an object, or return the string directly.
 */
function resolveValue(val?: Record<string, string> | string): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  const values = Object.values(val);
  return (values[0] as string) ?? '';
}

/**
 * Extract code part from a "CODE-description" string.
 */
function extractCode(val?: string): string {
  if (!val) return '';
  return val.split('-')[0].trim();
}

/**
 * Extract procedure codes from the entry's procedureCode field.
 * procedureCode can be Record<string, "CODE-desc"> or a plain string.
 */
function extractProcedureCodes(
  procedureCode?: Record<string, string> | string
): string[] {
  if (!procedureCode) return [];
  if (typeof procedureCode === 'string') return [extractCode(procedureCode)];
  return Object.values(procedureCode).map(extractCode);
}

/**
 * Extract modifiers from the entry's modifiers field.
 */
function extractModifiers(
  modifiers?: Record<string, string> | string[]
): string[] {
  if (!modifiers) return [];
  if (Array.isArray(modifiers)) return modifiers.map(extractCode);
  return Object.values(modifiers).map(extractCode);
}

/**
 * Build diagnosis pointer string from pointer fields.
 */
function buildDiagnosisPointer(entry: {
  diagnosisFirstPointers?: string;
  diagnosisSecondPointers?: string;
  diagnosisThirdPointers?: string;
  diagnosisFourthPointers?: string;
}): string {
  const pointers = [
    entry.diagnosisFirstPointers,
    entry.diagnosisSecondPointers,
    entry.diagnosisThirdPointers,
    entry.diagnosisFourthPointers,
  ].filter(Boolean);

  return pointers.join('-');
}

/**
 * Safely set a text field value. Silently skips if field doesn't exist.
 */
function setTextField(
  form: PDFForm,
  fieldName: string,
  value: string | undefined,
  font: PDFFont
): void {
  if (!value) return;
  try {
    const field = form.getTextField(fieldName);
    field.setText(value.toUpperCase());
    field.updateAppearances(font);
  } catch {
    // Field not found in this PDF template — skip silently
  }
}

/**
 * Safely set a checkbox field. Silently skips if field doesn't exist.
 */
function setCheckbox(form: PDFForm, fieldName: string, checked: boolean): void {
  try {
    const field = form.getCheckBox(fieldName);
    if (checked) {
      field.check();
    } else {
      field.uncheck();
    }
  } catch {
    // Field not found — skip silently
  }
}

/**
 * Format phone for area code + number split.
 * Handles formats: "(555) 123-4567", "5551234567", "555-123-4567"
 */
function splitPhone(phone?: string): { areaCode: string; number: string } {
  if (!phone) return { areaCode: '', number: '' };

  // Check for "(XXX) XXX-XXXX" format
  const parenMatch = phone.match(/\((\d{3})\)\s*(.+)/);
  if (parenMatch) {
    return { areaCode: parenMatch[1], number: parenMatch[2] };
  }

  // Strip non-digits and split
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return {
      areaCode: digits.slice(0, 3),
      number: `${digits.slice(3, 6)}-${digits.slice(6, 10)}`,
    };
  }

  return { areaCode: '', number: phone };
}

/**
 * Format a zip code with hyphen if 9 digits.
 */
function formatZip(zip?: string): string {
  if (!zip) return '';
  const digits = zip.replace(/\D/g, '');
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return zip;
}

export interface FillCMS1500Options {
  /** Whether to flatten the form after filling (prevents further editing) */
  flatten?: boolean;
}

/**
 * Fill a CMS-1500 PDF template with claim data.
 *
 * @param pdfBytes - The PDF template as ArrayBuffer or Uint8Array
 * @param data - CMS-1500 form data
 * @param options - Optional settings
 * @returns Filled PDF as Uint8Array
 */
export async function fillCMS1500Pdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  data: CMS1500Data,
  options: FillCMS1500Options = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedStandardFont(StandardFonts.CourierBold);
  const form = pdfDoc.getForm();

  const set = (field: string, value?: string | number) =>
    setTextField(form, field, value != null ? String(value) : undefined, font);

  const { patientInsurance: ins } = data;

  // === NUCC USE ===
  set(NUCC_USE_FIELD, data.nuccUse);

  // === CARRIER / INSURANCE ADDRESS ===
  set(CARRIER_FIELDS.name, ins?.planName);
  set(CARRIER_FIELDS.address, ins?.address?.line1);
  set(CARRIER_FIELDS.address2, ins?.address?.line2);
  if (ins?.address?.city) {
    const cityStateZip = [
      ins.address.city,
      ins.address.state,
      ins.address.zipcode,
    ].filter(Boolean).join(', ');
    set(CARRIER_FIELDS.cityStateZip, cityStateZip);
  }

  // === BOX 1a: Insured's ID ===
  set(INSURED_ID_FIELD, data.insuranceId);

  // === BOX 2: Patient Name ===
  if (data.patientName) {
    const nameParts = data.patientName.split(' ');
    const formatted = nameParts.length >= 2
      ? `${nameParts[0]}, ${nameParts.slice(1).join(' ')}`
      : data.patientName;
    set(PATIENT_NAME_FIELD, formatted);
  }

  // === BOX 3: Patient DOB ===
  const dob = parseDateParts(data.patientDOB);
  set(PATIENT_DOB_FIELDS.mm, dob.MM);
  set(PATIENT_DOB_FIELDS.dd, dob.DD);
  set(PATIENT_DOB_FIELDS.yy, dob.YY);

  // === BOX 4: Insured's Name ===
  set(INSURED_NAME_FIELD, data.insuredName ?? ins?.planName);

  // === BOX 5: Patient Address ===
  if (data.patientAddress) {
    set(PATIENT_ADDRESS_FIELDS.street, data.patientAddress.line1);
    set(PATIENT_ADDRESS_FIELDS.city, data.patientAddress.city);
    set(PATIENT_ADDRESS_FIELDS.state, data.patientAddress.state);
    set(PATIENT_ADDRESS_FIELDS.zip, formatZip(data.patientAddress.zipcode));
  }
  if (data.patientPhone) {
    const phone = splitPhone(data.patientPhone);
    set(PATIENT_ADDRESS_FIELDS.areaCode, phone.areaCode);
    set(PATIENT_ADDRESS_FIELDS.phone, phone.number);
  }

  // === BOX 6: Relationship ===
  if (data.patientRelationship) {
    setCheckbox(form, RELATIONSHIP_FIELD, true);
    // The checkbox selection value maps to the relationship
  }

  // === BOX 7: Insured's Address ===
  if (ins?.address) {
    set(INSURED_ADDRESS_FIELDS.street, ins.address.line1);
    set(INSURED_ADDRESS_FIELDS.city, ins.address.city);
    set(INSURED_ADDRESS_FIELDS.state, ins.address.state);
    set(INSURED_ADDRESS_FIELDS.zip, ins.address.zipcode);
  }
  if (ins?.phoneNumber) {
    const insPhone = splitPhone(ins.phoneNumber);
    set(INSURED_ADDRESS_FIELDS.areaCode, insPhone.areaCode);
    set(INSURED_ADDRESS_FIELDS.phone, insPhone.number);
  }

  // === BOX 9: Other Insured ===
  set(OTHER_INSURED_FIELDS.name, data.otherInsuredName);
  set(OTHER_INSURED_FIELDS.policy, data.otherInsuredPolicy);
  set(OTHER_INSURED_FIELDS.planName, data.otherInsuredPlanName);

  // === BOX 10: Condition Related To ===
  if (data.conditionRelatedTo) {
    if (data.conditionRelatedTo.employment != null) {
      setCheckbox(form, CONDITION_FIELDS.employment, data.conditionRelatedTo.employment);
    }
    if (data.conditionRelatedTo.autoAccident != null) {
      setCheckbox(form, CONDITION_FIELDS.autoAccident, data.conditionRelatedTo.autoAccident);
    }
    set(CONDITION_FIELDS.accidentPlace, data.conditionRelatedTo.autoAccidentState);
    if (data.conditionRelatedTo.otherAccident != null) {
      setCheckbox(form, CONDITION_FIELDS.otherAccident, data.conditionRelatedTo.otherAccident);
    }
  }

  // === BOX 11: Insured's Policy ===
  set(INSURED_POLICY_FIELDS.policy, ins?.policyNumber);
  if (ins?.dob) {
    const insDob = parseDateParts(ins.dob);
    set(INSURED_POLICY_FIELDS.dobMm, insDob.MM);
    set(INSURED_POLICY_FIELDS.dobDd, insDob.DD);
    set(INSURED_POLICY_FIELDS.dobYy, insDob.YY);
  }
  set(INSURED_POLICY_FIELDS.planName, ins?.planName);

  // === BOX 12-13: Signatures ===
  set(SIGNATURE_FIELDS.patientSignature, data.patientSignature);
  set(SIGNATURE_FIELDS.patientDate, data.patientSignatureDate);
  set(SIGNATURE_FIELDS.insuredSignature, data.insuredSignature);

  // === BOX 14: Date of Current Illness ===
  if (data.dateOfCurrentIllness) {
    const ill = parseDateParts(data.dateOfCurrentIllness);
    set(CURRENT_ILLNESS_FIELDS.mm, ill.MM);
    set(CURRENT_ILLNESS_FIELDS.dd, ill.DD);
    set(CURRENT_ILLNESS_FIELDS.yy, ill.YY);
  }

  // === BOX 15: Similar Illness ===
  if (data.dateOfSimilarIllness) {
    const sim = parseDateParts(data.dateOfSimilarIllness);
    set(SIMILAR_ILLNESS_FIELDS.mm, sim.MM);
    set(SIMILAR_ILLNESS_FIELDS.dd, sim.DD);
    set(SIMILAR_ILLNESS_FIELDS.yy, sim.YY);
  }

  // === BOX 16: Unable to Work ===
  if (data.unableToWorkFrom) {
    const wf = parseDateParts(data.unableToWorkFrom);
    set(WORK_FIELDS.fromMm, wf.MM);
    set(WORK_FIELDS.fromDd, wf.DD);
    set(WORK_FIELDS.fromYy, wf.YY);
  }
  if (data.unableToWorkTo) {
    const we = parseDateParts(data.unableToWorkTo);
    set(WORK_FIELDS.endMm, we.MM);
    set(WORK_FIELDS.endDd, we.DD);
    set(WORK_FIELDS.endYy, we.YY);
  }

  // === BOX 17: Referring Provider ===
  set(REFERRING_PROVIDER_FIELDS.name, resolveValue(data.referringProvider));
  set(REFERRING_PROVIDER_FIELDS.id, data.referringProviderNPI);

  // === BOX 18: Hospitalization ===
  if (data.hospitalizationFrom) {
    const hf = parseDateParts(data.hospitalizationFrom);
    set(HOSPITALIZATION_FIELDS.fromMm, hf.MM);
    set(HOSPITALIZATION_FIELDS.fromDd, hf.DD);
    set(HOSPITALIZATION_FIELDS.fromYy, hf.YY);
  }
  if (data.hospitalizationTo) {
    const he = parseDateParts(data.hospitalizationTo);
    set(HOSPITALIZATION_FIELDS.endMm, he.MM);
    set(HOSPITALIZATION_FIELDS.endDd, he.DD);
    set(HOSPITALIZATION_FIELDS.endYy, he.YY);
  }

  // === BOX 20: Outside Lab ===
  if (data.outsideLab != null) {
    setCheckbox(form, OUTSIDE_LAB_FIELDS.lab, data.outsideLab);
  }
  if (data.outsideLabCharges != null) {
    set(OUTSIDE_LAB_FIELDS.charge, String(data.outsideLabCharges));
  }

  // === BOX 21: Diagnosis Codes ===
  if (data.diagnisisCodeData?.length) {
    data.diagnisisCodeData.slice(0, 12).forEach((dx, i) => {
      if (dx?.code && DIAGNOSIS_FIELDS[i]) {
        set(DIAGNOSIS_FIELDS[i], dx.code);
      }
    });
  }

  // === BOX 22: Resubmission ===
  set(RESUBMISSION_FIELDS.code, data.resubmissionCode);
  set(RESUBMISSION_FIELDS.originalRef, data.originalRefNumber);

  // === BOX 23: Prior Authorization ===
  set(PRIOR_AUTH_FIELD, data.priorAuthorization);

  // === BOX 24: Service Lines (up to 6) ===
  if (data.patientProcedureCodes?.length) {
    data.patientProcedureCodes.slice(0, 6).forEach((entry, i) => {
      const fields = SERVICE_LINE_FIELDS[i];
      if (!fields || !entry) return;

      // Date of service (same for all lines in this data model)
      const dos = parseDateParts(data.dateOfService);
      if (dos.MM) {
        set(fields.svFromMm, dos.MM);
        set(fields.svFromDd, dos.DD);
        set(fields.svFromYy, dos.YY.slice(2)); // 2-digit year
        set(fields.svEndMm, dos.MM);
        set(fields.svEndDd, dos.DD);
        set(fields.svEndYy, dos.YY.slice(2));
      }

      // Place of service
      set(fields.place, data.posCode);

      // CPT code
      const codes = extractProcedureCodes(entry.procedureCode);
      if (codes[0]) set(fields.cpt, codes[0]);

      // Modifiers
      const mods = extractModifiers(entry.modifiers);
      if (mods[0]) set(fields.mod, mods[0]);
      if (mods[1]) set(fields.modA, mods[1]);
      if (mods[2]) set(fields.modB, mods[2]);
      if (mods[3]) set(fields.modC, mods[3]);

      // Diagnosis pointer
      set(fields.diag, buildDiagnosisPointer(entry));

      // Charges
      if (entry.charges != null) {
        const chargeStr = typeof entry.charges === 'number'
          ? entry.charges.toFixed(2)
          : entry.charges;
        set(fields.charge, chargeStr);
      }

      // Quantity/Days
      if (entry.quantity != null) {
        set(fields.days, String(entry.quantity));
      }

      // EPSDT
      set(fields.epsdt, entry.epsdt);

      // Type of service
      set(fields.type, entry.typeOfService);

      // Rendering provider NPI
      set(fields.localNpi, data.renderingProviderNPI);
    });
  }

  // === BOX 25: Federal Tax ID ===
  set(TAX_ID_FIELDS.taxId, data.federalTaxId);
  if (data.federalTaxIdType === 'SSN') {
    setCheckbox(form, TAX_ID_FIELDS.ssn, true);
  }

  // === BOX 26: Patient Account ===
  set(PATIENT_ACCOUNT_FIELD, data.patientAccountNumber);

  // === BOX 27: Accept Assignment ===
  if (data.acceptAssignment != null) {
    setCheckbox(form, ASSIGNMENT_FIELD, data.acceptAssignment);
  }

  // === BOX 28: Total Charge ===
  if (data.total != null) {
    set(CHARGE_FIELDS.totalCharge, data.total.toFixed(2));
  }

  // === BOX 29: Amount Paid ===
  if (data.amountPaid != null) {
    set(CHARGE_FIELDS.amountPaid, String(data.amountPaid));
  }

  // === BOX 31: Physician Signature ===
  set(PHYSICIAN_FIELDS.signature, data.physicianSignature);
  set(PHYSICIAN_FIELDS.date, data.physicianSignatureDate);

  // === BOX 32: Service Facility ===
  set(FACILITY_FIELDS.name, data.serviceFacilityName);
  set(FACILITY_FIELDS.street, data.serviceFacilityAddress);
  set(FACILITY_FIELDS.location, resolveValue(data.serviceLocation));

  // === BOX 33: Billing Provider ===
  set(BILLING_PROVIDER_FIELDS.name, resolveValue(data.billingProvider));
  set(BILLING_PROVIDER_FIELDS.street, data.billingProviderAddress);
  set(BILLING_PROVIDER_FIELDS.location, '');
  if (data.billingProviderPhone) {
    const bPhone = splitPhone(data.billingProviderPhone);
    set(BILLING_PROVIDER_FIELDS.phoneArea, bPhone.areaCode);
    set(BILLING_PROVIDER_FIELDS.phone, bPhone.number);
  }
  set(BILLING_PROVIDER_FIELDS.npi, data.billingProviderNPI);
  set(BILLING_PROVIDER_FIELDS.groupNpi, data.billingProviderGroupNPI);

  // Flatten if requested
  if (options.flatten) {
    form.flatten();
  }

  return pdfDoc.save();
}
