import React, { useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { TelemetryEngine } from '../TelemetryEngine';
import '../components/Glossary.css'; // Reutilizamos estilos del libro

const BOOK_WIDTH = 450;
const BOOK_HEIGHT = 600;

export default function TornNote({
  filename,
  text,
  view,
  onPinToCorkboard,
  setDragState,
  setView,
  initialPos,
  zIndex,
  onInteraction,
  isCabinetOpen,
  activeDrawer,
  onHoverCabinet,
  onStore,
  drawerData
}) {
  const containerRef = useRef(null);
  const x = useMotionValue(initialPos?.x || 0);
  const y = useMotionValue(initialPos?.y || 0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Procesamos el texto para omitir el primer párrafo
  const startIndex = text ? text.indexOf("Primero es el mundo") : -1;
  let processedText = text ? (startIndex > -1 ? text.substring(startIndex) : text) : "FLUSSER...";
  processedText = processedText.replace(/J\.\s*$/, '').trim();

  // Dividimos en páginas por doble salto de línea, 3 párrafos por página
  const paragraphs = processedText.split('\n\n').filter(p => p.trim() !== '');
  const pages = [];
  for (let i = 0; i < paragraphs.length; i += 3) {
    pages.push(paragraphs.slice(i, i + 3).join('\n\n'));
  }
  if (pages.length === 0) pages.push(processedText);

  const handleDragStart = () => {
    onInteraction();
    if (setDragState) setDragState({ active: true, inRange: false });
  };

  const handleDrag = (event, info) => {
    if (setDragState) {
      const inRange = view === 'desk' && info.point.y < 80;
      setDragState(prev => {
        if (prev && prev.active === true && prev.inRange === inRange) return prev;
        return { active: true, inRange };
      });
    }
    const inCabinetZone = isCabinetOpen && info.point.x > window.innerWidth - 400;
    onHoverCabinet(inCabinetZone ? filename : null);
  };

  const handleDragEnd = (event, info) => {
    if (setDragState) setDragState({ active: false, inRange: false });

    if (view === 'corkboard') {
      setTimeout(() => onPinToCorkboard(filename, info.point.x, info.point.y), 50);
      return;
    }

    if (view === 'desk' && info.point.y < 80) {
      setTimeout(() => {
        onPinToCorkboard(filename, info.point.x, window.innerHeight - 150);
        setView('corkboard');
      }, 50);
      return;
    }

    if (isCabinetOpen && info.point.x > window.innerWidth - 400) {
      onHoverCabinet(null);
      const correctDrawer = drawerData.find(d => d.docs.includes(filename));
      if (correctDrawer && correctDrawer.id === activeDrawer) {
        setTimeout(() => onStore(), 50);
        TelemetryEngine.log('Note_Stored_Via_Drag', { filename });
      }
      return;
    }
  };

  const handleToggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(o => !o);
  };

  return (
    <motion.div
      ref={containerRef}
      className="glossary-book"
      style={{
        width: BOOK_WIDTH,
        height: BOOK_HEIGHT,
        zIndex,
        x,
        y
      }}
      drag
      dragConstraints={{ left: -600, right: 600, top: -500, bottom: 500 }}
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onPointerDown={onInteraction}
      whileDrag={{ scale: 1.02, cursor: 'grabbing', boxShadow: "0px 20px 40px rgba(0,0,0,0.6)" }}
      initial={{ x: initialPos?.x || 0, y: (window.innerHeight || 1000) + 200, opacity: 0 }}
      animate={{ y: initialPos?.y || 0, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
    >
      {isOpen ? (
        <div className="book-pages" style={{ background: '#fffcd1' }}>
          <div className="book-page-header">
            <span className="book-page-title" style={{ fontFamily: 'Cinzel' }}>0</span>
            <span className="book-page-number">{currentPage + 1} / {pages.length}</span>
          </div>
          <div className="book-page-content" style={{ padding: '20px', overflow: 'hidden' }}>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "'Caveat', cursive", fontSize: '22px', lineHeight: '1.2', color: '#2b3a4a' }}>
              {pages[currentPage]}
            </div>
          </div>
          {/* Left fold: closes on page 1, goes back otherwise */}
          <div
            className={`book-fold prev ${currentPage === 0 ? 'close-hint' : ''}`}
            onClick={(e) => { e.stopPropagation(); if (currentPage === 0) { handleToggleOpen(e); } else { setCurrentPage(p => p - 1); } }}
            title={currentPage === 0 ? 'Cerrar libro' : 'Página anterior'}
          />
          {currentPage < pages.length - 1 && (
            <div
              className="book-fold next"
              onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
              title="Página siguiente"
            />
          )}
        </div>
      ) : (
        <div className="book-cover" onClick={handleToggleOpen}>
          <div className="book-spine" style={{ background: 'linear-gradient(to right, #000, #222, #111)', borderRight: '1px solid rgba(255,215,0,0.3)' }}></div>
          <div className="book-cover-face" style={{ background: '#111', border: '1px solid rgba(255,215,0,0.5)' }}>
            <div style={{ 
              color: 'gold', 
              fontFamily: 'Cinzel, serif', 
              fontSize: '80px', 
              textShadow: '0 0 10px rgba(255,215,0,0.5)' 
            }}>
              0
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
