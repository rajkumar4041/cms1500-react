# cms1500-react

Production-ready React library for filling, rendering, and printing **CMS-1500 (HCFA)** claim forms. Uses `pdf-lib` to fill actual PDF form fields for pixel-perfect output. FHIR R4 compatible, HIPAA-conscious design.

## How It Works

Unlike CSS-overlay approaches, this library fills the **actual form fields** in a CMS-1500 PDF template using `pdf-lib`. This means:

- Pixel-perfect alignment — fields snap to the PDF's own coordinates
- Real PDF output — can be saved, emailed, uploaded, or printed
- Works with any standard CMS-1500 (02/12) editable PDF template

## Install

```bash
npm install cms1500-react pdf-lib
```

**Peer dependencies:** `react >= 17`, `react-dom >= 17`

## PDF Template Setup

This package includes the official CMS-1500 PDF template. Copy it to your public directory:

```bash
npx cms1500-copy-template
# → copies to ./public/cms-1500-template.pdf
```

Or specify a custom directory:

```bash
npx cms1500-copy-template public/forms
```

That's it — the component will automatically use `/cms-1500-template.pdf` as the default template URL. No need to pass `pdfTemplateUrl` unless you want a custom path.

## Quick Start

### 1. Component Usage

```tsx
import { CMS1500Form } from 'cms1500-react';

function ClaimPage({ claimData }) {
  return (
    <CMS1500Form
      data={claimData}
      width="100%"
      height="calc(100vh - 120px)"
    />
  );
}
```

### 2. Hook Usage (with print/download)

```tsx
import { useCMS1500 } from 'cms1500-react';

function ClaimPage({ claimData }) {
  const { pdfUrl, loading, generatePdf, handlePrint, handleDownload, iframeRef } =
    useCMS1500();

  useEffect(() => { generatePdf(claimData); }, []);

  return (
    <div>
      <button onClick={handlePrint}>Print</button>
      <button onClick={() => handleDownload('claim.pdf')}>Download</button>
      {pdfUrl && (
        <iframe ref={iframeRef} src={pdfUrl} style={{ width: '100%', height: '80vh' }} />
      )}
    </div>
  );
}
```

### 3. Headless PDF Generation (no React)

```ts
import { fillCMS1500Pdf } from 'cms1500-react';

// Browser: fetch from public directory
const templateBytes = await fetch('/cms-1500-template.pdf').then(r => r.arrayBuffer());
const filledPdf = await fillCMS1500Pdf(templateBytes, claimData);
// filledPdf is a Uint8Array — save to file, upload, etc.
```

**Node.js** (API routes, scripts):

```ts
import { fillCMS1500Pdf } from 'cms1500-react';
import fs from 'fs';
import path from 'path';

// Load the bundled template directly from node_modules
const templatePath = path.resolve('node_modules/cms1500-react/assets/cms-1500-template.pdf');
const templateBytes = fs.readFileSync(templatePath);
const filledPdf = await fillCMS1500Pdf(templateBytes, claimData);
```

## Data Shape (`CMS1500Data`)

All fields are **optional** — pass only what you need. The JSON below shows every supported field with descriptions:

