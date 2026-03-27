/**
 * PDF Form Field Name Mapping
 *
 * Maps CMS-1500 box numbers to the actual PDF form field names
 * in the standard CMS-1500 (02/12) editable PDF.
 *
 * These field names are extracted from the official NUCC CMS-1500 PDF
 * and must match exactly for pdf-lib to fill them.
 */

/** Carrier/Insurance address block */
export const CARRIER_FIELDS = {
  name: 'insurance_name',
  address: 'insurance_address',
  address2: 'insurance_address2',
  cityStateZip: 'insurance_city_state_zip',
} as const;

/** Box 1a: Insured's ID */
export const INSURED_ID_FIELD = 'insurance_id';

/** Box 2: Patient name */
export const PATIENT_NAME_FIELD = 'pt_name';

/** Box 3: Patient DOB */
export const PATIENT_DOB_FIELDS = {
  mm: 'birth_mm',
  dd: 'birth_dd',
  yy: 'birth_yy',
} as const;

/** Box 4: Insured's name */
export const INSURED_NAME_FIELD = 'ins_name';

/** Box 5: Patient address */
export const PATIENT_ADDRESS_FIELDS = {
  street: 'pt_street',
  city: 'pt_city',
  state: 'pt_state',
  zip: 'pt_zip',
  areaCode: 'pt_AreaCode',
  phone: 'pt_phone',
} as const;

/** Box 6: Patient relationship to insured (checkbox) */
export const RELATIONSHIP_FIELD = 'rel_to_ins';

/** Box 7: Insured's address */
export const INSURED_ADDRESS_FIELDS = {
  street: 'ins_street',
  city: 'ins_city',
  state: 'ins_state',
  zip: 'ins_zip',
  areaCode: 'ins_phone area',
  phone: 'ins_phone',
} as const;

/** Box 9: Other insured */
export const OTHER_INSURED_FIELDS = {
  name: 'other_ins_name',
  policy: 'other_ins_policy',
  planName: 'other_ins_plan_name',
} as const;

/** Box 10: Condition related to (checkboxes) */
export const CONDITION_FIELDS = {
  employment: 'employment',
  autoAccident: 'pt_auto_accident',
  accidentPlace: 'accident_place',
  otherAccident: 'other_accident',
} as const;

/** Box 11: Insured's policy */
export const INSURED_POLICY_FIELDS = {
  policy: 'ins_policy',
  dobMm: 'ins_dob_mm',
  dobDd: 'ins_dob_dd',
  dobYy: 'ins_dob_yy',
  sex: 'ins_sex',
  planName: 'ins_plan_name',
  benefitPlan: 'ins_benefit_plan',
} as const;

/** Box 12-13: Signatures */
export const SIGNATURE_FIELDS = {
  patientSignature: 'pt_signature',
  patientDate: 'pt_date',
  insuredSignature: 'ins_signature',
} as const;

/** Box 14: Current illness */
export const CURRENT_ILLNESS_FIELDS = {
  mm: 'cur_ill_mm',
  dd: 'cur_ill_dd',
  yy: 'cur_ill_yy',
} as const;

/** Box 15: Similar illness */
export const SIMILAR_ILLNESS_FIELDS = {
  mm: 'sim_ill_mm',
  dd: 'sim_ill_dd',
  yy: 'sim_ill_yy',
} as const;

/** Box 16: Unable to work */
export const WORK_FIELDS = {
  fromMm: 'work_mm_from',
  fromDd: 'work_dd_from',
  fromYy: 'work_yy_from',
  endMm: 'work_mm_end',
  endDd: 'work_dd_end',
  endYy: 'work_yy_end',
} as const;

/** Box 17: Referring provider */
export const REFERRING_PROVIDER_FIELDS = {
  name: 'ref_physician',
  id: 'id_physician',
  otherId1: 'physician number 17a1',
  otherId2: 'physician number 17a',
} as const;

/** Box 18: Hospitalization */
export const HOSPITALIZATION_FIELDS = {
  fromMm: 'hosp_mm_from',
  fromDd: 'hosp_dd_from',
  fromYy: 'hosp_yy_from',
  endMm: 'hosp_mm_end',
  endDd: 'hosp_dd_end',
  endYy: 'hosp_yy_end',
} as const;

