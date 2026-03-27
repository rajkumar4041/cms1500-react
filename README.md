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

## Quick Start

### 1. Component Usage

```tsx
import { CMS1500Form } from 'cms1500-react';

function ClaimPage({ claimData }) {
  return (
    <CMS1500Form
      data={claimData}
      pdfTemplateUrl="/cms-form/form-cms-1500.pdf"
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
    useCMS1500({ pdfTemplateUrl: '/cms-form/form-cms-1500.pdf' });

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

const templateBytes = await fetch('/cms-form/form-cms-1500.pdf').then(r => r.arrayBuffer());
const filledPdf = await fillCMS1500Pdf(templateBytes, claimData);
// filledPdf is a Uint8Array — save to file, upload, etc.
```

## Data Shape

The `CMS1500Data` type matches the data shape used in ech-frontend's billing module:

```ts
import type { CMS1500Data } from 'cms1500-react';

const data: CMS1500Data = {
  // Patient
  patientName: 'JOHN DOE',
  patientDOB: '1980-01-15',          // YYYY-MM-DD
  patientSex: 'M',
  patientAddress: { line1: '123 Main St', city: 'Anytown', state: 'CA', zipcode: '90210' },
  patientPhone: '(555) 123-4567',

  // Insurance
  patientInsurance: {
    planName: 'BCBS PPO',
    policyNumber: 'GRP-001234',
    address: { line1: 'PO Box 100', city: 'Chico', state: 'CA', zipcode: '95927' },
    phoneNumber: '5559876543',
    dob: '1980-01-15',
  },
  insuranceId: 'XYZ123456789',

  // Diagnosis (Box 21, A-L)
  diagnisisCodeData: [
    { code: 'J06.9' },
    { code: 'R05.9' },
  ],

  // Service lines (Box 24)
  dateOfService: '2026-03-15',
  posCode: '11',
  renderingProviderNPI: '9876543210',
  patientProcedureCodes: [
    {
      procedureCode: { '1': '99213-Office Visit' },
      modifiers: { '1': '25-Significant E/M' },
      diagnosisFirstPointers: 'A',
      charges: 150.00,
      quantity: 1,
    },
  ],

  // Totals
  total: 150.00,

  // Providers
  referringProvider: { '1': 'SMITH, JANE MD' },
  billingProvider: { '1': 'ANYTOWN MEDICAL GROUP' },
  serviceLocation: { '1': 'ANYTOWN MEDICAL CENTER' },
  priorAuthorization: 'AUTH-2026-0042',
};
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

// After: using this package
import { CMS1500Form } from 'cms1500-react';

<CMS1500Form
  data={disclosureHost.data}  // Same prefillData shape
  pdfTemplateUrl="/cms-form/form-cms-1500.pdf"
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
