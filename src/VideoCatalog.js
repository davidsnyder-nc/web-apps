import React, { useState, useEffect } from 'react';
import './VideoCatalog.css';

function VideoCatalog() {
  const [videos, setVideos] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sample data - in a real app, this would come from an API
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const sampleVideos = [
        {
          id: '1',
          title: 'Mountain Scenery',
          category: 'nature',
          thumbnail: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606',
          duration: '2:45',
          dateAdded: '2025-03-15'
        },
        {
          id: '2',
          title: 'Beach Sunset',
          category: 'nature',
          thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
          duration: '1:30',
          dateAdded: '2025-03-20'
        },
        {
          id: '3',
          title: 'City Timelapse',
          category: 'urban',
          thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390',
          duration: '3:15',
          dateAdded: '2025-04-01'
        },
        {
          id: '4',
          title: 'Drone Footage',
          category: 'aerial',
          thumbnail: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96',
          duration: '4:00',
          dateAdded: '2025-04-10'
        },
        {
          id: '5',
          title: 'Wildlife Documentary',
          category: 'nature',
          thumbnail: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd',
          duration: '5:30',
          dateAdded: '2025-04-15'
        },
        {
          id: '6',
          title: 'Traffic Movement',
          category: 'urban',
          thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000',
          duration: '2:10',
          dateAdded: '2025-04-20'
        }
      ];
      setVideos(sampleVideos);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Get all unique categories
  const categories = ['all', ...new Set(videos.map(video => video.category))];

  // Filter videos by category and search term
  const filteredVideos = videos.filter(video => {
    const matchesCategory = currentCategory === 'all' || video.category === currentCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Function to add new video from file upload
  const handleAddVideo = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // In a real app, you'd upload this file to a server
        // Here we'll just add it to our local state
        const newVideo = {
          id: Date.now().toString(),
          title: file.name.split('.')[0],
          category: 'uploads',
          thumbnail: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1',
          duration: '0:30', // Placeholder
          dateAdded: new Date().toISOString().split('T')[0]
        };
        setVideos([...videos, newVideo]);
      }
    };
    input.click();
  };

  // Create a video collage from selected videos
  const createCollage = (selectedVideos) => {
    // Store selected video IDs in localStorage
    localStorage.setItem('collageVideos', JSON.stringify(selectedVideos));
    // Redirect to video collage app
    window.location.href = '/video-collage';
  };

  return (
    <div className="video-catalog">
      <header className="catalog-header">
        <h1>Video Catalog</h1>
        <div className="catalog-controls">
          <button onClick={() => window.location.href = '/'} className="back-button">
            Back to Apps
          </button>
          <button onClick={handleAddVideo} className="add-button">
            Add Video
          </button>
        </div>
      </header>

      <div className="search-filter-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={currentCategory === category ? 'active' : ''}
              onClick={() => setCurrentCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading videos...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      ) : (
        <div className="video-grid">
          {filteredVideos.length > 0 ? (
            filteredVideos.map(video => (
              <div key={video.id} className="video-card">
                <div className="thumbnail-container">
                  <img src={video.thumbnail} alt={video.title} />
                  <span className="duration">{video.duration}</span>
                </div>
                <div className="video-info">
                  <h3>{video.title}</h3>
                  <p className="category">{video.category}</p>
                  <p className="date-added">Added: {video.dateAdded}</p>
                  <div className="video-actions">
                    <button onClick={() => createCollage([video.id])}>
                      Create Collage
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No videos found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoCatalog;