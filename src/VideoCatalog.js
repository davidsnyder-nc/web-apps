import React, { useState, useEffect, useRef } from 'react';
import './VideoCatalog.css';

function VideoCatalog() {
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [directoryItems, setDirectoryItems] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoPlayerRef = useRef(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // Define supported file types
  const supportedVideoTypes = [
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 
    'video/x-msvideo', 'video/x-matroska', 'video/x-ms-wmv'
  ];
  
  const supportedImageTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
    'image/svg+xml', 'image/bmp', 'image/tiff'
  ];

  // Check if File System Access API is available
  const isFileSystemAccessSupported = () => {
    return 'showDirectoryPicker' in window;
  };

  // Open directory picker
  const handleSelectDirectory = async () => {
    if (!isFileSystemAccessSupported()) {
      setError('Your browser does not support the File System Access API. Please use Chrome, Edge, or another supported browser.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Show directory picker
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      setDirectoryHandle(dirHandle);
      setCurrentDirectory(dirHandle.name);
      setCurrentPath([dirHandle.name]);
      
      // Scan the directory
      await scanDirectory(dirHandle);
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        setError(`Error accessing directory: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Scan directory for files and subdirectories
  const scanDirectory = async (dirHandle, currentItems = []) => {
    setIsLoading(true);
    const items = [];
    
    try {
      // Iterate through the directory entries
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'directory') {
          // It's a directory
          items.push({
            id: Math.random().toString(36).substr(2, 9),
            name: entry.name,
            type: 'directory',
            handle: entry,
            path: [...currentPath, entry.name].join('/')
          });
        } else if (entry.kind === 'file') {
          // It's a file - check if it's a supported type
          const file = await entry.getFile();
          
          if (supportedVideoTypes.includes(file.type)) {
            // It's a video file
            items.push({
              id: Math.random().toString(36).substr(2, 9),
              name: entry.name,
              type: 'video',
              handle: entry,
              fileType: file.type,
              size: file.size,
              lastModified: new Date(file.lastModified).toLocaleDateString(),
              duration: 'Unknown', // Will be populated when file is loaded
              path: [...currentPath, entry.name].join('/')
            });
          } else if (supportedImageTypes.includes(file.type)) {
            // It's an image file
            items.push({
              id: Math.random().toString(36).substr(2, 9),
              name: entry.name,
              type: 'image',
              handle: entry,
              fileType: file.type,
              size: file.size,
              lastModified: new Date(file.lastModified).toLocaleDateString(),
              path: [...currentPath, entry.name].join('/')
            });
          }
        }
      }
      
      // Sort items: directories first, then files alphabetically
      items.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      
      setDirectoryItems(items);
    } catch (err) {
      setError(`Error scanning directory: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to a subdirectory
  const navigateToDirectory = async (item) => {
    if (item.type !== 'directory') return;
    
    setIsLoading(true);
    try {
      setCurrentDirectory(item.name);
      setCurrentPath([...currentPath, item.name]);
      await scanDirectory(item.handle);
    } catch (err) {
      setError(`Error navigating to directory: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate up one level
  const navigateUp = async () => {
    if (currentPath.length <= 1 || !directoryHandle) return;
    
    setIsLoading(true);
    try {
      const newPath = [...currentPath];
      newPath.pop();
      setCurrentPath(newPath);
      setCurrentDirectory(newPath[newPath.length - 1]);
      
      // Navigate back to the parent directory
      let parentHandle = directoryHandle;
      // Skip the first item as it's the root directory handle we already have
      for (let i = 1; i < newPath.length - 1; i++) {
        parentHandle = await parentHandle.getDirectoryHandle(newPath[i]);
      }
      
      await scanDirectory(parentHandle);
    } catch (err) {
      setError(`Error navigating up: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Play a video
  const playVideo = async (item) => {
    if (item.type !== 'video') return;
    
    try {
      const file = await item.handle.getFile();
      const url = URL.createObjectURL(file);
      
      setSelectedVideo({
        ...item,
        url
      });
      
      // If we have a video player, load and play the video
      if (videoPlayerRef.current) {
        videoPlayerRef.current.src = url;
        videoPlayerRef.current.load();
        // Don't autoplay - let user control playback
      }
    } catch (err) {
      setError(`Error playing video: ${err.message}`);
    }
  };

  // View an image
  const viewImage = async (item) => {
    if (item.type !== 'image') return;
    
    try {
      const file = await item.handle.getFile();
      const url = URL.createObjectURL(file);
      
      // Open the image in a new tab/window
      window.open(url, '_blank');
    } catch (err) {
      setError(`Error viewing image: ${err.message}`);
    }
  };

  // Create a video collage from selected videos
  const createCollage = async (item) => {
    if (item.type !== 'video') return;
    
    try {
      const file = await item.handle.getFile();
      const url = URL.createObjectURL(file);
      
      // Store the video URL in localStorage
      localStorage.setItem('collageVideos', JSON.stringify([{
        id: item.id,
        url
      }]));
      
      // Redirect to video collage app
      window.location.href = '/video-collage';
    } catch (err) {
      setError(`Error creating collage: ${err.message}`);
    }
  };

  // Filter items by search term
  const filteredItems = directoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group items by type
  const directories = filteredItems.filter(item => item.type === 'directory');
  const videos = filteredItems.filter(item => item.type === 'video');
  const images = filteredItems.filter(item => item.type === 'image');

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (selectedVideo && selectedVideo.url) {
        URL.revokeObjectURL(selectedVideo.url);
      }
    };
  }, [selectedVideo]);

  return (
    <div className="video-catalog">
      <header className="catalog-header">
        <h1>Video Catalog</h1>
        <div className="catalog-controls">
          <button onClick={() => window.location.href = '/'} className="back-button">
            Back to Apps
          </button>
          <button onClick={handleSelectDirectory} className="add-button">
            Select Directory
          </button>
        </div>
      </header>

      {!directoryHandle ? (
        <div className="empty-state">
          <h2>No Directory Selected</h2>
          <p>Select a directory to begin browsing your video and photo collection.</p>
          <button onClick={handleSelectDirectory} className="primary-button">
            Select Directory
          </button>
          {!isFileSystemAccessSupported() && (
            <p className="warning">
              Your browser does not support the File System Access API. Please use Chrome, Edge, or another supported browser.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="directory-navigation">
            <div className="breadcrumb">
              {currentPath.map((path, index) => (
                <span key={index} className="breadcrumb-item">
                  {index > 0 && <span className="separator">/</span>}
                  {path}
                </span>
              ))}
            </div>
            {currentPath.length > 1 && (
              <button onClick={navigateUp} className="up-button">
                Go Up
              </button>
            )}
          </div>

          <div className="search-filter-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading directory contents...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          ) : (
            <div className="directory-contents">
              {/* Directories */}
              {directories.length > 0 && (
                <div className="content-section">
                  <h2 className="section-title">Folders</h2>
                  <div className="folder-grid">
                    {directories.map(item => (
                      <div 
                        key={item.id} 
                        className="folder-card"
                        onClick={() => navigateToDirectory(item)}
                      >
                        <div className="folder-icon">📁</div>
                        <div className="folder-name">{item.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div className="content-section">
                  <h2 className="section-title">Videos</h2>
                  <div className="video-grid">
                    {videos.map(video => (
                      <div key={video.id} className="video-card">
                        <div 
                          className="thumbnail-container"
                          onClick={() => playVideo(video)}
                        >
                          <div className="video-placeholder">
                            <div className="play-icon">▶</div>
                          </div>
                          <span className="file-type">{video.name.split('.').pop().toUpperCase()}</span>
                        </div>
                        <div className="video-info">
                          <h3>{video.name}</h3>
                          <p className="file-details">
                            {(video.size / (1024 * 1024)).toFixed(2)} MB • {video.lastModified}
                          </p>
                          <div className="video-actions">
                            <button onClick={() => playVideo(video)}>
                              Play
                            </button>
                            <button onClick={() => createCollage(video)}>
                              Create Collage
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {images.length > 0 && (
                <div className="content-section">
                  <h2 className="section-title">Images</h2>
                  <div className="image-grid">
                    {images.map(image => (
                      <div 
                        key={image.id} 
                        className="image-card"
                        onClick={() => viewImage(image)}
                      >
                        <div className="image-placeholder">
                          <div className="image-icon">🖼️</div>
                        </div>
                        <div className="image-info">
                          <p className="image-name">{image.name}</p>
                          <p className="file-details">
                            {(image.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredItems.length === 0 && (
                <div className="no-results">
                  <p>No files found in this directory matching your search.</p>
                </div>
              )}
            </div>
          )}

          {/* Video Player */}
          {selectedVideo && (
            <div className="video-player-container">
              <div className="video-player-header">
                <h3>{selectedVideo.name}</h3>
                <button 
                  className="close-button"
                  onClick={() => {
                    URL.revokeObjectURL(selectedVideo.url);
                    setSelectedVideo(null);
                  }}
                >
                  Close
                </button>
              </div>
              <video 
                ref={videoPlayerRef}
                className="video-player"
                controls
                src={selectedVideo.url}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VideoCatalog;