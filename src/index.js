import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {window.location.pathname.includes('video-collage') ? <App /> : (
      <>
        <div className="container">
          <header>
            <h1>Web Apps</h1>
          </header>
          <main>
            <div className="apps-grid">
              <a href="/video-collage" className="app-card">
                <h2>Video Collage</h2>
                <p>Create dynamic video collages with multiple layouts</p>
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