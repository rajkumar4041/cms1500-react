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

## HIPAA Security Considerations

- **No data storage** — all data passed via props, held only in memory
- **No logging** — no `console.log` of PHI (unlike the original CMSForm.tsx)
- **No network calls** — only fetches the blank PDF template
- **No persistence** — no localStorage, cookies, or IndexedDB
- **Client-side only** — PDF generation happens entirely in the browser
- **Stateless** — no internal state of PHI beyond the current render

### Recommended Practices

1. Gate form access behind authentication/authorization
2. Log access events (who viewed/printed) in your application layer
3. Serve over HTTPS
4. Auto-timeout sessions displaying PHI
5. Set `Cache-Control: no-store` for pages rendering PHI

## License

MIT
