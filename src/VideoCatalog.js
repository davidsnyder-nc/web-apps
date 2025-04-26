import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import './VideoCatalog.css';
import SimpleVideoCard from './components/SimpleVideoCard';

// Image Card Component with Thumbnail Generation
const ImageCard = ({ image, viewImage }) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        let imageFile;
        
        if (image.isLegacyFile && image.file) {
          // Safari fallback
          imageFile = image.file;
        } else {
          // File System Access API
          imageFile = await image.handle.getFile();
        }
        
        // Create a URL for the image file
        const url = URL.createObjectURL(imageFile);
        setThumbnail(url);
        setLoading(false);
      } catch (err) {
        console.error('Error generating image thumbnail:', err);
        setLoading(false);
      }
    };
    
    generateThumbnail();
    
    // Clean up
    return () => {
      if (thumbnail) {
        URL.revokeObjectURL(thumbnail);
      }
    };
  }, [image]);
  
  return (
    <div 
      className="image-card"
      onClick={() => viewImage(image)}
    >
      <div className="image-placeholder">
        {loading ? (
          <div className="image-icon">🖼️</div>
        ) : (
          <img 
            src={thumbnail} 
            alt={image.name} 
            className="image-thumbnail" 
          />
        )}
      </div>
      <div className="image-info">
        <p className="image-name">{image.name}</p>
        <p className="file-details">
          {(image.size / (1024 * 1024)).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
};

// Ultra-basic Video Card Component
const VideoCard = ({ video, createCollage }) => {
  const [videoUrl, setVideoUrl] = useState('');
  
  // Function to load the video file when needed
  const handleLoadVideo = async () => {
    try {
      if (videoUrl) return; // Already loaded
      
      // Get the file
      let file;
      if (video.isLegacyFile && video.file) {
        file = video.file;
      } else {
        file = await video.handle.getFile();
      }
      
      // Create object URL
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } catch (error) {
      console.error("Failed to load video:", error);
    }
  };
  
  // Load video on mount
  useEffect(() => {
    handleLoadVideo();
    
    // Cleanup when component unmounts
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, []);
  
  return (
    <div className="video-card">
      <div className="video-info">
        <h3>{video.name}</h3>
        <p className="file-details">
          {(video.size / (1024 * 1024)).toFixed(2)} MB • {video.lastModified}
        </p>
        
        {/* Main video container */}
        <div style={{marginTop: '10px', marginBottom: '10px'}}>
          {videoUrl ? (
            <video 
              src={videoUrl}
              controls
              width="100%"
              height="auto"
            />
          ) : (
            <div className="video-placeholder" onClick={handleLoadVideo}>
              <div className="play-icon">▶</div>
              <div>Click to load video</div>
            </div>
          )}
        </div>
        
        <div className="video-actions">
          <button onClick={() => createCollage(video)}>
            Create Collage
          </button>
        </div>
      </div>
    </div>
  );
};

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
  // Track current video index for autoplay next feature
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  const [hasPermission, setHasPermission] = useState(false);
  
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

  // Handle file input for Safari and other browsers without File System Access API
  const handleFileInputSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const items = [];
      
      // Process each file
      files.forEach(file => {
        if (supportedVideoTypes.includes(file.type)) {
          // It's a video file
          items.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: 'video',
            file: file, // Store the actual file for Safari
            fileType: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified).toLocaleDateString(),
            duration: 'Unknown',
            path: file.name,
            isLegacyFile: true // Flag to indicate this is from file input, not directory API
          });
        } else if (supportedImageTypes.includes(file.type)) {
          // It's an image file
          items.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: 'image',
            file: file, // Store the actual file for Safari
            fileType: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified).toLocaleDateString(),
            path: file.name,
            isLegacyFile: true // Flag to indicate this is from file input, not directory API
          });
        }
      });
      
      // Sort by name
      items.sort((a, b) => a.name.localeCompare(b.name));
      
      // Set the directory items
      setDirectoryItems(items);
      setCurrentDirectory('Selected Files');
      setCurrentPath(['Selected Files']);
    } catch (err) {
      setError(`Error processing files: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Open directory picker
  const handleSelectDirectory = async () => {
    if (isFileSystemAccessSupported()) {
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
        setHasPermission(true);
        
        // Scan the directory
        await scanDirectory(dirHandle);
        
        // Store directory ID if available
        if ('id' in FileSystemHandle.prototype) {
          localStorage.setItem('selectedDirectoryId', dirHandle.id);
        }
      } catch (err) {
        // User cancelled or error occurred
        if (err.name !== 'AbortError') {
          setError(`Error accessing directory: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Safari fallback: use file input with 'webkitdirectory' attribute when possible
      // or just allow multiple file selection
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true; // Allow selecting multiple files
      input.accept = supportedVideoTypes.concat(supportedImageTypes).join(',');
      input.onchange = handleFileInputSelection;
      input.click();
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
  
  // Navigate to a specific point in the breadcrumb
  const navigateToBreadcrumb = async (index) => {
    if (!directoryHandle) return;
    if (index === currentPath.length - 1) return; // Already at this location
    
    setIsLoading(true);
    try {
      // Create a new path up to the clicked breadcrumb item
      const newPath = currentPath.slice(0, index + 1);
      setCurrentPath(newPath);
      setCurrentDirectory(newPath[newPath.length - 1]);
      
      // Navigate to the selected directory
      let targetHandle = directoryHandle;
      // Skip the first item as it's the root directory handle we already have
      for (let i = 1; i < newPath.length; i++) {
        targetHandle = await targetHandle.getDirectoryHandle(newPath[i]);
      }
      
      await scanDirectory(targetHandle);
    } catch (err) {
      setError(`Error navigating to directory: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a video collage from selected videos - we're keeping this function
  const createCollage = async (item) => {
    if (item.type !== 'video') return;
    
    try {
      let url;
      
      if (item.isLegacyFile && item.file) {
        // Safari fallback: use the file directly
        url = URL.createObjectURL(item.file);
      } else {
        // File System Access API
        const file = await item.handle.getFile();
        url = URL.createObjectURL(file);
      }
      
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

  // State for selected image viewer
  const [selectedImage, setSelectedImage] = useState(null);
  
  // View an image in the modal viewer
  const viewImage = async (item) => {
    if (item.type !== 'image') return;
    
    try {
      let url;
      
      if (item.isLegacyFile && item.file) {
        // Safari fallback: use the file directly
        url = URL.createObjectURL(item.file);
      } else {
        // File System Access API
        const file = await item.handle.getFile();
        url = URL.createObjectURL(file);
      }
      
      // Set the selected image for the modal
      setSelectedImage({
        ...item,
        url
      });
    } catch (err) {
      setError(`Error viewing image: ${err.message}`);
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

  // Try to restore previously selected directory from localStorage on component mount
  useEffect(() => {
    const restorePreviousSession = async () => {
      if (!isFileSystemAccessSupported()) return;
      
      try {
        // Check if we have a stored directory ID
        const storedDirId = localStorage.getItem('selectedDirectoryId');
        
        if (storedDirId) {
          // Show loading state while trying to restore
          setIsLoading(true);
          
          // If the File System Access API exists and supports requestPermission
          if ('showDirectoryPicker' in window && 'id' in FileSystemHandle.prototype) {
            // Try to access the directory using the stored ID
            try {
              // Request permission to use the directory again
              // This will prompt the user if necessary
              const dirHandle = await window.showDirectoryPicker({
                id: storedDirId,
                mode: 'read',
                startIn: 'desktop'
              });
              
              setDirectoryHandle(dirHandle);
              setCurrentDirectory(dirHandle.name);
              setCurrentPath([dirHandle.name]);
              
              // Scan the directory contents
              await scanDirectory(dirHandle);
              
              // Permission granted
              setHasPermission(true);
            } catch (err) {
              // User denied permission or directory no longer exists
              console.warn('Could not restore directory access:', err);
              localStorage.removeItem('selectedDirectoryId');
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
        setIsLoading(false);
      }
    };
    
    restorePreviousSession();
  }, []);
  
  // Save directory ID when it changes
  useEffect(() => {
    if (directoryHandle && 'id' in FileSystemHandle.prototype) {
      // Store the directory ID for future sessions
      localStorage.setItem('selectedDirectoryId', directoryHandle.id);
    }
  }, [directoryHandle]);
  
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
          {localStorage.getItem('selectedDirectoryId') && (
            <button 
              onClick={() => {
                localStorage.removeItem('selectedDirectoryId');
                window.location.reload();
              }} 
              className="back-button"
            >
              Reset Selection
            </button>
          )}
        </div>
      </header>

      {!directoryHandle && directoryItems.length === 0 ? (
        <div className="empty-state">
          <h2>No Files Selected</h2>
          <p>
            {isFileSystemAccessSupported() 
              ? "Select a directory to begin browsing your video and photo collection." 
              : "Select video and photo files to view in the catalog."}
          </p>
          <button onClick={handleSelectDirectory} className="primary-button">
            {isFileSystemAccessSupported() ? "Select Directory" : "Select Files"}
          </button>
          {!isFileSystemAccessSupported() && (
            <p className="note">
              Note: Your browser (Safari or other) doesn't support directory browsing. 
              You can still select multiple files at once instead.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="directory-navigation">
            <div className="breadcrumb">
              {currentPath.map((path, index) => (
                <span 
                  key={index} 
                  className="breadcrumb-item"
                  onClick={() => navigateToBreadcrumb(index)}
                >
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
              <p>
                {localStorage.getItem('selectedDirectoryId') && !directoryHandle ? 
                 "Attempting to restore your previous directory selection..." :
                 "Loading directory contents..."}
              </p>
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
                    {videos.map((video) => (
                      <SimpleVideoCard 
                        key={video.id} 
                        video={video}
                        createCollage={createCollage} 
                      />
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
                      <ImageCard 
                        key={image.id} 
                        image={image}
                        viewImage={viewImage}
                      />
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

          {/* Video Player removed - using embedded player in cards instead */}
          
          {/* Image Viewer */}
          {selectedImage && (
            <div className="image-viewer-container">
              <div className="image-viewer-header">
                <h3>{selectedImage.name}</h3>
                <button 
                  className="close-button"
                  onClick={() => {
                    URL.revokeObjectURL(selectedImage.url);
                    setSelectedImage(null);
                  }}
                >
                  Close
                </button>
              </div>
              <div className="image-viewer-content">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.name} 
                  className="full-image"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VideoCatalog;