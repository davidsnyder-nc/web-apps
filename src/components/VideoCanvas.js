import React, { useEffect, useRef, useState } from 'react';

const VideoCanvas = ({ videos, layout, audioConfig, isPlaying, onRemoveVideo }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoElements, setVideoElements] = useState([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const animationRef = useRef(null);

  // Create video elements for each video
  useEffect(() => {
    const elements = videos.map((video) => {
      const videoEl = document.createElement('video');
      videoEl.src = video.url;
      videoEl.loop = true;
      videoEl.muted = !audioConfig.activeVideoIds.includes(video.id);
      videoEl.crossOrigin = "anonymous";
      
      // Add load event listener
      videoEl.addEventListener('loadeddata', () => {
        // Check if we should play based on the isPlaying prop
        if (isPlaying) {
          videoEl.play().catch(e => console.error("Video play error:", e));
        }
      });
      
      // Set custom property to identify the video
      videoEl.dataset.id = video.id;
      
      return videoEl;
    });
    
    setVideoElements(elements);
    
    // Cleanup function to remove video elements
    return () => {
      elements.forEach(videoEl => {
        videoEl.pause();
        videoEl.src = '';
        videoEl.remove();
      });
    };
  }, [videos, audioConfig.activeVideoIds]);

  // Handle play/pause state changes
  useEffect(() => {
    videoElements.forEach(videoEl => {
      if (isPlaying) {
        videoEl.play().catch(e => console.error("Video play error:", e));
      } else {
        videoEl.pause();
      }
    });
  }, [isPlaying, videoElements]);

  // Update audio settings when they change
  useEffect(() => {
    videoElements.forEach(videoEl => {
      const videoId = videoEl.dataset.id;
      videoEl.muted = !audioConfig.activeVideoIds.includes(videoId);
    });
  }, [audioConfig, videoElements]);

  // Setup the canvas size and start drawing
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || videoElements.length === 0) return;
    
    // Resize observer to handle container size changes
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        // Maintain 16:9 aspect ratio
        const width = entry.contentRect.width;
        const height = width * (9/16);
        setContainerSize({ width, height });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    // Initialize canvas size
    const { width, height } = containerRef.current.getBoundingClientRect();
    const aspectHeight = width * (9/16);
    setContainerSize({ width, height: aspectHeight });
    
    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [containerRef, canvasRef, videoElements]);

  // Draw videos to canvas based on layout
  useEffect(() => {
    if (!canvasRef.current || videoElements.length === 0 || !containerSize.width) return;
    
    // Set canvas dimensions
    const canvas = canvasRef.current;
    canvas.width = containerSize.width;
    canvas.height = containerSize.height;
    const ctx = canvas.getContext('2d');
    
    const drawFrame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create a closure for the current layout and video elements
      const currentLayout = layout;
      const currentVideos = videoElements;
      
      if (currentVideos.length === 0) return;
      
      // Apply the layout to position videos
      const positions = currentLayout.getPositions(currentVideos.length, canvas.width, canvas.height);
      
      // Draw each video to its position in the layout
      positions.forEach((position, index) => {
        if (index < currentVideos.length) {
          const video = currentVideos[index];
          
          // Only draw videos that are loaded
          if (video.readyState >= 2) {
            ctx.drawImage(
              video, 
              position.x, 
              position.y, 
              position.width, 
              position.height
            );
          }
        }
      });
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(drawFrame);
    };
    
    // Start the animation loop
    drawFrame();
    
    // Clean up animation frame on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [containerSize, layout, videoElements]);

  return (
    <div className="video-canvas-container" ref={containerRef}>
      <canvas 
        ref={canvasRef} 
        className="video-canvas"
        style={{ 
          width: '100%', 
          height: containerSize.height,
          backgroundColor: '#000',
          display: 'block'
        }}
      />
      
      {videos.length > 0 && (
        <div className="video-controls" style={{ marginTop: '1rem' }}>
          <div className="video-thumbnails" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {videos.map((video, index) => (
              <div 
                key={video.id} 
                className="video-thumbnail" 
                style={{ 
                  position: 'relative',
                  width: '120px',
                  border: audioConfig.activeVideoIds.includes(video.id) 
                    ? '2px solid #4361ee' 
                    : '2px solid transparent',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <video 
                  src={video.url}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  muted
                  loop
                  autoPlay={false}
                  playsInline
                />
                <button 
                  className="btn btn-danger btn-icon"
                  onClick={() => onRemoveVideo(video.id)}
                  style={{ 
                    position: 'absolute', 
                    top: '4px', 
                    right: '4px',
                    width: '24px',
                    height: '24px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <div style={{ padding: '4px', fontSize: '0.75rem', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {video.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCanvas;
