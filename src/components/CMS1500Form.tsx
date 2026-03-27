import React, { useEffect } from 'react';
import type { CMS1500FormProps } from '../types/cms1500';
import { useCMS1500 } from '../hooks';

/**
 * CMS-1500 Form Component
 *
 * Fills a CMS-1500 PDF template with claim data and renders it in an iframe.
 * Uses pdf-lib to write directly into the PDF form fields for pixel-perfect output.
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
  className,
  style,
}) => {
  const { pdfUrl, loading, error, generatePdf, iframeRef, cleanup } = useCMS1500({
    pdfTemplateUrl,
  });

  // Auto-generate on mount or when data changes
  useEffect(() => {
    if (autoGenerate && data) {
      generatePdf(data).then((url) => {
        if (url) onPdfReady?.(url);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate]);

  // Report errors
  useEffect(() => {
    if (error) onError?.(error);
  }, [error, onError]);

  // Cleanup blob URL on unmount
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

  return (
    <iframe
      ref={iframeRef as React.LegacyRef<HTMLIFrameElement>}
      src={pdfUrl}
      className={className}
      style={{
        width,
        height,
        border: 'none',
        ...style,
      }}
      title="CMS-1500 Health Insurance Claim Form"
    />
  );
};

CMS1500Form.displayName = 'CMS1500Form';
