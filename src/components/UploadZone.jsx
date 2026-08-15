import React, { useState, useRef } from 'react';
import { UploadCloud, FileWarning } from 'lucide-react';

export default function UploadZone({ onFileSelected, disabled }) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;

    // Validate type (Images and PDFs)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Only JPEG, PNG and PDF documents are supported.');
      return;
    }

    // Limit to 50MB to support detailed multi-page medical records and high-res scans
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File size must be under 50MB.');
      return;
    }

    setErrorMsg('');
    const previewUrl = URL.createObjectURL(file);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64Data = dataUrl.split(',')[1];
      
      onFileSelected({
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl,
        base64Data
      });
    };
    reader.onerror = () => {
      setErrorMsg('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (disabled) return;

    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    if (disabled) return;
    inputRef.current.click();
  };

  return (
    <div style={{ width: '100%' }}>
      <div 
        className={`upload-container ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="file-input" 
          accept=".pdf, .jpg, .jpeg, .png"
          onChange={handleChange}
          disabled={disabled}
        />
        
        <div className="upload-icon-wrapper">
          <UploadCloud size={24} />
        </div>
        
        <div className="upload-text-main">
          {disabled ? 'Enter API Key to Scan' : 'Upload Medical Report'}
        </div>
        
        <div className="upload-text-sub">
          Drag & drop or click to browse
        </div>
        <div className="upload-text-sub" style={{ fontSize: '0.65rem' }}>
          Supports PDF, JPEG, PNG (Max 50MB)
        </div>
      </div>

      {errorMsg && (
        <div className="inline-alert error" style={{ marginTop: '0.75rem' }}>
          <FileWarning size={14} style={{ flexShrink: 0 }} />
          <div>{errorMsg}</div>
        </div>
      )}
    </div>
  );
}
