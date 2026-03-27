import { useCallback, useRef, useState } from 'react';
import type { CMS1500Data, UseCMS1500Options } from '../types/cms1500';
import { fillCMS1500Pdf } from '../utils/pdfFiller';

export interface UseCMS1500Return {
  /** Generated PDF blob URL (null until generated) */
  pdfUrl: string | null;
  /** Whether PDF is currently being generated */
  loading: boolean;
  /** Error from last generation attempt */
  error: Error | null;
  /** Generate/regenerate the PDF */
  generatePdf: (data: CMS1500Data) => Promise<string | null>;
  /** Print the generated PDF */
  handlePrint: () => void;
  /** Download the generated PDF */
  handleDownload: (filename?: string) => void;
  /** Ref for the iframe viewer element */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Cleanup blob URL (call on unmount if needed) */
  cleanup: () => void;
}

const DEFAULT_PDF_URL = '/cms-form/form-cms-1500.pdf';

/**
 * Hook for generating, viewing, printing, and downloading CMS-1500 PDFs.
 *
 * Uses pdf-lib to fill the actual CMS-1500 PDF template form fields.
 * No PHI is logged, stored, or transmitted.
 */
export function useCMS1500(options: UseCMS1500Options = {}): UseCMS1500Return {
  const {
    pdfTemplateUrl = DEFAULT_PDF_URL,
  } = options;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  }, []);

  const generatePdf = useCallback(async (data: CMS1500Data): Promise<string | null> => {
    setLoading(true);
    setError(null);
    cleanup();

    try {
      const templateBytes = await fetch(pdfTemplateUrl).then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch PDF template: ${res.status} ${res.statusText}`);
        return res.arrayBuffer();
      });

      const filledPdfBytes = await fillCMS1500Pdf(templateBytes, data);

      const blob = new Blob([filledPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      currentUrlRef.current = url;
      setPdfUrl(url);
      setLoading(false);
      return url;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setLoading(false);
      return null;
    }
  }, [pdfTemplateUrl, cleanup]);

  const handlePrint = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    } else if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => printWindow.print());
      }
    }
  }, [pdfUrl]);

  const handleDownload = useCallback((filename = 'cms-1500-claim.pdf') => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl]);

  return {
    pdfUrl,
    loading,
    error,
    generatePdf,
    handlePrint,
    handleDownload,
    iframeRef,
    cleanup,
  };
}