/** Box 20: Outside lab (checkbox) */
export const OUTSIDE_LAB_FIELDS = {
  lab: 'lab',
  charge: 'charge',
} as const;

/** Box 21: Diagnosis codes (A-L → diagnosis1-12) */
export const DIAGNOSIS_FIELDS = [
  'diagnosis1', 'diagnosis2', 'diagnosis3', 'diagnosis4',
  'diagnosis5', 'diagnosis6', 'diagnosis7', 'diagnosis8',
  'diagnosis9', 'diagnosis10', 'diagnosis11', 'diagnosis12',
] as const;

/** Box 22: Resubmission */
export const RESUBMISSION_FIELDS = {
  code: 'medicaid_resub',
  originalRef: 'original_ref',
} as const;

/** Box 23: Prior authorization */
export const PRIOR_AUTH_FIELD = 'prior_auth';

/**
 * Box 24: Service line fields for rows 1-6.
 * Each row has: date from/to (mm/dd/yy), place, EMG, CPT, modifiers (a-c),
 * diagnosis pointer, charges, days, EPSDT, type, rendering NPI.
 */
export interface ServiceLineFieldSet {
  svFromMm: string;
  svFromDd: string;
  svFromYy: string;
  svEndMm: string;
  svEndDd: string;
  svEndYy: string;
  place: string;
  emg: string;
  cpt: string;
  mod: string;
  modA: string;
  modB: string;
  modC: string;
  diag: string;
  charge: string;
  days: string;
  epsdt: string;
  type: string;
  localNpi: string;
  localOther: string;
  plan: string;
}

function createServiceLineFields(row: number): ServiceLineFieldSet {
  return {
    svFromMm: `sv${row}_mm_from`,
    svFromDd: `sv${row}_dd_from`,
    svFromYy: `sv${row}_yy_from`,
    svEndMm: `sv${row}_mm_end`,
    svEndDd: `sv${row}_dd_end`,
    svEndYy: `sv${row}_yy_end`,
    place: `place${row}`,
    emg: `emg${row}`,
    cpt: `cpt${row}`,
    mod: `mod${row}`,
    modA: `mod${row}a`,
    modB: `mod${row}b`,
    modC: `mod${row}c`,
    diag: `diag${row}`,
    charge: `ch${row}`,
    days: `day${row}`,
    epsdt: `epsdt${row}`,
    type: `type${row}`,
    localNpi: `local${row}`,
    localOther: `local${row}a`,
    plan: `plan${row}`,
  };
}

export const SERVICE_LINE_FIELDS: ServiceLineFieldSet[] = [
  createServiceLineFields(1),
  createServiceLineFields(2),
  createServiceLineFields(3),
  createServiceLineFields(4),
  createServiceLineFields(5),
  createServiceLineFields(6),
];

/** Box 25: Federal Tax ID */
export const TAX_ID_FIELDS = {
  taxId: 'tax_id',
  ssn: 'ssn', // checkbox
} as const;

/** Box 26: Patient account */
export const PATIENT_ACCOUNT_FIELD = 'pt_account';

/** Box 27: Accept assignment (checkbox) */
export const ASSIGNMENT_FIELD = 'assignment';

/** Box 28-29: Charges */
export const CHARGE_FIELDS = {
  totalCharge: 't_charge',
  amountPaid: 'amt_paid',
} as const;

/** Box 31: Physician signature */
export const PHYSICIAN_FIELDS = {
  signature: 'physician_signature',
  date: 'physician_date',
} as const;

/** Box 32: Service facility */
export const FACILITY_FIELDS = {
  name: 'fac_name',
  street: 'fac_street',
  location: 'fac_location',
  npi: 'pin1',
  groupNpi: 'grp1',
} as const;

/** Box 33: Billing provider */
export const BILLING_PROVIDER_FIELDS = {
  name: 'doc_name',
  street: 'doc_street',
  location: 'doc_location',
  phoneArea: 'doc_phone area',
  phone: 'doc_phone',
  npi: 'pin',
  groupNpi: 'grp',
} as const;

/** NUCC Use field */
export const NUCC_USE_FIELD = 'NUCC USE';
