import React, { useEffect, useMemo, useRef } from 'react';
import type { CMS1500FormProps } from '../types/cms1500';
import { useCMS1500 } from '../hooks';

const toolbarButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 14,
  cursor: 'pointer',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  color: '#111827',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: 8,
  borderBottom: '1px solid #e5e7eb',
};

/**
 * CMS-1500 Form Component
 *
 * Fills a CMS-1500 PDF template with claim data and renders it in an iframe,
 * with a built-in Print / Download / Open-in-new-tab toolbar.
 *
 * Uses pdf-lib to write directly into the PDF form fields for pixel-perfect
 * output. The generated PDF is not flattened, so its fields stay editable in a
 * full PDF viewer (use Download or Open in new tab to edit).
 *
 * HIPAA Note: This component does not store, log, or transmit any data.
 * All PHI is passed via props, rendered client-side, and held only in memory.
 */
export const CMS1500Form: React.FC<CMS1500FormProps> = ({
  data,
  pdfTemplateUrl,
  onPdfReady,
  onError,
  width = '100%',
  height = 'calc(100vh - 120px)',
  autoGenerate = true,
  showToolbar = false,
  downloadFileName,
  className,
  style,
}) => {
  const {
    pdfUrl,
    loading,
    error,
    generatePdf,
    handlePrint,
    handleDownload,
    iframeRef,
    cleanup,
  } = useCMS1500({ pdfTemplateUrl });

  // Regenerate whenever the data content changes, not just on mount. Keyed on a
  // stable serialization so callers passing fresh object literals don't loop.
  const dataKey = useMemo(() => JSON.stringify(data), [data]);

  const onPdfReadyRef = useRef(onPdfReady);
  onPdfReadyRef.current = onPdfReady;

  useEffect(() => {
    if (autoGenerate && data) {
      generatePdf(data).then((url) => {
        if (url) onPdfReadyRef.current?.(url);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, dataKey, generatePdf]);

  useEffect(() => {
    if (error) onError?.(error);
  }, [error, onError]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (loading) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width,
          height,
          ...style,
        }}
      >
        Loading CMS-1500 form...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width,
          height,
          color: '#dc2626',
          ...style,
        }}
      >
        Failed to generate CMS-1500: {error.message}
      </div>
    );
  }

  if (!pdfUrl) return null;

  // Without the custom toolbar, show the native PDF viewer (its toolbar already
  // offers download/print/zoom). With it, suppress the native toolbar so the
  // two control sets don't duplicate each other.
  if (!showToolbar) {
    return (
      <iframe
        ref={iframeRef as React.LegacyRef<HTMLIFrameElement>}
        src={pdfUrl}
        className={className}
        style={{ width, height, border: 'none', ...style }}
        title="CMS-1500 Health Insurance Claim Form"
      />
    );
  }

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', width, ...style }}
    >
      <div style={toolbarStyle}>
        <button type="button" style={toolbarButtonStyle} onClick={handlePrint}>
          Print
        </button>
        <button
          type="button"
          style={toolbarButtonStyle}
          onClick={() => handleDownload(downloadFileName)}
        >
          Download
        </button>
        <button
          type="button"
          style={toolbarButtonStyle}
          onClick={() => window.open(pdfUrl, '_blank')}
        >
          Open in new tab
        </button>
      </div>
      <iframe
        ref={iframeRef as React.LegacyRef<HTMLIFrameElement>}
        src={`${pdfUrl}#toolbar=0&navpanes=0`}
        style={{ width: '100%', height, border: 'none' }}
        title="CMS-1500 Health Insurance Claim Form"
      />
    </div>
  );
};

CMS1500Form.displayName = 'CMS1500Form';
