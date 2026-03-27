import React from 'react';
import { CMS1500Form, useCMS1500 } from '../src';
import type { CMS1500Data } from '../src';

// ============================================================
// Example data matching the ech-frontend data shape
// ============================================================

const sampleData: CMS1500Data = {
  // Insurance
  patientInsurance: {
    planName: 'BLUE CROSS BLUE SHIELD',
    policyNumber: 'GRP-001234',
    address: {
      line1: 'P.O. BOX 272540',
      city: 'CHICO',
      state: 'CA',
      zipcode: '95927',
    },
    phoneNumber: '5559876543',
    dob: '1980-01-15',
    sex: 'M',
  },
  insuranceId: 'XYZ123456789',

  // Patient
  patientName: 'JOHN DOE',
  patientDOB: '1980-01-15',
  patientSex: 'M',
  patientAddress: {
    line1: '123 MAIN STREET',
    city: 'ANYTOWN',
    state: 'CA',
    zipcode: '902101234',
  },
  patientPhone: '(555) 123-4567',
  patientRelationship: 'Self',

  // Condition
  conditionRelatedTo: {
    employment: false,
    autoAccident: false,
    otherAccident: false,
  },

  // Provider
  referringProvider: { '1': 'SMITH, JANE MD' },
  renderingProviderNPI: '9876543210',

  // Diagnosis
  diagnisisCodeData: [
    { code: 'J06.9' },
    { code: 'R05.9' },
    { code: 'J02.9' },
  ],

  // Prior Auth
  priorAuthorization: 'AUTH-2026-0042',

  // Service details
  dateOfService: '2026-03-15',
  posCode: '11',

  // Service lines
  patientProcedureCodes: [
    {
      procedureCode: { '1': '99213-Office Visit' },
      modifiers: { '1': '25-Significant E/M' },
      diagnosisFirstPointers: 'A',
      charges: 150.00,
      quantity: 1,
    },
    {
      procedureCode: { '1': '87880-Strep Test' },
      diagnosisFirstPointers: 'A',
      diagnosisSecondPointers: 'B',
      charges: 45.00,
      quantity: 1,
    },
  ],

  // Totals
  total: 195.00,

  // Billing
  billingProvider: { '1': 'ANYTOWN MEDICAL GROUP' },
  serviceLocation: { '1': 'ANYTOWN MEDICAL CENTER' },
};

// ============================================================
// Example 1: Simple component usage
// ============================================================

export function SimpleExample() {
  return (
    <div style={{ padding: 20 }}>
      <h2>CMS-1500 Form</h2>
      <CMS1500Form
        data={sampleData}
        pdfTemplateUrl="/cms-form/form-cms-1500.pdf"
        width="100%"
        height="calc(100vh - 100px)"
      />
    </div>
  );
}

// ============================================================
// Example 2: Hook usage with print/download controls
// ============================================================

export function HookExample() {
  const { pdfUrl, loading, error, generatePdf, handlePrint, handleDownload, iframeRef } =
    useCMS1500({ pdfTemplateUrl: '/cms-form/form-cms-1500.pdf' });

  React.useEffect(() => {
    generatePdf(sampleData);
  }, [generatePdf]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={handlePrint} disabled={!pdfUrl}>
          Print
        </button>
        <button onClick={() => handleDownload('john-doe-claim.pdf')} disabled={!pdfUrl}>
          Download PDF
        </button>
        <button onClick={() => generatePdf(sampleData)} disabled={loading}>
          {loading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      {pdfUrl && (
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none' }}
          title="CMS-1500"
        />
      )}
    </div>
  );
}

// ============================================================
// Example 3: Drop-in replacement for existing CMSForm
// ============================================================

/**
 * This shows how to replace the existing CMSForm component
 * in ech-frontend with the package version.
 *
 * Before (CMSForm.tsx — 545 lines):
 *   <CMSForm disclosureHost={disclosureHost} />
 *
 * After (using this package):
 *   <CMS1500FormWrapper disclosureHost={disclosureHost} />
 */
export function CMS1500FormWrapper({ disclosureHost }: { disclosureHost: any }) {
  const prefillData = disclosureHost?.data;

  // Map your existing prefillData shape → CMS1500Data
  const data: CMS1500Data = {
    patientInsurance: prefillData?.patientInsurance,
    insuranceId: prefillData?.insuranceId,
    patientName: prefillData?.patientName,
    patientDOB: prefillData?.patientDOB,
    patientSex: prefillData?.patientSex,
    patientAddress: prefillData?.patientAddress,
    patientPhone: prefillData?.patientPhone,
    patientRelationship: 'Self',
    referringProvider: prefillData?.referringProvider,
    renderingProviderNPI: prefillData?.renderingProviderNPI,
    diagnisisCodeData: prefillData?.diagnisisCodeData,
    priorAuthorization: prefillData?.priorAuthorization,
    dateOfService: prefillData?.dateOfService,
    posCode: prefillData?.posCode,
    patientProcedureCodes: prefillData?.patientProcedureCodes,
    total: prefillData?.total,
    billingProvider: prefillData?.billingProvider,
    serviceLocation: prefillData?.serviceLocation,
  };

  return (
    <CMS1500Form
      data={data}
      pdfTemplateUrl="/cms-form/form-cms-1500.pdf"
      width="90vw"
      height="calc(100svh - 120px)"
    />
  );
}
