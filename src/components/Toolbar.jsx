import React, { useState, useEffect } from 'react';
import './Toolbar.css';

export default function Toolbar({ activeTool, setActiveTool, view }) {
  const [hintedTool, setHintedTool] = useState(null);

  useEffect(() => {
    const handleHint = (e) => {
      const tool = e.detail;
      setHintedTool(tool);
      setTimeout(() => setHintedTool(null), 1000);
    };
    window.addEventListener('tool-hint', handleHint);
    return () => window.removeEventListener('tool-hint', handleHint);
  }, []);

  return (
    <div className="toolbar-container">
      <button 
        className={`tool-btn ${activeTool === 'hand' ? 'active' : ''} ${hintedTool === 'hand' ? 'hint-glow' : ''}`}
        onClick={() => setActiveTool('hand')}
        title="Mano (Mover y manipular)"
      >
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a2 2 0 0 0-4 0v5" />
          <path d="M14 10V4a2 2 0 0 0-4 0v6" />
          <path d="M10 10.5V3a2 2 0 0 0-4 0v9" />
          <path d="M6 12v-1a2 2 0 0 0-4 0v5.5c0 3.3 2.7 6.5 6 6.5h3c3.3 0 6-3.2 6-6.5V13a2 2 0 0 0-4 0" />
        </svg>
      </button>

      <button 
        className={`tool-btn ${activeTool === 'lens' ? 'active' : ''} ${hintedTool === 'lens' ? 'hint-glow' : ''}`}
        onClick={() => setActiveTool('lens')}
        title="Magnifying Glass (Reveal Tokens)"
      >
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {view === 'corkboard' && (
        <>
          <div className="toolbar-divider" />
          <button 
            className={`tool-btn ${activeTool === 'thread-red' ? 'active' : ''}`}
            onClick={() => setActiveTool('thread-red')}
            title="Hilo Rojo"
            style={{ color: '#ff4444' }}
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19V5a2 2 0 0 1 2-2h13" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="5" cy="19" r="2" />
            </svg>
          </button>
          <button 
            className={`tool-btn ${activeTool === 'thread-blue' ? 'active' : ''}`}
            onClick={() => setActiveTool('thread-blue')}
            title="Hilo Azul"
            style={{ color: '#4444ff' }}
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19V5a2 2 0 0 1 2-2h13" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="5" cy="19" r="2" />
            </svg>
          </button>
          <button 
            className={`tool-btn ${activeTool === 'thread-green' ? 'active' : ''}`}
            onClick={() => setActiveTool('thread-green')}
            title="Hilo Verde"
            style={{ color: '#44ff44' }}
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19V5a2 2 0 0 1 2-2h13" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="5" cy="19" r="2" />
            </svg>
          </button>
          
          <div className="toolbar-divider" />
          <button 
            className={`tool-btn ${activeTool === 'scissors' ? 'active' : ''}`}
            onClick={() => setActiveTool('scissors')}
            title="Tijeras (Cortar Hilos)"
            style={{ color: '#dddddd' }}
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
              <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
              <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
