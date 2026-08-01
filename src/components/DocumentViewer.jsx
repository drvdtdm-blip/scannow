import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FileText, ImageIcon } from 'lucide-react';

export default function DocumentViewer({ file, isAnalyzing }) {
  const [zoom, setZoom] = useState(1);

  // Reset zoom when file changes
  useEffect(() => {
    setZoom(1);
  }, [file?.previewUrl]);

  if (!file) return null;

  const isPdf = file.type === 'application/pdf';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="viewer-panel">
      <div className="viewer-header">
        <div className="viewer-title">
          {isPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
          <span>{file.name}</span>
        </div>
        
        {!isPdf && (
          <div className="viewer-controls">
            <button 
              className="viewer-control-btn" 
              onClick={handleZoomOut} 
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOut size={15} />
            </button>
            <span style={{ fontSize: '0.75rem', minWidth: '35px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button 
              className="viewer-control-btn" 
              onClick={handleZoomIn} 
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomIn size={15} />
            </button>
            <button 
              className="viewer-control-btn" 
              onClick={handleZoomReset} 
              title="Reset Zoom"
              aria-label="Reset zoom"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="viewer-body">
        {/* Futuristic scanning laser line overlay */}
        {isAnalyzing && (
          <div className="scanning-overlay" aria-hidden="true">
            <div className="scanning-bar"></div>
          </div>
        )}

        {isPdf ? (
          <iframe 
            src={file.previewUrl} 
            title="PDF Document Viewer"
            className="pdf-preview"
          />
        ) : (
          <div 
            className="image-preview-container" 
            style={{ transform: `scale(${zoom})` }}
          >
            <img 
              src={file.previewUrl} 
              alt="Scanned medical report" 
              className="image-preview" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
