/**
 * Minimal FHIR R4 types for CMS-1500 mapping.
 *
 * These are intentionally simplified subsets of the full FHIR R4 spec,
 * covering only the fields needed for CMS-1500 form population.
 */

export interface FHIRHumanName {
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface FHIRAddress {
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FHIRContactPoint {
  system?: 'phone' | 'fax' | 'email';
  value?: string;
  use?: 'home' | 'work' | 'mobile';
}

export interface FHIRIdentifier {
  system?: string;
  value?: string;
  type?: {
    coding?: Array<{
      system?: string;
      code?: string;
    }>;
  };
}

export interface FHIRCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRReference {
  reference?: string;
  display?: string;
}

export interface FHIRPeriod {
  start?: string;
  end?: string;
}

/** Minimal FHIR R4 Patient */
export interface FHIRPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: FHIRIdentifier[];
  name?: FHIRHumanName[];
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  address?: FHIRAddress[];
  telecom?: FHIRContactPoint[];
}

/** Minimal FHIR R4 Practitioner */
export interface FHIRPractitioner {
  resourceType: 'Practitioner';
  id?: string;
  identifier?: FHIRIdentifier[];
  name?: FHIRHumanName[];
  address?: FHIRAddress[];
  telecom?: FHIRContactPoint[];
}

/** Minimal FHIR R4 Organization */
export interface FHIROrganization {
  resourceType: 'Organization';
  id?: string;
  identifier?: FHIRIdentifier[];
  name?: string;
  address?: FHIRAddress[];
  telecom?: FHIRContactPoint[];
}

/** FHIR Claim diagnosis component */
export interface FHIRClaimDiagnosis {
  sequence: number;
  diagnosisCodeableConcept?: FHIRCodeableConcept;
}

/** FHIR Claim item (service line) */
export interface FHIRClaimItem {
  sequence: number;
  productOrService: FHIRCodeableConcept;
  modifier?: FHIRCodeableConcept[];
  servicedDate?: string;
  servicedPeriod?: FHIRPeriod;
  locationCodeableConcept?: FHIRCodeableConcept;
  quantity?: { value?: number };
  unitPrice?: { value?: number; currency?: string };
  net?: { value?: number; currency?: string };
  diagnosisSequence?: number[];
}

/** Minimal FHIR R4 Claim */
export interface FHIRClaim {
  resourceType: 'Claim';
  id?: string;
  identifier?: FHIRIdentifier[];
  status?: string;
  type?: FHIRCodeableConcept;
  patient?: FHIRReference;
  provider?: FHIRReference;
  diagnosis?: FHIRClaimDiagnosis[];
  item?: FHIRClaimItem[];
  total?: { value?: number; currency?: string };
}

/** Bundle for mapping — patient + claim + optional provider/org */
export interface FHIRClaimBundle {
  patient: FHIRPatient;
  claim: FHIRClaim;
  provider?: FHIRPractitioner;
  billingOrganization?: FHIROrganization;
  serviceFacility?: FHIROrganization;
  referringProvider?: FHIRPractitioner;
}