```jsonc
{
  // ─── CARRIER / INSURANCE (Top of form) ───
  "insuranceType": "group_health",          // "medicare" | "medicaid" | "tricare" | "champva" | "group_health" | "feca_blk_lung" | "other"
  "insuranceId": "XYZ123456789",            // Box 1a: Insured's ID number
  "patientInsurance": {                     // Insurance plan details
    "planName": "BCBS PPO",
    "policyNumber": "GRP-001234",
    "address": {
      "line1": "PO Box 100",
      "line2": "Suite 200",                // Optional
      "city": "Chico",
      "state": "CA",
      "zipcode": "95927"
    },
    "phoneNumber": "5559876543",
    "dob": "1980-01-15",                   // Insured's DOB (YYYY-MM-DD)
    "sex": "M"                             // "M" | "F"
  },

  // ─── PATIENT INFO (Boxes 2-5) ───
  "patientName": "JOHN DOE",               // Box 2: Patient's full name
  "patientDOB": "1980-01-15",              // Box 3: DOB (YYYY-MM-DD)
  "patientSex": "M",                       // Box 3: "M" | "F"
  "patientAddress": {                       // Box 5: Patient address
    "line1": "123 Main St",
    "line2": "Apt 4B",                     // Optional
    "city": "Anytown",
    "state": "CA",
    "zipcode": "90210"
  },
  "patientPhone": "(555) 123-4567",        // Box 5: Patient phone

  // ─── INSURED INFO (Boxes 4, 6-7, 11) ───
  "insuredName": "JOHN DOE",               // Box 4: Insured's name (defaults to plan name if omitted)
  "patientRelationship": "Self",            // Box 6: "Self" | "Spouse" | "Child" | "Other"

  // ─── OTHER INSURED (Box 9) ───
  "otherInsuredName": "JANE DOE",           // Box 9: Other insured's name
  "otherInsuredPolicy": "POL-5678",         // Box 9a: Other insured's policy number
  "otherInsuredPlanName": "AETNA HMO",      // Box 9d: Other insured's plan name

  // ─── CONDITION (Box 10) ───
  "conditionRelatedTo": {                   // Box 10: Is condition related to...
    "employment": false,                    // 10a: Employment
    "autoAccident": false,                  // 10b: Auto accident
    "autoAccidentState": "CA",              // 10b: State (if auto accident)
    "otherAccident": false                  // 10c: Other accident
  },

  // ─── SIGNATURES (Boxes 12-13) ───
  "patientSignature": "SIGNATURE ON FILE",  // Box 12: Patient signature
  "patientSignatureDate": "2026-03-15",     // Box 12: Date signed
  "insuredSignature": "SIGNATURE ON FILE",  // Box 13: Insured's signature

  // ─── DATES (Boxes 14-16, 18) ───
  "dateOfCurrentIllness": "2026-03-10",     // Box 14: Date of current illness (YYYY-MM-DD)
  "dateOfSimilarIllness": "2025-06-20",     // Box 15: Similar illness date (YYYY-MM-DD)
  "unableToWorkFrom": "2026-03-10",         // Box 16: Unable to work from (YYYY-MM-DD)
  "unableToWorkTo": "2026-03-17",           // Box 16: Unable to work to (YYYY-MM-DD)
  "hospitalizationFrom": "2026-03-11",      // Box 18: Hospitalization from (YYYY-MM-DD)
  "hospitalizationTo": "2026-03-13",        // Box 18: Hospitalization to (YYYY-MM-DD)

  // ─── PROVIDER INFO (Boxes 17, 19-20) ───
  "referringProvider": { "1": "SMITH, JANE MD" },  // Box 17: Referring provider name
  "referringProviderNPI": "1234567890",     // Box 17b: Referring provider NPI
  "referringProviderOtherId": "G1234567",   // Box 17a: Other ID
  "additionalClaimInfo": "Initial treatment",// Box 19: Additional claim info
  "outsideLab": false,                      // Box 20: Outside lab?
  "outsideLabCharges": 0,                   // Box 20: Lab charges ($)
  "nuccUse": "",                            // NUCC Use field

  // ─── DIAGNOSIS (Box 21, A-L, up to 12) ───
  "diagnisisCodeData": [
    { "code": "J06.9" },                   // A: Acute upper respiratory infection
    { "code": "R05.9" },                   // B: Cough
    { "code": "J20.9" },                   // C: Acute bronchitis
    { "code": "R50.9" }                    // D: Fever (up to 12 codes: A-L)
  ],

  // ─── RESUBMISSION / AUTH (Boxes 22-23) ───
  "resubmissionCode": "7",                 // Box 22: Resubmission code
  "originalRefNumber": "ORIG-12345",        // Box 22: Original reference number
  "priorAuthorization": "AUTH-2026-0042",   // Box 23: Prior authorization number

  // ─── SERVICE LINES (Box 24, up to 6 lines) ───
  "dateOfService": "2026-03-15",            // Date of service for all lines (YYYY-MM-DD)
  "posCode": "11",                          // Place of service code (11 = Office)
  "renderingProviderNPI": "9876543210",     // Rendering provider NPI for all lines
  "patientProcedureCodes": [
    {
      "procedureCode": { "1": "99213-Office Visit" },      // CPT code (code-description format)
      "modifiers": { "1": "25-Significant E/M" },          // Up to 4 modifiers
      "diagnosisFirstPointers": "A",        // Diagnosis pointer (references Box 21)
      "diagnosisSecondPointers": "B",       // Optional second pointer
      "diagnosisThirdPointers": "",         // Optional third pointer
      "diagnosisFourthPointers": "",        // Optional fourth pointer
      "charges": 150.00,                    // Line charges ($)
      "quantity": 1,                        // Units/days
      "epsdt": "",                          // EPSDT/Family Plan
      "typeOfService": ""                   // Type of service
    },
    {
      "procedureCode": { "1": "99214-Office Visit Extended" },
      "modifiers": {},
      "diagnosisFirstPointers": "A",
      "charges": 250.00,
      "quantity": 1
    }
  ],

  // ─── PROVIDER / BILLING (Boxes 25-33) ───
  "federalTaxId": "12-3456789",            // Box 25: Federal Tax ID
  "federalTaxIdType": "EIN",               // Box 25: "SSN" | "EIN"
  "patientAccountNumber": "ACCT-001234",    // Box 26: Patient account number
  "acceptAssignment": true,                 // Box 27: Accept assignment?
  "total": 400.00,                          // Box 28: Total charge ($)
  "amountPaid": 50.00,                      // Box 29: Amount paid ($)

  "physicianSignature": "SIGNATURE ON FILE",// Box 31: Physician signature
  "physicianSignatureDate": "2026-03-15",   // Box 31: Date

  "serviceLocation": { "1": "ANYTOWN MEDICAL CENTER" },  // Box 32: Service facility name
  "serviceFacilityName": "ANYTOWN MEDICAL CENTER",        // Box 32: Facility name
  "serviceFacilityAddress": "456 Health Blvd, Anytown CA 90210", // Box 32: Facility address

  "billingProvider": { "1": "ANYTOWN MEDICAL GROUP" },    // Box 33: Billing provider name
  "billingProviderName": "ANYTOWN MEDICAL GROUP",          // Box 33: Provider name
  "billingProviderAddress": "789 Billing Ave, Anytown CA 90210", // Box 33: Provider address
  "billingProviderPhone": "(555) 987-6543",                // Box 33: Phone
  "billingProviderNPI": "1112223334",       // Box 33a: Billing provider NPI
  "billingProviderGroupNPI": "5556667778"   // Box 33b: Group NPI
}
```

