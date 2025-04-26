import React, { useState, useEffect } from 'react';

/**
 * A simple video card component that displays a video with native HTML5 player
 * and includes a checkbox for selecting videos for a collage
 */
const SimpleVideoCard = ({ 
  video, 
  isSelected, 
  onSelectChange, 
  createCollage = null 
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the video file and create a URL for it
  useEffect(() => {
    async function loadVideo() {
      try {
        setLoading(true);
        
        // Get the file based on whether it's a legacy file or from FSA API
        let file;
        if (video.isLegacyFile && video.file) {
          file = video.file;
        } else if (video.handle) {
          file = await video.handle.getFile();
        } else {
          throw new Error('No file available');
        }
        
        // Create a URL for the file
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error loading video:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    loadVideo();
    
    // Clean up the URL when the component unmounts
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [video]);

  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    onSelectChange(video.id, e.target.checked);
  };

  return (
    <div className="simple-video-card">
      <div className="simple-video-header">
        <div className="simple-video-title">
          <h3 title={video.name}>{video.name}</h3>
          <p>{(video.size / (1024 * 1024)).toFixed(2)} MB{video.lastModified ? ` • ${video.lastModified}` : ''}</p>
        </div>
        <div className="simple-video-select">
          <label 
            htmlFor={`select-video-${video.id}`}
            className="checkbox-container"
            title="Select for collage"
          >
            <input 
              type="checkbox" 
              checked={isSelected || false}
              onChange={handleCheckboxChange}
              id={`select-video-${video.id}`}
            />
            <span className="checkmark">
              {isSelected ? "✓" : ""}
            </span>
          </label>
        </div>
      </div>
      
      <div className="simple-video-player-container">
        {loading ? (
          <div className="simple-loading">Loading video...</div>
        ) : error ? (
          <div className="simple-error">Error: {error}</div>
        ) : (
          <video 
            src={videoUrl}
            controls
            width="100%" 
            height="auto"
            style={{ maxHeight: '400px', backgroundColor: 'black' }}
          />
        )}
      </div>
      
      {/* Create Collage button is optional now and only shown if provided */}
      {createCollage && (
        <div className="simple-video-actions">
          <button 
            onClick={() => createCollage(video)}
            className="simple-button"
          >
            Create Collage
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleVideoCard;