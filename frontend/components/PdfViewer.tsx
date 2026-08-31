'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import { getDocumentFileUrl } from '../lib/api';

interface PdfViewerProps {
  documentId?: string;
  fileName?: string;
  filePath?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  documentId,
  fileName = 'Document',
  filePath = '',
}) => {
  const [zoom, setZoom] = useState<number>(100);

  if (!documentId && !filePath) {
    return (
      <div className="w-full min-h-[350px] sm:min-h-[450px] bg-slate-100/70 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <FileText className="w-10 h-10 sm:w-12 sm:h-12 mb-2 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">No document file attached</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">Upload a PDF or Image to see the original high-resolution preview here.</p>
      </div>
    );
  }

  const fileUrl = documentId ? getDocumentFileUrl(documentId) : filePath;
  const isImage = fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  // Append token for browser-native requests (iframe / img cannot set headers)
  const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || 'demo-static-token') : 'demo-static-token';
  const fileUrlWithToken = fileUrl.includes('token=') ? fileUrl : (fileUrl + (fileUrl.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleReset = () => setZoom(100);

  return (
    <div className="w-full h-full min-h-[380px] sm:min-h-[480px] lg:min-h-[560px] flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-md">
      {/* Zoom / Action Toolbar */}
      <div className="bg-slate-800 text-white px-3 sm:px-4 py-2 flex items-center justify-between border-b border-slate-700 gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs truncate max-w-[140px] sm:max-w-[220px]">
          {isImage ? <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> : <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
          <span className="truncate font-mono text-[11px] sm:text-xs">{fileName}</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900 px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-1 hover:text-indigo-400 transition-colors font-bold px-1.5 min-w-[24px] text-center"
            aria-label="Zoom Out"
          >
            -
          </button>
          <button
            onClick={handleReset}
            title="Reset Zoom"
            className="px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] text-slate-300 hover:text-white"
          >
            {zoom}%
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-1 hover:text-indigo-400 transition-colors font-bold px-1.5 min-w-[24px] text-center"
            aria-label="Zoom In"
          >
            +
          </button>
        </div>

        <a
          href={fileUrlWithToken}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-700/60 shrink-0"
        >
          <span>Open</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 w-full overflow-auto bg-slate-950 p-2 sm:p-4 flex items-center justify-center min-h-[320px] sm:min-h-[420px]">
        {isImage ? (
          <ImagePreview fileUrl={fileUrlWithToken} fileName={fileName} zoom={zoom} />
        ) : (
          <PdfIframePreview fileUrl={fileUrlWithToken} fileName={fileName} zoom={zoom} />
        )}
      </div>
    </div>
  );
};

/* ── Image preview with error fallback ── */
function ImagePreview({ fileUrl, fileName, zoom }: { fileUrl: string; fileName: string; zoom: number }) {
  const [errored, setErrored] = useState(false);

  if (errored) return <PreviewUnavailable fileName={fileName} />;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
      <img
        src={fileUrl}
        alt={fileName}
        onError={() => setErrored(true)}
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
        className="max-w-full max-h-[500px] object-contain transition-transform duration-150 rounded shadow"
      />
    </div>
  );
}

/* ── PDF iframe preview with error fallback ── */
function PdfIframePreview({ fileUrl, fileName, zoom }: { fileUrl: string; fileName: string; zoom: number }) {
  const [errored, setErrored] = useState(false);

  React.useEffect(() => {
    setErrored(false);
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || 'demo-static-token') : 'demo-static-token';
    fetch(fileUrl, {
      method: 'HEAD',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => { if (!res.ok) setErrored(true); })
      .catch(() => setErrored(true));
  }, [fileUrl]);

  if (errored) return <PreviewUnavailable fileName={fileName} />;

  return (
    <div
      style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
      className="w-full h-[400px] sm:h-[500px] lg:h-[560px] transition-transform duration-150"
    >
      <iframe
        src={`${fileUrl}#toolbar=0`}
        title={fileName}
        className="w-full h-full border-0 rounded-lg bg-white shadow-inner"
      />
    </div>
  );
}

/* ── Fallback when file is unavailable ── */
function PreviewUnavailable({ fileName }: { fileName: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-slate-400 gap-3 p-6 sm:p-8 text-center">
      <div className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700">
        <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
      </div>
      <div>
        <p className="text-xs sm:text-sm font-semibold text-slate-200">Document Preview Unavailable</p>
        <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate max-w-xs">{fileName}</p>
        <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed mx-auto">
          Sample pre-seeded record. Upload a PDF or image document using &ldquo;Upload Document&rdquo; to preview original scans.
        </p>
      </div>
    </div>
  );
}