### Minimal Example

Only a few fields are needed to generate a basic claim:

```json
{
  "patientName": "JOHN DOE",
  "patientDOB": "1980-01-15",
  "patientSex": "M",
  "insuranceId": "XYZ123456789",
  "diagnisisCodeData": [{ "code": "J06.9" }],
  "dateOfService": "2026-03-15",
  "posCode": "11",
  "patientProcedureCodes": [
    {
      "procedureCode": { "1": "99213" },
      "diagnosisFirstPointers": "A",
      "charges": 150.00,
      "quantity": 1
    }
  ],
  "total": 150.00
}
```

## FHIR R4 Mapping

```tsx
import { mapFHIRToCMS1500 } from 'cms1500-react';
import type { FHIRClaimBundle } from 'cms1500-react';

const bundle: FHIRClaimBundle = {
  patient: {
    resourceType: 'Patient',
    name: [{ family: 'Doe', given: ['John'] }],
    birthDate: '1980-01-15',
    gender: 'male',
  },
  claim: {
    resourceType: 'Claim',
    diagnosis: [
      { sequence: 1, diagnosisCodeableConcept: { coding: [{ code: 'J06.9' }] } },
    ],
    item: [
      {
        sequence: 1,
        productOrService: { coding: [{ code: '99213' }] },
        servicedDate: '2026-03-15',
        locationCodeableConcept: { coding: [{ code: '11' }] },
        quantity: { value: 1 },
        net: { value: 150.00 },
        diagnosisSequence: [1],
      },
    ],
  },
};

const formData = mapFHIRToCMS1500(bundle);
```

## Migrating from CMSForm.tsx

Drop-in replacement for the existing `CMSForm` component:

```tsx
// Before: 545-line CMSForm.tsx with inline pdf-lib logic
<CMSForm disclosureHost={disclosureHost} />

// After: using this package (no pdfTemplateUrl needed!)
import { CMS1500Form } from 'cms1500-react';

<CMS1500Form
  data={disclosureHost.data}  // Same prefillData shape
  width="90vw"
  height="calc(100svh - 120px)"
/>
```

See `example/App.tsx` for a complete migration example with the `CMS1500FormWrapper`.

## API Reference

### `<CMS1500Form />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `CMS1500Data` | required | Form data |
| `pdfTemplateUrl` | `string` | `/cms-form/form-cms-1500.pdf` | Path to PDF template |
| `onPdfReady` | `(url: string) => void` | — | Called when PDF is generated |
| `onError` | `(error: Error) => void` | — | Called on error |
| `width` | `string \| number` | `'100%'` | Viewer width |
| `height` | `string \| number` | `'calc(100vh - 120px)'` | Viewer height |
| `autoGenerate` | `boolean` | `true` | Auto-generate on mount |
| `className` | `string` | — | CSS class |
| `style` | `CSSProperties` | — | Inline styles |

