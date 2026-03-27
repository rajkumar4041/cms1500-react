/**
 * CMS-1500 Form Data Types
 *
 * Maps to the 33 numbered boxes on the standard CMS-1500 (02/12) claim form.
 * All fields are optional to support partial rendering.
 */

/** Insurance type checkboxes (Box 1) */
export type InsuranceType =
  | 'medicare'
  | 'medicaid'
  | 'tricare'
  | 'champva'
  | 'group_health'
  | 'feca_blk_lung'
  | 'other';

/** Sex field */
export type Sex = 'M' | 'F';

/** Patient relationship to insured (Box 6) */
export type PatientRelationship = 'Self' | 'Spouse' | 'Child' | 'Other';

/** Employment/accident status (Boxes 10a-c) */
export interface ConditionRelatedTo {
  employment?: boolean;
  autoAccident?: boolean;
  autoAccidentState?: string;
  otherAccident?: boolean;
}

/** Address structure */
export interface CMS1500Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

/** Diagnosis code entry (Box 21, A-L) */
export interface DiagnosisCode {
  code: string;
}

/** Procedure code entry for service lines (Box 24) */
export interface ProcedureCodeEntry {
  /** CPT/HCPCS code — can be object { key: "code-desc" } or string */
  procedureCode?: Record<string, string> | string;
  /** Modifiers — can be object { key: "mod-desc" } or string[] */
  modifiers?: Record<string, string> | string[];
  /** Diagnosis pointers (A-L letters referencing Box 21) */
  diagnosisFirstPointers?: string;
  diagnosisSecondPointers?: string;
  diagnosisThirdPointers?: string;
  diagnosisFourthPointers?: string;
  /** Charges */
  charges?: number | string;
  /** Units/quantity */
  quantity?: number | string;
  /** EPSDT/Family Plan */
  epsdt?: string;
  /** Type of service */
  typeOfService?: string;
}

/** Insurance details */
export interface InsuranceInfo {
  planName?: string;
  policyNumber?: string;
  address?: CMS1500Address;
  phoneNumber?: string;
  dob?: string;
  sex?: Sex;
}

/** Complete CMS-1500 form data */
export interface CMS1500Data {
  // === CARRIER / INSURANCE ===
  /** Insurance plan details */
  patientInsurance?: InsuranceInfo;
  /** Box 1: Insurance type */
  insuranceType?: InsuranceType;
  /** Box 1a: Insured's ID number */
  insuranceId?: string;

  // === PATIENT INFO (Boxes 2-5) ===
  /** Box 2: Patient's full name */
  patientName?: string;
  /** Box 3: Patient's DOB (YYYY-MM-DD format) */
  patientDOB?: string;
  /** Box 3: Patient's sex */
  patientSex?: Sex;
  /** Box 5: Patient address */
  patientAddress?: CMS1500Address;
  /** Box 5: Patient phone (e.g. "(555) 123-4567") */
  patientPhone?: string;

  // === INSURED INFO (Boxes 4, 6-7, 11) ===
  /** Box 4: Insured's name (defaults to patientName if self) */
  insuredName?: string;
  /** Box 6: Patient relationship to insured */
  patientRelationship?: PatientRelationship;

  // === OTHER INSURED (Box 9) ===
  otherInsuredName?: string;
  otherInsuredPolicy?: string;
  otherInsuredPlanName?: string;

  // === CONDITION (Box 10) ===
  conditionRelatedTo?: ConditionRelatedTo;

  // === SIGNATURES (Boxes 12-13) ===
  patientSignature?: string;
  patientSignatureDate?: string;
  insuredSignature?: string;

  // === DATES (Boxes 14-16, 18) ===
  /** Box 14: Date of current illness (YYYY-MM-DD) */
  dateOfCurrentIllness?: string;
  /** Box 15: Similar illness date (YYYY-MM-DD) */
  dateOfSimilarIllness?: string;
  /** Box 16: Unable to work — from (YYYY-MM-DD) */
  unableToWorkFrom?: string;
  /** Box 16: Unable to work — to (YYYY-MM-DD) */
  unableToWorkTo?: string;
  /** Box 18: Hospitalization — from (YYYY-MM-DD) */
  hospitalizationFrom?: string;
  /** Box 18: Hospitalization — to (YYYY-MM-DD) */
  hospitalizationTo?: string;

  // === PROVIDER INFO (Boxes 17, 19-20) ===
  /** Box 17: Referring provider (can be object or string) */
  referringProvider?: Record<string, string> | string;
  /** Box 17a: Referring provider other ID */
  referringProviderOtherId?: string;
  /** Box 17b: Referring provider NPI */
  referringProviderNPI?: string;
  /** Box 19: Additional claim info */
  additionalClaimInfo?: string;
  /** Box 20: Outside lab charges */
  outsideLab?: boolean;
  outsideLabCharges?: number | string;
  /** NUCC Use field */
  nuccUse?: string;

  // === DIAGNOSIS (Box 21) ===
  /** Box 21: Diagnosis codes (A-L, up to 12) */
  diagnisisCodeData?: DiagnosisCode[];

  // === RESUBMISSION / AUTH (Boxes 22-23) ===
  resubmissionCode?: string;
  originalRefNumber?: string;
  priorAuthorization?: string;

  // === SERVICE LINES (Box 24) ===
  /** Date of service for all lines (YYYY-MM-DD) */
  dateOfService?: string;
  /** Place of service code for all lines */
  posCode?: string;
  /** Rendering provider NPI for all lines */
  renderingProviderNPI?: string;
  /** Box 24: Procedure codes/service lines (up to 6) */
  patientProcedureCodes?: ProcedureCodeEntry[];

  // === PROVIDER / BILLING (Boxes 25-33) ===
  /** Box 25: Federal Tax ID */
  federalTaxId?: string;
  /** Box 25: SSN or EIN */
  federalTaxIdType?: 'SSN' | 'EIN';
  /** Box 26: Patient account number */
  patientAccountNumber?: string;
  /** Box 27: Accept assignment */
  acceptAssignment?: boolean;
  /** Box 28: Total charge */
  total?: number;
  /** Box 29: Amount paid */
  amountPaid?: number | string;

  /** Box 31: Physician signature */
  physicianSignature?: string;
  physicianSignatureDate?: string;

  /** Box 32: Service facility */
  serviceLocation?: Record<string, string> | string;
  serviceFacilityName?: string;
  serviceFacilityAddress?: string;

  /** Box 33: Billing provider */
  billingProvider?: Record<string, string> | string;
  billingProviderName?: string;
  billingProviderAddress?: string;
  billingProviderPhone?: string;

  /** Box 33a/b: NPI and group */
  billingProviderNPI?: string;
  billingProviderGroupNPI?: string;
}

/** Props for the CMS1500 PDF viewer component */
export interface CMS1500FormProps {
  /** Form data to render */
  data: CMS1500Data;
  /** URL or path to the CMS-1500 PDF template */
  pdfTemplateUrl?: string;
  /** Callback when PDF is generated successfully */
  onPdfReady?: (pdfUrl: string) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Width of the viewer (default: "100%") */
  width?: string | number;
  /** Height of the viewer (default: "calc(100vh - 120px)") */
  height?: string | number;
  /** Whether to auto-generate PDF on mount (default: true) */
  autoGenerate?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/** Options for the PDF generation hook */
export interface UseCMS1500Options {
  /** URL or path to the CMS-1500 PDF template */
  pdfTemplateUrl?: string;
  /** Auto-generate on data change (default: false) */
  autoGenerate?: boolean;
}
