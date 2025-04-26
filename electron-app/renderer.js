// This file will be used to initialize React and handle Electron-specific functionality
const { createRoot } = require('react-dom/client');
const React = require('react');
const { useState, useEffect } = React;

// Custom component for the Electron app
const VideoCollageApp = () => {
  const [videos, setVideos] = useState([]);
  const [layout, setLayout] = useState('grid');
  const [audioConfig, setAudioConfig] = useState({ muted: false, activeVideoIds: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle file selection
  const handleFileSelect = () => {
    if (window.electron) {
      window.electron.send('request-mainprocess-action', { action: 'open-videos' });
    } else {
      // Fallback for browser environment
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'video/*';
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        processVideoFiles(files);
      };
      input.click();
    }
  };
  
  // Process video files
  const processVideoFiles = (files) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const processedVideos = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      }));
      
      setVideos([...videos, ...processedVideos]);
      
      // Set default audio config (first video has audio)
      if (processedVideos.length > 0 && audioConfig.activeVideoIds.length === 0) {
        setAudioConfig({ ...audioConfig, activeVideoIds: [processedVideos[0].id] });
      }
      
      setIsProcessing(false);
    } catch (err) {
      setError(`Failed to process videos: ${err.message}`);
      setIsProcessing(false);
    }
  };
  
  // Handle export
  const handleExport = () => {
    if (videos.length === 0) {
      setError('No videos to export');
      return;
    }
    
    if (window.electron) {
      window.electron.send('request-mainprocess-action', { action: 'export-collage' });
    } else {
      alert('Export functionality is only available in the Electron app');
    }
  };
  
  // Handle layout change
  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };
  
  // Handle audio settings change
  const handleAudioChange = (videoId) => {
    if (audioConfig.muted) {
      setAudioConfig({ muted: false, activeVideoIds: [videoId] });
    } else {
      // If the video is already active, toggle it off
      if (audioConfig.activeVideoIds.includes(videoId)) {
        const newActiveVideos = audioConfig.activeVideoIds.filter(id => id !== videoId);
        setAudioConfig({ ...audioConfig, activeVideoIds: newActiveVideos });
      } else {
        // Add the video to active videos
        setAudioConfig({ ...audioConfig, activeVideoIds: [...audioConfig.activeVideoIds, videoId] });
      }
    }
  };
  
  // Toggle mute all
  const handleToggleMute = () => {
    setAudioConfig({ ...audioConfig, muted: !audioConfig.muted });
  };
  
  // Remove a video
  const handleRemoveVideo = (videoId) => {
    const updatedVideos = videos.filter(video => video.id !== videoId);
    setVideos(updatedVideos);
    
    // Update audio config if necessary
    if (audioConfig.activeVideoIds.includes(videoId)) {
      setAudioConfig({
        ...audioConfig,
        activeVideoIds: audioConfig.activeVideoIds.filter(id => id !== videoId)
      });
    }
  };
  
  // Listen for IPC events from main process
  useEffect(() => {
    if (window.electron) {
      window.electron.receive('mainprocess-response', (data) => {
        console.log('Received response from main process:', data);
        
        if (data.action === 'open-videos' && data.success) {
          // Process the selected files
          const filePaths = data.filePaths;
          // In a real implementation, we would read these files from disk
          // For now, we'll mock this with placeholder data
          const mockVideos = filePaths.map(path => ({
            id: Math.random().toString(36).substr(2, 9),
            name: path.split('/').pop(),
            type: 'video/mp4',
            size: 1000000,
            url: 'placeholder' // Would be a real file URL in the actual app
          }));
          
          setVideos([...videos, ...mockVideos]);
        } else if (data.action === 'export-collage' && data.success) {
          alert(`Collage would be exported to: ${data.filePath}`);
        }
      });
      
      // Listen for menu actions
      window.electron.receive('menu-open-videos', (filePaths) => {
        console.log('Opening videos from menu:', filePaths);
        // Similar process as above
      });
      
      window.electron.receive('menu-export-collage', (filePath) => {
        console.log('Exporting collage to:', filePath);
        // Handle export
      });
    }
  }, [videos]);
  
  // Get the layout class based on the number of videos
  const getLayoutClass = () => {
    const count = videos.length;
    
    switch (layout) {
      case 'grid':
        if (count <= 1) return 'layout-single';
        if (count <= 2) return 'layout-grid-2';
        if (count <= 4) return 'layout-grid-4';
        return 'layout-grid-many';
      case 'pip':
        return 'layout-pip';
      case 'sideBySide':
        return 'layout-side-by-side';
      case 'stackedRows':
        return 'layout-stacked';
      case 'featured':
        return 'layout-featured';
      default:
        return 'layout-grid-4';
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Video Collage Maker</h1>
        <div className="app-controls">
          <button onClick={handleFileSelect} disabled={isProcessing}>
            Add Videos
          </button>
          <button onClick={handleExport} disabled={isProcessing || videos.length === 0}>
            Export Collage
          </button>
        </div>
      </header>
      
      <main className="app-content">
        {isProcessing && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Processing videos...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        
        {videos.length > 0 ? (
          <div className="collage-container">
            <div className="layout-controls">
              <h3>Layout</h3>
              <div className="layout-options">
                <button 
                  className={layout === 'grid' ? 'selected' : ''} 
                  onClick={() => handleLayoutChange('grid')}
                >
                  Grid
                </button>
                <button 
                  className={layout === 'pip' ? 'selected' : ''} 
                  onClick={() => handleLayoutChange('pip')}
                >
                  Picture-in-Picture
                </button>
                <button 
                  className={layout === 'sideBySide' ? 'selected' : ''} 
                  onClick={() => handleLayoutChange('sideBySide')}
                >
                  Side by Side
                </button>
                <button 
                  className={layout === 'stackedRows' ? 'selected' : ''} 
                  onClick={() => handleLayoutChange('stackedRows')}
                >
                  Stacked Rows
                </button>
                <button 
                  className={layout === 'featured' ? 'selected' : ''} 
                  onClick={() => handleLayoutChange('featured')}
                >
                  Featured
                </button>
              </div>
              
              <h3>Audio</h3>
              <div className="audio-controls">
                <button onClick={handleToggleMute}>
                  {audioConfig.muted ? 'Unmute All' : 'Mute All'}
                </button>
                {videos.map(video => (
                  <button 
                    key={video.id}
                    className={audioConfig.activeVideoIds.includes(video.id) ? 'selected' : ''}
                    onClick={() => handleAudioChange(video.id)}
                  >
                    {video.name.length > 15 ? video.name.substr(0, 15) + '...' : video.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={`video-canvas ${getLayoutClass()}`}>
              {videos.map(video => (
                <div key={video.id} className="video-container">
                  <div className="video-wrapper">
                    <video 
                      src={video.url} 
                      muted={audioConfig.muted || !audioConfig.activeVideoIds.includes(video.id)} 
                      autoPlay 
                      loop
                    ></video>
                    <button 
                      className="remove-video" 
                      onClick={() => handleRemoveVideo(video.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="video-info">
                    <p>{video.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>No videos added yet. Click "Add Videos" to get started.</p>
            <button onClick={handleFileSelect}>Add Videos</button>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>Video Collage Maker - Create beautiful video collages in 16:9 format</p>
      </footer>
    </div>
  );
};

// Initialize React app
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(React.createElement(VideoCollageApp));
  
  // Listen for events from the main process
  if (window.electron) {
    window.electron.send('request-mainprocess-action', { action: 'app-loaded' });
  }
});

// Add custom macOS menu handling
if (process.platform === 'darwin') {
  document.addEventListener('keydown', (e) => {
    // Command+Q to quit the application
    if (e.metaKey && e.key === 'q') {
      window.close();
    }
    
    // Command+O to open videos
    if (e.metaKey && e.key === 'o') {
      if (window.electron) {
        window.electron.send('request-mainprocess-action', { action: 'open-videos' });
      }
    }
    
    // Command+E to export collage
    if (e.metaKey && e.key === 'e') {
      if (window.electron) {
        window.electron.send('request-mainprocess-action', { action: 'export-collage' });
      }
    }
  });
}