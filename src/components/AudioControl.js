import React from 'react';

const AudioControl = ({ videos, audioConfig, onAudioChange }) => {
  // Toggle mute all
  const handleToggleMuteAll = () => {
    const newConfig = { 
      ...audioConfig, 
      muted: !audioConfig.muted,
      // If unmuting, we'll use the existing active video IDs or set none if all were previously muted
      activeVideoIds: !audioConfig.muted ? [] : audioConfig.activeVideoIds
    };
    onAudioChange(newConfig);
  };

  // Toggle audio for a specific video
  const handleToggleVideoAudio = (videoId) => {
    let newActiveIds = [...audioConfig.activeVideoIds];
    
    if (newActiveIds.includes(videoId)) {
      // Remove the video from active IDs
      newActiveIds = newActiveIds.filter(id => id !== videoId);
    } else {
      // Add the video to active IDs
      newActiveIds.push(videoId);
    }
    
    onAudioChange({
      ...audioConfig,
      muted: newActiveIds.length === 0, // If no active videos, set muted to true
      activeVideoIds: newActiveIds
    });
  };

  return (
    <div className="audio-control">
      <h3 style={{ marginBottom: '1rem' }}>Audio Controls</h3>
      
      <button 
        className={`btn ${audioConfig.muted ? 'btn-secondary' : 'btn-primary'}`}
        onClick={handleToggleMuteAll}
        style={{ marginBottom: '1rem' }}
      >
        {audioConfig.muted ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            <span style={{ marginLeft: '0.5rem' }}>Unmute All</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 8a5 5 0 0 1 0 8"></path>
              <path d="M17.7 5a9 9 0 0 1 0 14"></path>
              <path d="M6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l3.5-3.5A.8.8 0 0 1 12 6v12a.8.8 0 0 1-1.5.5L7 15"></path>
            </svg>
            <span style={{ marginLeft: '0.5rem' }}>Mute All</span>
          </>
        )}
      </button>
      
      {videos.length > 0 && (
        <div className="video-audio-controls">
          <h4 style={{ marginBottom: '0.5rem' }}>Select Videos with Audio:</h4>
          <div className="video-audio-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {videos.map((video) => (
              <div 
                key={video.id} 
                className="video-audio-toggle" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <input 
                  type="checkbox" 
                  id={`audio-toggle-${video.id}`}
                  checked={audioConfig.activeVideoIds.includes(video.id)}
                  onChange={() => handleToggleVideoAudio(video.id)}
                  disabled={audioConfig.muted}
                />
                <label 
                  htmlFor={`audio-toggle-${video.id}`}
                  style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {video.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioControl;
