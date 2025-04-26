import React from 'react';

const LayoutSelector = ({ layouts, selectedLayout, onLayoutChange }) => {
  return (
    <div className="layout-selector">
      <h3 style={{ marginBottom: '1rem' }}>Layout Options</h3>
      <div className="layout-options">
        {layouts.map((layout) => (
          <div 
            key={layout.id}
            className={`layout-option ${selectedLayout.id === layout.id ? 'selected' : ''}`}
            onClick={() => onLayoutChange(layout)}
            style={{ 
              width: '100px',
              height: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="layout-preview" style={{ marginBottom: '8px' }}>
              {layout.icon}
            </div>
            <div className="layout-name" style={{ fontSize: '0.85rem', textAlign: 'center' }}>
              {layout.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayoutSelector;
