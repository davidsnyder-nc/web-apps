import React from 'react';

const PlaybackControls = ({ isPlaying, onPlayPause }) => {
  return (
    <div className="playback-controls">
      <h3 style={{ marginBottom: '1rem' }}>Playback Controls</h3>
      
      <button 
        className="btn btn-primary"
        onClick={onPlayPause}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        {isPlaying ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            <span>Pause</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Play</span>
          </>
        )}
      </button>
      
      <div className="playback-info" style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        <p>All videos will loop continuously</p>
      </div>
    </div>
  );
};

export default PlaybackControls;
