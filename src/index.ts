// Components
export { CMS1500Form } from './components';

// Hooks
export { useCMS1500 } from './hooks';

// PDF Engine
export { fillCMS1500Pdf, parseDateParts } from './utils';

// FHIR Mapping
export { mapFHIRToCMS1500 } from './utils';

// Template helpers
export { TEMPLATE_ASSET_PATH, TEMPLATE_FILENAME } from './utils';

// Constants (for advanced customization)
export {
  DIAGNOSIS_FIELDS,
  SERVICE_LINE_FIELDS,
  PRIOR_AUTH_FIELD,
  BILLING_PROVIDER_FIELDS,
  FACILITY_FIELDS,
  PHYSICIAN_FIELDS,
} from './constants';

// Types
export type {
  CMS1500Data,
  CMS1500FormProps,
  UseCMS1500Options,
  CMS1500Address,
  InsuranceType,
  Sex,
  PatientRelationship,
  ConditionRelatedTo,
  DiagnosisCode,
  ProcedureCodeEntry,
  InsuranceInfo,
  FHIRPatient,
  FHIRPractitioner,
  FHIROrganization,
  FHIRClaim,
  FHIRClaimBundle,
  FHIRClaimDiagnosis,
  FHIRClaimItem,
} from './types';

export type { UseCMS1500Return } from './hooks';
export type { FillCMS1500Options } from './utils';
export type { ServiceLineFieldSet } from './constants';
