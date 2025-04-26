import React, { useState, useRef } from 'react';

const FileUpload = ({ onFilesUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const videoFiles = files.filter(file => file.type.startsWith('video/'));
      
      if (videoFiles.length === 0) {
        alert('Please upload video files only');
        return;
      }
      
      onFilesUpload(videoFiles);
    }
  };

  // Handle file input change
  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const videoFiles = files.filter(file => file.type.startsWith('video/'));
      
      if (videoFiles.length === 0) {
        alert('Please upload video files only');
        return;
      }
      
      onFilesUpload(videoFiles);
    }
  };

  // Handle button click to trigger file input
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-upload">
      <div 
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: '2px dashed #ced4da',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragActive ? '#f1f3f9' : '#fff',
          transition: 'all 0.3s ease'
        }}
        onClick={handleButtonClick}
      >
        <svg 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#4361ee" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ margin: '0 auto 1rem' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <h3 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>Drag & Drop Video Files</h3>
        <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
          Supported formats: MP4, MOV, AVI
        </p>
        <button 
          className="btn btn-primary"
          type="button"
          disabled={isLoading}
        >
          {isLoading ? 'Uploading...' : 'Browse Files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/mp4,video/quicktime,video/avi,video/x-msvideo"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default FileUpload;
