/**
 * Video processing utility functions
 * These functions handle various video processing tasks for the collage creator
 */

/**
 * Process a list of video files and prepare them for use in the collage
 * @param {File[]} videoFiles - Array of video File objects
 * @returns {Promise<Array>} - Array of processed video objects
 */
export const processVideos = async (videoFiles) => {
  try {
    const processedVideos = await Promise.all(
      videoFiles.map(async (file) => {
        // Create a URL for the video file
        const url = URL.createObjectURL(file);
        
        // Get duration and dimensions if possible
        let duration = null;
        let dimensions = null;
        
        try {
          duration = await getVideoDuration(file);
          dimensions = await getVideoDimensions(file);
        } catch (err) {
          console.warn('Could not get video metadata:', err);
        }
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          url,
          duration,
          dimensions
        };
      })
    );
    
    return processedVideos;
  } catch (error) {
    console.error('Error processing videos:', error);
    throw new Error(`Failed to process videos: ${error.message}`);
  }
};

/**
 * Get the duration of a video file
 * @param {File} file - Video file
 * @returns {Promise<number>} - Duration in seconds
 */
export const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    // Create a temporary video element
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Could not load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Get the dimensions of a video file
 * @param {File} file - Video file
 * @returns {Promise<Object>} - Object with width and height properties
 */
export const getVideoDimensions = (file) => {
  return new Promise((resolve, reject) => {
    // Create a temporary video element
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight
      });
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Could not load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Extract a frame from a video at a specific time
 * @param {string} videoUrl - URL of the video file
 * @param {number} timeInSeconds - Time to extract frame from
 * @returns {Promise<string>} - Data URL of the extracted frame
 */
export const extractFrameFromVideo = (videoUrl, timeInSeconds = 0) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    
    video.onloadedmetadata = () => {
      // Check if the requested time is valid
      if (timeInSeconds > video.duration) {
        timeInSeconds = 0;
      }
      
      video.currentTime = timeInSeconds;
    };
    
    video.onseeked = () => {
      try {
        // Create a canvas to draw the video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert the canvas to a data URL
        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve(dataUrl);
      } catch (err) {
        reject(new Error(`Failed to extract frame: ${err.message}`));
      } finally {
        // Clean up
        video.pause();
      }
    };
    
    video.onerror = () => {
      reject(new Error('Error loading video'));
    };
    
    // Start loading the video
    video.src = videoUrl;
    video.load();
  });
};