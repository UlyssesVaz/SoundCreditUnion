import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import styles from './styles.css?inline';

const Overlay: React.FC = () => {
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the main container, not buttons/text
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  return (
    <div 
      className={`sound-cu-overlay animate-slide-up font-sans text-gray-900 bg-white p-4 rounded-lg shadow-xl flex items-start min-w-[300px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        // We use fixed positioning within the shadow DOM's coordinate space
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        // Remove the right positioning since we're using left/top now
        right: 'auto',
        userSelect: 'none' // Prevent text selection while dragging
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="text-2xl mr-3 pointer-events-none">🏦</div>
      <div className="flex-1 pointer-events-none">
        <h3 className="font-semibold m-0 mb-1 text-base">Sound CU Co-Pilot</h3>
        <p className="text-sm text-gray-600 m-0 leading-snug">
          We're here to help you shop smarter.
        </p>
      </div>
      <button
        onClick={() => {
          const el = document.getElementById('sound-cu-root');
          if (el) el.remove();
        }}
        className="ml-4 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xl p-1"
      >
        ✕
      </button>
    </div>
  );
};

export const mountOverlay = () => {
  const existing = document.getElementById('sound-cu-root');
  if (existing) existing.remove();

  const mountPoint = document.createElement('div');
  mountPoint.id = 'sound-cu-root';
  
  Object.assign(mountPoint.style, {
    position: 'fixed',
    top: '0px',
    left: '0px',
    width: '100vw',
    height: '100vh', // Needs full height to capture mouse events globally if dragged fast
    zIndex: '2147483647',
    pointerEvents: 'none' // Crucial: keeps the page clickable underneath
  });

  const shadowRoot = mountPoint.attachShadow({ mode: 'open' });
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    :host { all: initial; font-family: sans-serif; }
    ${styles}
  `;
  shadowRoot.appendChild(styleSheet);

  (document.documentElement || document.body).appendChild(mountPoint);

  const reactRoot = document.createElement('div');
  // The container for React doesn't need fixed positioning anymore, 
  // the Overlay component handles its own position.
  // Just ensure it allows pointer events.
  reactRoot.style.pointerEvents = 'auto'; 
  
  shadowRoot.appendChild(reactRoot);
  
  ReactDOM.createRoot(reactRoot).render(
    <React.StrictMode>
      <Overlay />
    </React.StrictMode>
  );
  
  console.log('Sound CU Co-Pilot: Overlay mounted with Shadow DOM & Dragging');
};