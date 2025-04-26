import React from 'react';

// Layout utilities
const createGrid = (columns, rows, width, height) => {
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const grid = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      grid.push({
        x: col * cellWidth,
        y: row * cellHeight,
        width: cellWidth,
        height: cellHeight
      });
    }
  }
  
  return grid;
};

// Layout definitions
export const layouts = [
  {
    id: 'grid',
    name: 'Grid',
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="#333" strokeWidth="1.5">
        <rect x="2" y="2" width="16" height="9" rx="1" />
        <rect x="22" y="2" width="16" height="9" rx="1" />
        <rect x="2" y="13" width="16" height="9" rx="1" />
        <rect x="22" y="13" width="16" height="9" rx="1" />
      </svg>
    ),
    getPositions: (count, width, height) => {
      // Determine optimal grid layout based on count
      let columns, rows;
      
      if (count <= 1) {
        columns = 1;
        rows = 1;
      } else if (count <= 2) {
        columns = 2;
        rows = 1;
      } else if (count <= 4) {
        columns = 2;
        rows = 2;
      } else if (count <= 6) {
        columns = 3;
        rows = 2;
      } else if (count <= 9) {
        columns = 3;
        rows = 3;
      } else {
        columns = 4;
        rows = Math.ceil(count / 4);
      }
      
      return createGrid(columns, rows, width, height).slice(0, count);
    }
  },
  {
    id: 'pip',
    name: 'Picture-in-Picture',
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="#333" strokeWidth="1.5">
        <rect x="2" y="2" width="36" height="20" rx="1" />
        <rect x="24" y="12" width="10" height="6" rx="1" fill="#eee" />
      </svg>
    ),
    getPositions: (count, width, height) => {
      if (count <= 0) return [];
      
      const positions = [];
      
      // Main video takes up the full canvas
      positions.push({
        x: 0,
        y: 0,
        width: width,
        height: height
      });
      
      // Calculate PIP size (1/4 of the width, 1/4 of the height)
      const pipWidth = width / 4;
      const pipHeight = height / 4;
      const margin = 10;
      
      // Position additional videos as PIPs
      if (count > 1) {
        // Position in bottom right
        positions.push({
          x: width - pipWidth - margin,
          y: height - pipHeight - margin,
          width: pipWidth,
          height: pipHeight
        });
      }
      
      if (count > 2) {
        // Position in bottom left
        positions.push({
          x: margin,
          y: height - pipHeight - margin,
          width: pipWidth,
          height: pipHeight
        });
      }
      
      if (count > 3) {
        // Position in top right
        positions.push({
          x: width - pipWidth - margin,
          y: margin,
          width: pipWidth,
          height: pipHeight
        });
      }
      
      // For any remaining videos, create a grid in the top left
      if (count > 4) {
        const remainingCount = count - 4;
        const smallPipWidth = (width / 2) - (2 * margin);
        const smallPipHeight = (height / 2) - (2 * margin);
        
        for (let i = 0; i < remainingCount; i++) {
          positions.push({
            x: margin + (i % 2) * (smallPipWidth + margin),
            y: margin + Math.floor(i / 2) * (smallPipHeight + margin),
            width: smallPipWidth / 2,
            height: smallPipHeight / 2
          });
        }
      }
      
      return positions;
    }
  },
  {
    id: 'sideBySide',
    name: 'Side by Side',
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="#333" strokeWidth="1.5">
        <rect x="2" y="2" width="17" height="20" rx="1" />
        <rect x="21" y="2" width="17" height="20" rx="1" />
      </svg>
    ),
    getPositions: (count, width, height) => {
      if (count <= 0) return [];
      
      const positions = [];
      
      if (count === 1) {
        // Single video takes full width
        positions.push({
          x: 0,
          y: 0,
          width: width,
          height: height
        });
      } else {
        // Calculate width for each video
        const videoWidth = width / count;
        
        // Create side-by-side layout
        for (let i = 0; i < count; i++) {
          positions.push({
            x: i * videoWidth,
            y: 0,
            width: videoWidth,
            height: height
          });
        }
      }
      
      return positions;
    }
  },
  {
    id: 'stackedRows',
    name: 'Stacked Rows',
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="#333" strokeWidth="1.5">
        <rect x="2" y="2" width="36" height="6" rx="1" />
        <rect x="2" y="10" width="36" height="6" rx="1" />
        <rect x="2" y="18" width="36" height="4" rx="1" />
      </svg>
    ),
    getPositions: (count, width, height) => {
      if (count <= 0) return [];
      
      const positions = [];
      
      if (count === 1) {
        // Single video takes full height
        positions.push({
          x: 0,
          y: 0,
          width: width,
          height: height
        });
      } else {
        // Calculate height for each video
        const videoHeight = height / count;
        
        // Create stacked rows layout
        for (let i = 0; i < count; i++) {
          positions.push({
            x: 0,
            y: i * videoHeight,
            width: width,
            height: videoHeight
          });
        }
      }
      
      return positions;
    }
  },
  {
    id: 'featured',
    name: 'Featured Video',
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="#333" strokeWidth="1.5">
        <rect x="2" y="2" width="24" height="20" rx="1" />
        <rect x="28" y="2" width="10" height="6" rx="1" />
        <rect x="28" y="10" width="10" height="6" rx="1" />
        <rect x="28" y="18" width="10" height="4" rx="1" />
      </svg>
    ),
    getPositions: (count, width, height) => {
      if (count <= 0) return [];
      
      const positions = [];
      
      if (count === 1) {
        // Single video takes full canvas
        positions.push({
          x: 0,
          y: 0,
          width: width,
          height: height
        });
      } else {
        // Featured video takes 2/3 of the width
        const featuredWidth = (width * 2) / 3;
        const sidebarWidth = width - featuredWidth;
        
        // Main featured video
        positions.push({
          x: 0,
          y: 0,
          width: featuredWidth,
          height: height
        });
        
        // If we have more than 1 video, create a sidebar
        if (count > 1) {
          const sidebarVideoHeight = height / (count - 1);
          
          // Add sidebar videos
          for (let i = 1; i < count; i++) {
            positions.push({
              x: featuredWidth,
              y: (i - 1) * sidebarVideoHeight,
              width: sidebarWidth,
              height: sidebarVideoHeight
            });
          }
        }
      }
      
      return positions;
    }
  }
];
