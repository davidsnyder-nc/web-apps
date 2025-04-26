import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import VideoCatalog from './VideoCatalog';
import { VideoCatalogIcon } from './assets/video-catalog-icon';
import { VideoCollageIcon } from './assets/video-collage-icon';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {window.location.pathname.includes('video-collage') ? (
      <App />
    ) : window.location.pathname.includes('video-catalog') ? (
      <VideoCatalog />
    ) : (
      <>
        <div className="container">
          <header>
            <h1>Web Apps</h1>
          </header>
          <main>
            <div className="apps-grid">
              <a href="/video-collage" className="app-card">
                <div className="app-icon" dangerouslySetInnerHTML={{ __html: VideoCollageIcon }} />
                <h2>Video Collage</h2>
                <p>Create dynamic video collages with multiple layouts</p>
              </a>
              <a href="/video-catalog" className="app-card">
                <div className="app-icon" dangerouslySetInnerHTML={{ __html: VideoCatalogIcon }} />
                <h2>Video Catalog</h2>
                <p>Organize and browse your video collection</p>
              </a>
            </div>
          </main>
        </div>
        <footer>
          <a href="https://github.com/davidsnyder-nc">GitHub</a>
        </footer>
      </>
    )}
  </React.StrictMode>
);