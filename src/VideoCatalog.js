import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import './VideoCatalog.css';
import SimpleVideoCard from './components/SimpleVideoCard';
import { v4 as uuidv4 } from 'uuid';
import { VideoCatalogIcon } from './assets/video-catalog-icon';

// Set to true to use the File System Access API (for modern browsers)
// Set to false to use the legacy file input method (for older browsers)
const USE_FILE_SYSTEM_ACCESS_API = true;

function VideoCatalog() {
  // State for directory browsing
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [directoryPath, setDirectoryPath] = useState([]);
  const [currentDirectoryName, setCurrentDirectoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for directory contents
  const [directories, setDirectories] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [displayedVideos, setDisplayedVideos] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [displayedImages, setDisplayedImages] = useState([]);
  const [otherFiles, setOtherFiles] = useState([]);
  
  // State for video playback
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // State for image viewing
  const [currentImage, setCurrentImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewingImage, setIsViewingImage] = useState(false);
  
  // State for pinned image
  const [pinnedImage, setPinnedImage] = useState(null);
  const [pinnedImageIds, setPinnedImageIds] = useState([]);
  
  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Ref for keyboard navigation
  const keyboardNavRef = useRef(null);
  
  // Function to select a directory using the File System Access API
  const selectDirectory = async () => {
    try {
      // Request user to select a directory
      const dirHandle = await window.showDirectoryPicker();
      
      // Save the directory handle in state
      setDirectoryHandle(dirHandle);
      setCurrentDirectoryName(dirHandle.name);
      setDirectoryPath([{ name: dirHandle.name, handle: dirHandle }]);
      
      // Store the directory ID for later use
      localStorage.setItem('selectedDirectoryId', dirHandle.name);
      
      // Load the directory contents
      setIsLoading(true);
      await loadDirectoryContents(dirHandle);
      setIsLoading(false);
    } catch (err) {
      console.error('Error selecting directory:', err);
      if (err.name === 'AbortError') {
        // User canceled the directory picker
        setError(null);
      } else {
        setError(`Error selecting directory: ${err.message}`);
      }
      setIsLoading(false);
    }
  };
  
  // Function to use the legacy file input method
  const selectFilesLegacy = (event) => {
    const files = event.target.files;
    
    if (files.length === 0) {
      return;
    }
    
    // Process the selected files
    setIsLoading(true);
    
    // Extract the directory name from the first file's path
    const firstFilePath = files[0].webkitRelativePath;
    const dirName = firstFilePath.split('/')[0];
    
    setCurrentDirectoryName(dirName);
    setDirectoryPath([{ name: dirName, isLegacyDirectory: true }]);
    
    // Process files
    processLegacyFiles(files);
    
    setIsLoading(false);
  };
  
  // Process files selected via the legacy method
  const processLegacyFiles = (files) => {
    const videos = [];
    const images = [];
    const dirs = new Map();
    const others = [];
    
    // Group files by their directory
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pathParts = file.webkitRelativePath.split('/');
      
      // Skip the root directory itself
      if (pathParts.length <= 1) continue;
      
      // If this is a subdirectory (depth > 1)
      if (pathParts.length > 2) {
        const dirName = pathParts[1];
        if (!dirs.has(dirName)) {
          dirs.set(dirName, {
            name: dirName,
            isLegacyDirectory: true,
            path: [pathParts[0], dirName]
          });
        }
        continue;
      }
      
      // This is a file in the root directory
      const fileName = pathParts[pathParts.length - 1];
      const fileExt = fileName.split('.').pop().toLowerCase();
      
      // Create a unique ID for the file
      const fileId = uuidv4();
      
      // Create a file object with metadata
      const fileObj = {
        id: fileId,
        name: fileName,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toLocaleString(),
        file: file,
        isLegacyFile: true,
      };
      
      // Categorize the file based on its type
      if (file.type.startsWith('video/')) {
        videos.push(fileObj);
      } else if (file.type.startsWith('image/')) {
        images.push(fileObj);
      } else {
        others.push(fileObj);
      }
    }
    
    // Update state with the processed files
    setDirectories(Array.from(dirs.values()));
    setAllVideos(videos);
    setDisplayedVideos(videos.slice(0, itemsPerPage));
    setAllImages(images);
    setDisplayedImages(images.slice(0, itemsPerPage));
    setOtherFiles(others);
    setCurrentPage(1);
  };
  
  // Function to load the contents of a directory
  const loadDirectoryContents = async (dirHandle) => {
    try {
      const videos = [];
      const images = [];
      const dirs = [];
      const others = [];
      
      // Iterate through all entries in the directory
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'directory') {
          // This is a subdirectory
          dirs.push({
            name: entry.name,
            handle: entry,
          });
        } else if (entry.kind === 'file') {
          // This is a file - get its metadata
          const file = await entry.getFile();
          const fileName = entry.name;
          const fileExt = fileName.split('.').pop().toLowerCase();
          
          // Create a unique ID for the file
          const fileId = uuidv4();
          
          // Create a file object with metadata
          const fileObj = {
            id: fileId,
            name: fileName,
            type: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified).toLocaleString(),
            handle: entry,
          };
          
          // Categorize the file based on its type
          if (file.type.startsWith('video/')) {
            videos.push(fileObj);
          } else if (file.type.startsWith('image/')) {
            images.push(fileObj);
          } else {
            others.push(fileObj);
          }
        }
      }
      
      // Update state with the directory contents
      setDirectories(dirs);
      setAllVideos(videos);
      setDisplayedVideos(videos.slice(0, itemsPerPage));
      setAllImages(images);
      setDisplayedImages(images.slice(0, itemsPerPage));
      setOtherFiles(others);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error reading directory:', err);
      setError(`Error reading directory: ${err.message}`);
    }
  };
  
  // Function to navigate into a subdirectory
  const navigateToDirectory = async (dirIndex) => {
    try {
      setIsLoading(true);
      
      const dir = directories[dirIndex];
      
      if (dir.isLegacyDirectory) {
        // For legacy directories, we can't navigate deeper
        setError("Cannot navigate deeper with the legacy file input method. Please use a modern browser that supports the File System Access API.");
        setIsLoading(false);
        return;
      }
      
      // Update the directory path
      setDirectoryPath(prevPath => [...prevPath, dir]);
      setCurrentDirectoryName(dir.name);
      
      // Load the contents of the selected directory
      await loadDirectoryContents(dir.handle);
      setIsLoading(false);
    } catch (err) {
      console.error('Error navigating to directory:', err);
      setError(`Error navigating to directory: ${err.message}`);
      setIsLoading(false);
    }
  };
  
  // Function to navigate to a specific directory in the path
  const navigateToPathIndex = async (pathIndex) => {
    if (pathIndex >= directoryPath.length) return;
    
    try {
      setIsLoading(true);
      
      // Get the directory at the specified path index
      const dir = directoryPath[pathIndex];
      
      if (dir.isLegacyDirectory && pathIndex > 0) {
        // For legacy directories, we can't navigate
        setError("Cannot navigate with the legacy file input method. Please use a modern browser that supports the File System Access API.");
        setIsLoading(false);
        return;
      }
      
      // Update the directory path
      setDirectoryPath(directoryPath.slice(0, pathIndex + 1));
      setCurrentDirectoryName(dir.name);
      
      // Load the contents of the selected directory
      if (dir.handle) {
        await loadDirectoryContents(dir.handle);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error navigating to path:', err);
      setError(`Error navigating to path: ${err.message}`);
      setIsLoading(false);
    }
  };
  
  // Function to navigate up one level in the directory hierarchy
  const navigateUp = async () => {
    if (directoryPath.length <= 1) return;
    
    try {
      setIsLoading(true);
      
      // Get the parent directory
      const parentDir = directoryPath[directoryPath.length - 2];
      
      // Update the directory path
      setDirectoryPath(directoryPath.slice(0, directoryPath.length - 1));
      setCurrentDirectoryName(parentDir.name);
      
      // Load the contents of the parent directory
      if (parentDir.handle) {
        await loadDirectoryContents(parentDir.handle);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error navigating up:', err);
      setError(`Error navigating up: ${err.message}`);
      setIsLoading(false);
    }
  };
  
  // Function to open a video file for playback
  const openVideo = (videoIndex) => {
    setCurrentVideo(allVideos[videoIndex]);
    setIsFullscreen(true);
  };
  
  // Function to close the fullscreen video player
  const closeVideoPlayer = () => {
    setIsFullscreen(false);
    setCurrentVideo(null);
  };
  
  // Function to open an image for viewing
  const openImage = (imageIndex) => {
    setCurrentImageIndex(imageIndex);
    setCurrentImage(allImages[imageIndex]);
    setIsViewingImage(true);
  };
  
  // Function to close the image viewer
  const closeImageViewer = () => {
    setIsViewingImage(false);
    
    // Keep the URL objects valid until we're done with them
    setTimeout(() => {
      if (currentImage && currentImage.objectUrl) {
        URL.revokeObjectURL(currentImage.objectUrl);
      }
      setCurrentImage(null);
    }, 300);
  };
  
  // Function to navigate to the next image in the viewer
  const nextImage = useCallback(() => {
    if (!allImages.length) return;
    const nextIndex = (currentImageIndex + 1) % allImages.length;
    setCurrentImageIndex(nextIndex);
    setCurrentImage(allImages[nextIndex]);
  }, [allImages, currentImageIndex]);
  
  // Function to navigate to the previous image in the viewer
  const prevImage = useCallback(() => {
    if (!allImages.length) return;
    const prevIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
    setCurrentImageIndex(prevIndex);
    setCurrentImage(allImages[prevIndex]);
  }, [allImages, currentImageIndex]);
  
  // Function to toggle the pinned status of an image
  const togglePinImage = async (imageId) => {
    // Check if we already have this image pinned
    if (pinnedImageIds.includes(imageId)) {
      // Unpin the image
      setPinnedImageIds(prevIds => prevIds.filter(id => id !== imageId));
      
      // If this is the currently pinned image, remove it
      if (pinnedImage && pinnedImage.id === imageId) {
        // Clean up URL object
        if (pinnedImage.url) {
          URL.revokeObjectURL(pinnedImage.url);
        }
        setPinnedImage(null);
      }
    } else {
      // Pin the image - find it in all images
      const imageToPinIndex = allImages.findIndex(img => img.id === imageId);
      if (imageToPinIndex === -1) return;
      
      const imageToPin = allImages[imageToPinIndex];
      
      // Load the image file for pinned display
      try {
        let url;
        if (imageToPin.isLegacyFile && imageToPin.file) {
          url = URL.createObjectURL(imageToPin.file);
        } else {
          const file = await imageToPin.handle.getFile();
          url = URL.createObjectURL(file);
        }
        
        setPinnedImage({
          ...imageToPin,
          url: url
        });
        
        // Add to pinned IDs
        setPinnedImageIds(prevIds => [...prevIds, imageId]);
      } catch (err) {
        console.error('Error pinning image:', err);
        setError(`Error pinning image: ${err.message}`);
      }
    }
  };
  
  // Function to handle search filtering
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // If search is empty, show all videos and images
      setDisplayedVideos(allVideos.slice(0, itemsPerPage));
      setDisplayedImages(allImages.slice(0, itemsPerPage));
      setCurrentPage(1);
      return;
    }
    
    // Filter videos and images by name
    const searchLower = searchTerm.toLowerCase();
    
    const filteredVideos = allVideos.filter(video => 
      video.name.toLowerCase().includes(searchLower)
    );
    
    const filteredImages = allImages.filter(image => 
      image.name.toLowerCase().includes(searchLower)
    );
    
    // Update displayed files
    setDisplayedVideos(filteredVideos.slice(0, itemsPerPage));
    setDisplayedImages(filteredImages.slice(0, itemsPerPage));
    setCurrentPage(1);
  };
  
  // Function to handle pagination
  const handlePageChange = (newPage) => {
    const startIndex = (newPage - 1) * itemsPerPage;
    
    if (!searchTerm.trim()) {
      // If no search, paginate all files
      setDisplayedVideos(allVideos.slice(startIndex, startIndex + itemsPerPage));
      setDisplayedImages(allImages.slice(startIndex, startIndex + itemsPerPage));
    } else {
      // If searching, paginate filtered files
      const searchLower = searchTerm.toLowerCase();
      
      const filteredVideos = allVideos.filter(video => 
        video.name.toLowerCase().includes(searchLower)
      );
      
      const filteredImages = allImages.filter(image => 
        image.name.toLowerCase().includes(searchLower)
      );
      
      setDisplayedVideos(filteredVideos.slice(startIndex, startIndex + itemsPerPage));
      setDisplayedImages(filteredImages.slice(startIndex, startIndex + itemsPerPage));
    }
    
    setCurrentPage(newPage);
  };
  
  // Effect to handle keyboard navigation for image viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isViewingImage) return;
      
      switch (e.key) {
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'Escape':
          closeImageViewer();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isViewingImage, nextImage, prevImage]);
  
  // Effect to check for stored directory ID on component mount
  useEffect(() => {
    const restorePreviousDirectory = async () => {
      try {
        const storedDirId = localStorage.getItem('selectedDirectoryId');
        
        if (storedDirId && USE_FILE_SYSTEM_ACCESS_API) {
          setIsLoading(true);
          
          // Check if we have permission to access the file system
          if ('showDirectoryPicker' in window) {
            try {
              // For security reasons, we can't directly reopen a directory
              // The user will need to select it again
              // This is just a placeholder
              setError("Your previously selected directory cannot be automatically reopened. Please select a directory again.");
            } catch (err) {
              console.error('Error restoring directory access:', err);
              setError(`Error restoring directory access: ${err.message}`);
            }
          } else {
            setError("This browser doesn't support the File System Access API. Please use the legacy file input method.");
          }
          
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error restoring previous directory:', err);
        setIsLoading(false);
      }
    };
    
    restorePreviousDirectory();
  }, []);
  
  // Function to render image viewer content
  const renderImageViewer = () => {
    const [imageUrl, setImageUrl] = useState(null);
    
    // Load the image when component mounts
    useEffect(() => {
      if (!currentImage) return;
      
      const loadImage = async () => {
        if (currentImage.objectUrl) {
          setImageUrl(currentImage.objectUrl);
          return;
        }
        
        try {
          let url;
          if (currentImage.isLegacyFile && currentImage.file) {
            url = URL.createObjectURL(currentImage.file);
          } else {
            const file = await currentImage.handle.getFile();
            url = URL.createObjectURL(file);
          }
          
          currentImage.objectUrl = url;
          setImageUrl(url);
        } catch (err) {
          console.error('Error loading image:', err);
          setImageUrl(null);
        }
      };
      
      loadImage();
    }, [currentImage]);
    
    if (!imageUrl) {
      return <div className="loading-spinner"></div>;
    }
    
    return (
      <img 
        src={imageUrl} 
        alt={currentImage.name} 
        className="full-image"
      />
    );
  };
  
  return (
    <div className="video-catalog">
      <div className="catalog-header">
        <h1>
          {/* Inline SVG icon */}
          <span dangerouslySetInnerHTML={{ __html: VideoCatalogIcon }} style={{ marginRight: '10px' }} />
          Video Catalog
        </h1>
        
        <div className="catalog-controls">
          {USE_FILE_SYSTEM_ACCESS_API ? (
            <button className="primary-button" onClick={selectDirectory}>
              Select Directory
            </button>
          ) : (
            <label className="primary-button">
              Select Directory
              <input
                type="file"
                webkitdirectory="true"
                directory="true"
                style={{ display: 'none' }}
                onChange={selectFilesLegacy}
              />
            </label>
          )}
        </div>
      </div>

      {directoryHandle || directoryPath.length > 0 ? (
        <div>
          <div className="directory-navigation">
            <div className="breadcrumb">
              {directoryPath.map((dir, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="separator">/</span>}
                  <span 
                    className="breadcrumb-item"
                    onClick={() => navigateToPathIndex(index)}
                  >
                    {dir.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
            
            {directoryPath.length > 1 && (
              <button className="up-button" onClick={navigateUp}>
                Up
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
            <div className="split-catalog-layout">
              {/* Pinned image sidebar */}
              {pinnedImage && (
                <div className="pinned-sidebar">
                  <div className="pinned-sidebar-label">Pinned Image</div>
                  <div className="pinned-sidebar-image">
                    <img 
                      src={pinnedImage.url} 
                      alt={pinnedImage.name}
                    />
                  </div>
                  <div className="pinned-sidebar-controls">
                    <button 
                      className="unpin-button"
                      onClick={() => togglePinImage(pinnedImage.id)}
                    >
                      Unpin
                    </button>
                  </div>
                </div>
              )}
              
              <div className={`directory-contents ${pinnedImage ? 'catalog-main-content' : ''}`}>
                {/* Directories */}
                {directories.length > 0 && (
                  <div className="content-section">
                    <h2 className="section-title">Directories</h2>
                    <div className="folder-grid">
                      {directories.map((directory, index) => (
                        <div 
                          key={index} 
                          className="folder-card"
                          onClick={() => navigateToDirectory(index)}
                        >
                          <div className="folder-icon">📁</div>
                          <div className="folder-name">{directory.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Videos */}
                {allVideos.length > 0 && (
                  <div className="content-section">
                    <h2 className="section-title">Videos ({allVideos.length})</h2>
                    
                    <div className="video-grid">
                      {displayedVideos.map((video, index) => (
                        <SimpleVideoCard 
                          key={video.id}
                          video={video}
                          onPlay={() => openVideo(allVideos.findIndex(v => v.id === video.id))}
                        />
                      ))}
                    </div>
                    
                    {allVideos.length > itemsPerPage && (
                      <div className="pagination">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Previous
                        </button>
                        <span>
                          Page {currentPage} of {Math.ceil(allVideos.length / itemsPerPage)}
                        </span>
                        <button 
                          disabled={currentPage >= Math.ceil(allVideos.length / itemsPerPage)}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Images */}
                {allImages.length > 0 && (
                  <div className="content-section">
                    <h2 className="section-title">Images ({allImages.length})</h2>
                    
                    <div className="image-grid">
                      {displayedImages.map((image, index) => (
                        <div 
                          key={image.id} 
                          className={`image-card ${pinnedImageIds.includes(image.id) ? 'pinned' : ''}`}
                          onClick={() => openImage(allImages.findIndex(img => img.id === image.id))}
                        >
                          <div className="image-placeholder">
                            {/* Using a dynamic thumbnail approach for better performance */}
                            {(() => {
                              const [thumbnail, setThumbnail] = useState(null);
                              
                              useEffect(() => {
                                // Load thumbnail when component mounts
                                const loadThumbnail = async () => {
                                  try {
                                    let file;
                                    if (image.isLegacyFile && image.file) {
                                      file = image.file;
                                    } else if (image.handle) {
                                      file = await image.handle.getFile();
                                    }
                                    
                                    if (file) {
                                      setThumbnail(URL.createObjectURL(file));
                                    }
                                  } catch (err) {
                                    console.error('Error loading thumbnail:', err);
                                  }
                                };
                                
                                loadThumbnail();
                                return () => {
                                  if (thumbnail) {
                                    URL.revokeObjectURL(thumbnail);
                                  }
                                };
                              }, [image.id]);
                              
                              return (
                                <>
                                  {thumbnail ? (
                                    <img 
                                      src={thumbnail} 
                                      alt={image.name}
                                      className="image-thumbnail" 
                                    />
                                  ) : (
                                    <div className="image-icon">🖼️</div>
                                  )}
                                </>
                              );
                            })()}
                            
                            <span className="file-type">{image.name.split('.').pop().toUpperCase()}</span>
                            
                            {/* Pin button */}
                            <button 
                              className={`pin-button ${pinnedImageIds.includes(image.id) ? 'pinned' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinImage(image.id);
                              }}
                            >
                              📌
                            </button>
                          </div>
                          <div className="image-info">
                            <p className="image-name">{image.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {allImages.length > itemsPerPage && (
                      <div className="pagination">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Previous
                        </button>
                        <span>
                          Page {currentPage} of {Math.ceil(allImages.length / itemsPerPage)}
                        </span>
                        <button 
                          disabled={currentPage >= Math.ceil(allImages.length / itemsPerPage)}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {directories.length === 0 && allVideos.length === 0 && allImages.length === 0 && (
                  <div className="empty-state">
                    <h2>No Files Found</h2>
                    <p>This directory is empty or doesn't contain supported file types.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Fullscreen video player */}
          {isFullscreen && currentVideo && (
            <div className="video-player-container">
              <div className="video-player-header">
                <div className="video-header-info">
                  <h3>{currentVideo.name}</h3>
                </div>
                <button className="close-button" onClick={closeVideoPlayer}>
                  Close
                </button>
              </div>
              
              <div className="fullscreen-player-wrapper">
                {currentVideo.isLegacyFile ? (
                  <video 
                    src={URL.createObjectURL(currentVideo.file)}
                    className="native-video-player" 
                    controls 
                    autoPlay
                  />
                ) : (
                  <video 
                    key={currentVideo.id}
                    className="native-video-player" 
                    controls 
                    autoPlay
                    onLoadStart={async (e) => {
                      try {
                        const file = await currentVideo.handle.getFile();
                        e.target.src = URL.createObjectURL(file);
                      } catch (err) {
                        console.error('Error loading video:', err);
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Image viewer */}
          {isViewingImage && currentImage && (
            <div className="image-viewer-container" ref={keyboardNavRef}>
              <div className="image-viewer-header">
                <h3>{currentImage.name}</h3>
                
                <div className="image-viewer-controls">
                  <button 
                    className={`pin-button-viewer ${pinnedImageIds.includes(currentImage.id) ? 'pinned' : ''}`}
                    onClick={() => togglePinImage(currentImage.id)}
                  >
                    {pinnedImageIds.includes(currentImage.id) ? 'Unpin' : 'Pin'} Image
                  </button>
                  
                  <button className="close-button" onClick={closeImageViewer}>
                    Close
                  </button>
                </div>
              </div>
              
              <div className="image-viewer-content">
                {/* Viewer content */}
                {renderImageViewer()}
                
                {/* Navigation buttons */}
                <div className="image-viewer-nav">
                  <button className="image-nav-button prev-button" onClick={prevImage}>
                    ‹
                  </button>
                  <button className="image-nav-button next-button" onClick={nextImage}>
                    ›
                  </button>
                </div>
                
                {/* Image counter */}
                <div className="image-counter">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No Directory Selected</h2>
          <p>Please select a directory to view its contents.</p>
          
          {!USE_FILE_SYSTEM_ACCESS_API && (
            <p className="warning">
              Your browser doesn't fully support the File System Access API. 
              Some features may be limited.
            </p>
          )}
          
          <p className="note">
            Note: The Video Catalog can display both videos and images from your local file system.
            You can browse directories, play videos, and view images.
          </p>
        </div>
      )}
    </div>
  );
}

export default VideoCatalog;