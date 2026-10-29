import { useCallback, useRef, useState } from 'react';
import type { CMS1500Data, UseCMS1500Options } from '../types/cms1500';
import { fillCMS1500Pdf } from '../utils/pdfFiller';
import { getEmbeddedTemplate } from '../utils/templateData';

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

/**
 * Hook for generating, viewing, printing, and downloading CMS-1500 PDFs.
 *
 * The PDF template is bundled with the package — no file copy or URL needed.
 * If pdfTemplateUrl is provided, it will fetch from that URL instead.
 *
 * No PHI is logged, stored, or transmitted.
 */
export function useCMS1500(options: UseCMS1500Options = {}): UseCMS1500Return {
  const { pdfTemplateUrl } = options;

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
      let templateBytes: ArrayBuffer | Uint8Array;

      if (pdfTemplateUrl) {
        // User provided a custom URL — fetch it
        templateBytes = await fetch(pdfTemplateUrl).then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch PDF template: ${res.status} ${res.statusText}`);
          return res.arrayBuffer();
        });
      } else {
        // Use the embedded template — no fetch needed
        templateBytes = getEmbeddedTemplate();
      }

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
    if (!pdfUrl) return;

    // Printing the visible viewer's contentWindow silently no-ops on the
    // browser PDF plugin. A dedicated off-screen iframe loaded with the blob,
    // printed once it fires `load`, is the reliable cross-browser path.
    const printFrame = document.createElement('iframe');
    printFrame.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    printFrame.src = pdfUrl;

    const remove = () => {
      if (printFrame.parentNode) printFrame.parentNode.removeChild(printFrame);
    };

    printFrame.onload = () => {
      try {
        const win = printFrame.contentWindow;
        if (!win) throw new Error('No print frame window');
        win.addEventListener('afterprint', remove);
        win.focus();
        win.print();
        // Fallback cleanup if `afterprint` never fires (some PDF viewers).
        setTimeout(remove, 60_000);
      } catch {
        remove();
        // Popup is user-gesture initiated here, so it is not blocked.
        window.open(pdfUrl, '_blank');
      }
    };

    document.body.appendChild(printFrame);
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