### `useCMS1500(options?)`

| Return | Type | Description |
|--------|------|-------------|
| `pdfUrl` | `string \| null` | Blob URL of generated PDF |
| `loading` | `boolean` | Generation in progress |
| `error` | `Error \| null` | Last error |
| `generatePdf` | `(data) => Promise<string \| null>` | Generate PDF |
| `handlePrint` | `() => void` | Print the PDF |
| `handleDownload` | `(filename?) => void` | Download the PDF |
| `iframeRef` | `RefObject<HTMLIFrameElement>` | Ref for iframe |
| `cleanup` | `() => void` | Revoke blob URL |

### `fillCMS1500Pdf(pdfBytes, data, options?)`

Low-level function — fill a PDF template and get back `Uint8Array`. Works without React (Node.js, workers, etc).

### `mapFHIRToCMS1500(bundle)`

Maps `FHIRClaimBundle` → `CMS1500Data`.

## HIPAA Compliance

This library is designed with **HIPAA (Health Insurance Portability and Accountability Act)** compliance in mind. It supports the **Privacy Rule**, **Security Rule**, and **Minimum Necessary Standard** by ensuring that Protected Health Information (PHI) is handled securely at every step.

### How This Library Supports HIPAA

#### Zero PHI Footprint

| Safeguard | How It's Enforced |
|-----------|-------------------|
| **No data storage** | All data is passed via props and held only in memory — nothing is written to disk |
| **No logging of PHI** | No `console.log`, `console.debug`, or telemetry captures patient data |
| **No network transmission** | The library makes zero outbound API calls — only fetches the blank PDF template |
| **No persistence** | No localStorage, sessionStorage, cookies, or IndexedDB usage |
| **No third-party data sharing** | No analytics, tracking pixels, or external SDKs are loaded |
| **Client-side only** | PDF generation happens entirely in the browser using `pdf-lib` — PHI never leaves the client |
| **Stateless rendering** | No internal state retains PHI beyond the current render cycle |

#### HIPAA Technical Safeguards Alignment

| HIPAA Requirement | Library Support |
|-------------------|-----------------|
| **Access Control (§164.312(a))** | Library is stateless — access control is enforced at your application layer (auth/RBAC) |
| **Audit Controls (§164.312(b))** | No PHI is logged internally; your app can log access events (who viewed/printed/downloaded) |
| **Integrity Controls (§164.312(c))** | PDF is generated from structured data using `pdf-lib` — no manual field manipulation or injection risk |
| **Transmission Security (§164.312(e))** | Library operates client-side only; serve your app over HTTPS to encrypt data in transit |
| **Minimum Necessary (§164.502(b))** | Only the fields required for CMS-1500 are accepted and rendered — no extraneous PHI processing |

#### PHI Data Flow

```
Your App (authenticated) → Props → cms1500-react → pdf-lib → Browser Memory → Print/Download
                                    ↑                                ↑
                              No disk writes                  No server calls
                              No logging                      No persistence
```

### Recommended Practices for HIPAA-Compliant Deployment

1. **Authentication & Authorization** — Gate form access behind role-based access control (RBAC). Only authorized users (billing staff, providers) should view claim forms.
2. **Audit Logging** — Log access events in your application layer: who viewed, printed, or downloaded each claim form, and when.
3. **HTTPS Only** — Always serve your application over TLS/HTTPS to protect PHI in transit.
4. **Session Timeout** — Auto-timeout sessions displaying PHI after a period of inactivity (recommended: 15 minutes per HIPAA best practices).
5. **Cache Control** — Set `Cache-Control: no-store` and `Pragma: no-cache` headers for pages rendering PHI to prevent browser caching.
6. **Secure Print Handling** — Educate users on secure handling of printed CMS-1500 forms (physical safeguard).
7. **BAA Coverage** — If using this library in a SaaS product, ensure your hosting provider is covered under a Business Associate Agreement (BAA).
8. **Incident Response** — Have a breach notification plan in place as required by the HIPAA Breach Notification Rule (§164.400-414).

### Compliance Disclaimer

> This library is designed to **support** HIPAA compliance but does **not** guarantee it on its own. HIPAA compliance is a holistic requirement covering administrative, physical, and technical safeguards across your entire application stack. You are responsible for implementing appropriate access controls, audit logging, encryption, and organizational policies in your deployment environment.

## License

MIT
