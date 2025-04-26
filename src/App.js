import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { processVideos } from './utils/videoProcessor';

function App() {
  const [videos, setVideos] = useState([]);
  const [layout, setLayout] = useState('grid');
  const [audioConfig, setAudioConfig] = useState({ muted: false, activeVideoIds: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [popoutWindow, setPopoutWindow] = useState(null);
  const canvasRef = useRef(null);
  
  // Handle file selection
  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'video/*';
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      processVideoFiles(files);
    };
    input.click();
  };
  
  // Check if we have videos from the Video Catalog app
  useEffect(() => {
    const collageVideosFromCatalog = localStorage.getItem('collageVideos');
    if (collageVideosFromCatalog) {
      try {
        // Parse the videos from localStorage
        const catalogVideos = JSON.parse(collageVideosFromCatalog);
        
        if (Array.isArray(catalogVideos) && catalogVideos.length > 0) {
          // Process the videos from the catalog
          const processedVideos = catalogVideos.map(video => ({
            id: video.id || Math.random().toString(36).substr(2, 9),
            name: video.name || 'Video from catalog',
            url: video.url
          }));
          
          // Add the videos to the collage
          setVideos(prevVideos => [...prevVideos, ...processedVideos]);
          
          // Set default audio config (first video has audio)
          if (audioConfig.activeVideoIds.length === 0 && processedVideos.length > 0) {
            setAudioConfig(prevConfig => ({ 
              ...prevConfig, 
              activeVideoIds: [processedVideos[0].id] 
            }));
          }
        }
      } catch (err) {
        console.error('Error processing catalog videos:', err);
        setError(`Error loading videos from catalog: ${err.message}`);
      }
      
      // Clear localStorage to prevent re-loading on refresh
      localStorage.removeItem('collageVideos');
    }
  }, []);
  
  // Process video files
  const processVideoFiles = async (files) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create URL objects for each video file
      const processedVideos = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      }));
      
      setVideos(prevVideos => [...prevVideos, ...processedVideos]);
      
      // Set default audio config (first video has audio)
      if (processedVideos.length > 0 && audioConfig.activeVideoIds.length === 0) {
        setAudioConfig(prevConfig => ({ 
          ...prevConfig, 
          activeVideoIds: [processedVideos[0].id] 
        }));
      }
    } catch (err) {
      setError(`Failed to process videos: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle export
  const handleExport = () => {
    if (videos.length === 0) {
      setError('No videos to export');
      return;
    }
    
    alert('Export functionality would save the video collage as an MP4 file. This feature requires server-side processing.');
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
  
  // Handle pop-out functionality
  const handlePopout = () => {
    if (videos.length === 0) return;
    
    // Close existing popout if it exists
    if (popoutWindow && !popoutWindow.closed) {
      popoutWindow.close();
    }
    
    // Open a new popup window
    const newWindow = window.open('', 'Video Collage', 'width=1280,height=720');
    setPopoutWindow(newWindow);
    
    // Create HTML content for the popout window with all layout CSS
    const popoutContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Video Collage</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            background-color: #000;
          }
          
          .video-canvas {
            width: 100%;
            height: 100vh;
            position: relative;
            overflow: hidden;
          }
          
          .video-container {
            position: absolute;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          /* Layout styles */
          /* Single video */
          .layout-single .video-container {
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
          
          /* Grid layout - 2 videos */
          .layout-grid-2 .video-container:nth-child(1) {
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
          }
          .layout-grid-2 .video-container:nth-child(2) {
            top: 0;
            left: 50%;
            width: 50%;
            height: 100%;
          }
          
          /* Grid layout - 4 videos */
          .layout-grid-4 .video-container:nth-child(1) {
            top: 0;
            left: 0;
            width: 50%;
            height: 50%;
          }
          .layout-grid-4 .video-container:nth-child(2) {
            top: 0;
            left: 50%;
            width: 50%;
            height: 50%;
          }
          .layout-grid-4 .video-container:nth-child(3) {
            top: 50%;
            left: 0;
            width: 50%;
            height: 50%;
          }
          .layout-grid-4 .video-container:nth-child(4) {
            top: 50%;
            left: 50%;
            width: 50%;
            height: 50%;
          }
          
          /* Grid layout - many videos */
          .layout-grid-many .video-container {
            width: calc(100% / 3);
            height: calc(100% / 3);
          }
          .layout-grid-many .video-container:nth-child(1) { top: 0; left: 0; }
          .layout-grid-many .video-container:nth-child(2) { top: 0; left: calc(100% / 3); }
          .layout-grid-many .video-container:nth-child(3) { top: 0; left: calc(100% / 3 * 2); }
          .layout-grid-many .video-container:nth-child(4) { top: calc(100% / 3); left: 0; }
          .layout-grid-many .video-container:nth-child(5) { top: calc(100% / 3); left: calc(100% / 3); }
          .layout-grid-many .video-container:nth-child(6) { top: calc(100% / 3); left: calc(100% / 3 * 2); }
          .layout-grid-many .video-container:nth-child(7) { top: calc(100% / 3 * 2); left: 0; }
          .layout-grid-many .video-container:nth-child(8) { top: calc(100% / 3 * 2); left: calc(100% / 3); }
          .layout-grid-many .video-container:nth-child(9) { top: calc(100% / 3 * 2); left: calc(100% / 3 * 2); }
          
          /* Picture-in-Picture layout */
          .layout-pip .video-container:nth-child(1) {
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }
          .layout-pip .video-container:nth-child(2) {
            bottom: 20px;
            right: 20px;
            width: 30%;
            height: 30%;
            z-index: 2;
          }
          .layout-pip .video-container:nth-child(3) {
            bottom: 20px;
            left: 20px;
            width: 30%;
            height: 30%;
            z-index: 2;
          }
          .layout-pip .video-container:nth-child(4) {
            top: 20px;
            right: 20px;
            width: 30%;
            height: 30%;
            z-index: 2;
          }
          
          /* Side by Side layout */
          .layout-side-by-side .video-container {
            top: 0;
            height: 100%;
          }
          .layout-side-by-side .video-container:nth-child(1) { left: 0; width: calc(100% / var(--video-count, 2)); }
          .layout-side-by-side .video-container:nth-child(2) { left: calc(100% / var(--video-count, 2)); width: calc(100% / var(--video-count, 2)); }
          .layout-side-by-side .video-container:nth-child(3) { left: calc(100% / var(--video-count, 2) * 2); width: calc(100% / var(--video-count, 2)); }
          .layout-side-by-side .video-container:nth-child(4) { left: calc(100% / var(--video-count, 2) * 3); width: calc(100% / var(--video-count, 2)); }
          
          /* Stacked Rows layout */
          .layout-stacked .video-container {
            left: 0;
            width: 100%;
          }
          .layout-stacked .video-container:nth-child(1) { top: 0; height: calc(100% / var(--video-count, 2)); }
          .layout-stacked .video-container:nth-child(2) { top: calc(100% / var(--video-count, 2)); height: calc(100% / var(--video-count, 2)); }
          .layout-stacked .video-container:nth-child(3) { top: calc(100% / var(--video-count, 2) * 2); height: calc(100% / var(--video-count, 2)); }
          .layout-stacked .video-container:nth-child(4) { top: calc(100% / var(--video-count, 2) * 3); height: calc(100% / var(--video-count, 2)); }
          
          /* Featured layout */
          .layout-featured .video-container:nth-child(1) {
            top: 0;
            left: 0;
            width: 66.67%;
            height: 100%;
          }
          .layout-featured .video-container:nth-child(2) {
            top: 0;
            left: 66.67%;
            width: 33.33%;
            height: 33.33%;
          }
          .layout-featured .video-container:nth-child(3) {
            top: 33.33%;
            left: 66.67%;
            width: 33.33%;
            height: 33.33%;
          }
          .layout-featured .video-container:nth-child(4) {
            top: 66.67%;
            left: 66.67%;
            width: 33.33%;
            height: 33.33%;
          }
        </style>
      </head>
      <body>
        <div id="collage-container" class="video-canvas ${getLayoutClass()}" style="--video-count: ${videos.length}"></div>
        <script>
          // This script will be populated from the parent window
          const updateCollage = (videos, layout, audioConfig) => {
            const container = document.getElementById('collage-container');
            container.innerHTML = '';
            container.className = 'video-canvas ' + layout;
            container.style.setProperty('--video-count', videos.length);
            
            videos.forEach(video => {
              const videoContainer = document.createElement('div');
              videoContainer.className = 'video-container';
              videoContainer.dataset.id = video.id;
              
              const videoElement = document.createElement('video');
              videoElement.src = video.url;
              videoElement.muted = audioConfig.muted || !audioConfig.activeVideoIds.includes(video.id);
              videoElement.loop = true;
              videoElement.playsInline = true;
              videoElement.controls = true;
              
              videoContainer.appendChild(videoElement);
              container.appendChild(videoContainer);
            });
          };
          
          // Function to receive messages from the parent window
          window.addEventListener('message', (event) => {
            const data = event.data;
            if (data.type === 'updateCollage') {
              updateCollage(data.videos, data.layout, data.audioConfig);
            }
          });
        </script>
      </body>
      </html>
    `;
    
    // Write content to the new window
    newWindow.document.write(popoutContent);
    newWindow.document.close();
    
    // Update the popout window with video data
    const sendDataToPopout = () => {
      if (newWindow && !newWindow.closed) {
        newWindow.postMessage({
          type: 'updateCollage',
          videos,
          layout: getLayoutClass(),
          audioConfig
        }, '*');
      }
    };
    
    // Give a small delay to allow the window to fully load
    setTimeout(sendDataToPopout, 500);
  };
  
  // Clean up object URLs when component unmounts or videos change
  useEffect(() => {
    return () => {
      videos.forEach(video => {
        if (video.url.startsWith('blob:')) {
          URL.revokeObjectURL(video.url);
        }
      });
    };
  }, [videos]);
  
  // Keep popout window in sync with main window
  useEffect(() => {
    if (popoutWindow && !popoutWindow.closed) {
      popoutWindow.postMessage({
        type: 'updateCollage',
        videos,
        layout: getLayoutClass(),
        audioConfig
      }, '*');
    }
  }, [videos, layout, audioConfig, popoutWindow]);
  
  // Close popout window when component unmounts
  useEffect(() => {
    return () => {
      if (popoutWindow && !popoutWindow.closed) {
        popoutWindow.close();
      }
    };
  }, [popoutWindow]);
  
  // Get the layout class based on the number of videos and selected layout
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
        <h1>Video Collage Creator</h1>
        <div className="app-controls">
          <button onClick={() => window.location.href = '/'} className="back-button">
            Back to Apps
          </button>
          <button onClick={handleFileSelect} disabled={isProcessing}>
            Add Videos
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
              <div className="control-section">
                <h3>Layout</h3>
                <div className="layout-dropdown-container">
                  <div className="layout-dropdown">
                    <button className="dropdown-button">
                      {layout === 'grid' ? 'Grid' : 
                       layout === 'pip' ? 'Picture-in-Picture' :
                       layout === 'sideBySide' ? 'Side by Side' :
                       layout === 'stackedRows' ? 'Stacked Rows' :
                       layout === 'featured' ? 'Featured' : 'Select Layout'} <span className="dropdown-arrow">▼</span>
                    </button>
                    <div className="dropdown-content">
                      <div 
                        className={`dropdown-item ${layout === 'grid' ? 'selected' : ''}`}
                        onClick={() => handleLayoutChange('grid')}
                      >
                        <span>Grid</span>
                      </div>
                      <div 
                        className={`dropdown-item ${layout === 'pip' ? 'selected' : ''}`}
                        onClick={() => handleLayoutChange('pip')}
                      >
                        <span>Picture-in-Picture</span>
                      </div>
                      <div 
                        className={`dropdown-item ${layout === 'sideBySide' ? 'selected' : ''}`}
                        onClick={() => handleLayoutChange('sideBySide')}
                      >
                        <span>Side by Side</span>
                      </div>
                      <div 
                        className={`dropdown-item ${layout === 'stackedRows' ? 'selected' : ''}`}
                        onClick={() => handleLayoutChange('stackedRows')}
                      >
                        <span>Stacked Rows</span>
                      </div>
                      <div 
                        className={`dropdown-item ${layout === 'featured' ? 'selected' : ''}`}
                        onClick={() => handleLayoutChange('featured')}
                      >
                        <span>Featured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="control-section">
                <h3>Audio</h3>
                <div className="audio-controls-container">
                  <div className="audio-dropdown">
                    <button className="dropdown-button">
                      Audio Settings <span className="dropdown-arrow">▼</span>
                    </button>
                    <div className="dropdown-content">
                      <div className="dropdown-item" onClick={handleToggleMute}>
                        <input 
                          type="checkbox" 
                          checked={!audioConfig.muted} 
                          onChange={handleToggleMute}
                        />
                        <span>{audioConfig.muted ? 'Unmute All' : 'Mute All'}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      {videos.map(video => (
                        <div 
                          key={video.id} 
                          className="dropdown-item"
                          onClick={() => handleAudioChange(video.id)}
                        >
                          <input 
                            type="checkbox" 
                            checked={!audioConfig.muted && audioConfig.activeVideoIds.includes(video.id)} 
                            onChange={() => handleAudioChange(video.id)}
                          />
                          <span>{video.name.length > 25 ? video.name.substr(0, 25) + '...' : video.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`video-canvas ${getLayoutClass()}`} style={{'--video-count': videos.length}}>
              {videos.map(video => (
                <div key={video.id} className="video-container">
                  <div className="video-wrapper">
                    <video 
                      src={video.url} 
                      muted={audioConfig.muted || !audioConfig.activeVideoIds.includes(video.id)} 
                      loop
                      playsInline
                      controls
                    ></video>
                    <button 
                      className="remove-video" 
                      onClick={() => handleRemoveVideo(video.id)}
                      aria-label="Remove video"
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
    </div>
  );
}

export default App;