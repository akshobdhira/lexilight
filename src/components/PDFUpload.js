import React, { useState } from 'react';
import './PDFUpload.css';

/**
 * PDF Upload Component
 * Handles file selection and validation
 */
const PDFUpload = ({ onFileSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setError(null);

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    // Validate file size (optional: limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="pdf-upload-container">
      <div
        className={`pdf-upload-area ${dragActive ? 'drag-active' : ''} ${isLoading ? 'loading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="pdf-file-input"
          accept=".pdf"
          onChange={handleFileInput}
          disabled={isLoading}
          className="file-input"
        />
        <label htmlFor="pdf-file-input" className="upload-label">
          {isLoading ? (
            <>
              <div className="spinner"></div>
              <span>Processing PDF...</span>
            </>
          ) : (
            <>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="upload-icon"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="upload-text">
                Drag and drop your insurance terms pdf here, or click to browse
              </span>
              <span className="upload-hint">Supports files up to 50MB</span>
            </>
          )}
        </label>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default PDFUpload;

