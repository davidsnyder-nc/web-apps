import React, { useState, useEffect, useRef } from 'react';

/**
 * A simple video card component that displays a video with native HTML5 player
 * and includes a checkbox for selecting videos for a collage
 */
const SimpleVideoCard = ({ 
  video, 
  isSelected, 
  onSelectChange, 
  createCollage = null,
  truncateFileName = null
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const videoRef = useRef(null);

  // Truncate file name if it's too long
  const displayName = truncateFileName ? truncateFileName(video.name) : video.name;

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
  
  // Toggle expanded view
  const toggleExpanded = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  // Go to fullscreen
  const goFullscreen = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.mozRequestFullScreen) {
        videoRef.current.mozRequestFullScreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  return (
    <div className={`simple-video-card ${expanded ? 'expanded' : ''}`}>
      <div className="simple-video-header">
        <div className="simple-video-title">
          <h3 title={video.name}>{displayName}</h3>
          <p>{(video.size / (1024 * 1024)).toFixed(2)} MB{video.lastModified ? ` • ${video.lastModified}` : ''}</p>
        </div>
        <div className="simple-video-controls">
          <button 
            onClick={toggleExpanded} 
            className="video-expand-button" 
            title={expanded ? "Collapse video" : "Expand video"}
          >
            {expanded ? "↓" : "↑"}
          </button>
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
      </div>
      
      <div className={`simple-video-player-container ${expanded ? 'expanded' : ''}`}>
        {loading ? (
          <div className="simple-loading">Loading video...</div>
        ) : error ? (
          <div className="simple-error">Error: {error}</div>
        ) : (
          <>
            <video 
              ref={videoRef}
              src={videoUrl}
              controls
              width="100%" 
              height="auto"
              style={{ 
                maxHeight: expanded ? '600px' : '400px', 
                backgroundColor: 'black' 
              }}
            />
            {expanded && (
              <div className="video-expanded-controls">
                <button 
                  onClick={goFullscreen}
                  className="fullscreen-button"
                  title="Full screen"
                >
                  ⛶
                </button>
              </div>
            )}
          </>
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