import type { CMS1500Data } from '../types/cms1500';
import type {
  FHIRClaimBundle,
  FHIRHumanName,
  FHIRAddress,
  FHIRContactPoint,
  FHIRIdentifier,
} from '../types/fhir';

/**
 * Maps a FHIR R4 claim bundle to CMS-1500 form data.
 *
 * This is an optional utility — you can also populate CMS1500Data directly.
 * The mapper handles common FHIR patterns but may need customization for
 * specific payer requirements.
 */
export function mapFHIRToCMS1500(bundle: FHIRClaimBundle): CMS1500Data {
  const { patient, claim, provider, billingOrganization, serviceFacility, referringProvider } = bundle;
  const data: CMS1500Data = {};

  // --- Patient (Boxes 2, 3, 5) ---
  if (patient) {
    const name = getOfficialName(patient.name);
    if (name) {
      data.patientName = formatNameFirstLast(name);
    }

    data.patientDOB = patient.birthDate; // Already YYYY-MM-DD

    if (patient.gender) {
      data.patientSex = patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : undefined;
    }

    const address = patient.address?.[0];
    if (address) {
      data.patientAddress = {
        line1: address.line?.join(', '),
        city: address.city,
        state: address.state,
        zipcode: address.postalCode,
      };
    }

    const phone = getPhone(patient.telecom);
    if (phone) data.patientPhone = phone;

    // Patient member ID → Box 1a
    const memberId = getIdentifierByType(patient.identifier, 'MB');
    if (memberId) data.insuranceId = memberId;
  }

  // --- Claim (Boxes 21, 24, 28) ---
  if (claim) {
    // Diagnosis codes (Box 21)
    if (claim.diagnosis?.length) {
      data.diagnisisCodeData = claim.diagnosis.map((d) => ({
        code: d.diagnosisCodeableConcept?.coding?.[0]?.code ?? '',
      }));
    }

    // Service lines (Box 24)
    if (claim.item?.length) {
      // Use first item's date as the shared dateOfService
      const firstItem = claim.item[0];
      data.dateOfService = firstItem.servicedDate
        ?? firstItem.servicedPeriod?.start;

      data.patientProcedureCodes = claim.item.slice(0, 6).map((item) => {
        const cptCode = item.productOrService?.coding?.[0]?.code ?? '';
        const mods = item.modifier
          ?.map((m) => m.coding?.[0]?.code)
          .filter((m): m is string => !!m) ?? [];

        const diagPointers = (item.diagnosisSequence ?? [])
          .map((seq) => String.fromCharCode(64 + seq)); // 1→A, 2→B

        return {
          procedureCode: cptCode,
          modifiers: mods,
          diagnosisFirstPointers: diagPointers[0],
          diagnosisSecondPointers: diagPointers[1],
          diagnosisThirdPointers: diagPointers[2],
          diagnosisFourthPointers: diagPointers[3],
          charges: item.net?.value ?? item.unitPrice?.value,
          quantity: item.quantity?.value,
        };
      });

      // Place of service from first item
      const pos = firstItem.locationCodeableConcept?.coding?.[0]?.code;
      if (pos) data.posCode = pos;
    }

    // Total (Box 28)
    if (claim.total?.value != null) {
      data.total = claim.total.value;
    }
  }

  // --- Provider (Box 31) ---
  if (provider) {
    const providerName = getOfficialName(provider.name);
    if (providerName) {
      data.physicianSignature = formatNameLastFirst(providerName);
    }

    const npi = getIdentifierBySystem(provider.identifier, 'http://hl7.org/fhir/sid/us-npi');
    if (npi) data.renderingProviderNPI = npi;
  }

  // --- Billing Organization (Box 33) ---
  if (billingOrganization) {
    data.billingProvider = billingOrganization.name;

    const addr = billingOrganization.address?.[0];
    if (addr) {
      data.billingProviderAddress = addr.line?.join(', ');
    }

    const phone = getPhone(billingOrganization.telecom);
    if (phone) data.billingProviderPhone = phone;

    const orgNpi = getIdentifierBySystem(
      billingOrganization.identifier,
      'http://hl7.org/fhir/sid/us-npi'
    );
    if (orgNpi) data.billingProviderNPI = orgNpi;
  }

  // --- Service Facility (Box 32) ---
  if (serviceFacility) {
    data.serviceFacilityName = serviceFacility.name;
    const addr = serviceFacility.address?.[0];
    if (addr) {
      data.serviceFacilityAddress = addr.line?.join(', ');
      data.serviceLocation = [addr.city, addr.state, addr.postalCode]
        .filter(Boolean).join(', ');
    }
  }

  // --- Referring Provider (Box 17) ---
  if (referringProvider) {
    const refName = getOfficialName(referringProvider.name);
    if (refName) {
      data.referringProvider = formatNameLastFirst(refName);
    }
    const refNpi = getIdentifierBySystem(
      referringProvider.identifier,
      'http://hl7.org/fhir/sid/us-npi'
    );
    if (refNpi) data.referringProviderNPI = refNpi;
  }

  return data;
}

// === Helpers ===

function getOfficialName(names?: FHIRHumanName[]): FHIRHumanName | undefined {
  if (!names?.length) return undefined;
  return names.find((n) => n.family) ?? names[0];
}

function formatNameFirstLast(name: FHIRHumanName): string {
  const parts: string[] = [];
  if (name.given?.length) parts.push(...name.given);
  if (name.family) parts.push(name.family);
  return parts.join(' ');
}

function formatNameLastFirst(name: FHIRHumanName): string {
  const parts: string[] = [];
  if (name.family) parts.push(name.family);
  if (name.given?.length) parts.push(name.given.join(' '));
  return parts.join(', ');
}

function getPhone(telecoms?: FHIRContactPoint[]): string | undefined {
  return telecoms?.find((t) => t.system === 'phone')?.value;
}

function getIdentifierByType(identifiers?: FHIRIdentifier[], typeCode?: string): string | undefined {
  if (!identifiers?.length || !typeCode) return undefined;
  return identifiers.find((i) =>
    i.type?.coding?.some((c) => c.code === typeCode)
  )?.value;
}

function getIdentifierBySystem(identifiers?: FHIRIdentifier[], system?: string): string | undefined {
  if (!identifiers?.length || !system) return undefined;
  return identifiers.find((i) => i.system === system)?.value;
}
