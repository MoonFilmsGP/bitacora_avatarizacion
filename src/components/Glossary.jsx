import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TelemetryEngine } from '../TelemetryEngine';
import './Glossary.css';


// Fixed book dimensions — larger for readability
const BOOK_WIDTH = 500;
const BOOK_HEIGHT = 650;

export default function Glossary({ selectedGlossaryWord, setSelectedGlossaryWord, activeTool, glossaryPages = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const handleToggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(o => !o);
    TelemetryEngine.log('Glossary_Toggle', { opened: !isOpen });
  };

  const goNext = (e) => {
    e.stopPropagation();
    if (currentPage < glossaryPages.length - 1) setCurrentPage(p => p + 1);
  };

  const goPrev = (e) => {
    e.stopPropagation();
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  const hasNext = currentPage < glossaryPages.length - 1;

  return (
    <motion.div
      className={`glossary-book tool-${activeTool}`}
      style={{ width: BOOK_WIDTH, height: BOOK_HEIGHT, zIndex: 30 }}
      drag={activeTool === 'hand'}
      dragConstraints={{ top: -100, bottom: 400, left: -600, right: 600 }}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 200, bounceDamping: 20 }}
      whileDrag={{ scale: 1.02, boxShadow: "0px 20px 40px rgba(0,0,0,0.6)" }}
      initial={{ x: 200, y: -50, rotate: 0 }}
    >
      {isOpen ? (
        /* ---- OPEN: Pages fill the exact same footprint ---- */
        <div className={`book-pages ${currentPage === 0 ? 'has-stain' : ''}`}>
          <div className="book-page-header">
            <span className="book-page-title">Glosario</span>
            <span className="book-page-number">{currentPage + 1} / {glossaryPages.length}</span>
          </div>

          <div className="book-page-content">
            {glossaryPages[currentPage].map((entry, i) => {
              const isSelected = activeTool === 'lens' && selectedGlossaryWord === entry.term;
              return (
                <div 
                  key={i} 
                  className={`glossary-entry ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (activeTool === 'lens') {
                      setSelectedGlossaryWord(isSelected ? null : entry.term);
                    }
                  }}
                >
                  <span className="entry-term">{entry.term}</span>
                  <div className="entry-def">
                    {Array.isArray(entry.def) ? entry.def.map((p, idx) => {
                      if (p.startsWith('(') && p.endsWith(')')) {
                        return <p key={idx} className="glossary-note">{p}</p>;
                      }
                      return <p key={idx} className="glossary-text">{p}</p>;
                    }) : <p className="glossary-text">{entry.def}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Left fold: closes on page 1, goes back otherwise */}
          <div
            className={`book-fold prev ${currentPage === 0 ? 'close-hint' : ''}`}
            onClick={currentPage === 0 ? handleToggleOpen : goPrev}
            title={currentPage === 0 ? 'Cerrar libro' : 'Página anterior'}
          />
          {hasNext && (
            <div
              className="book-fold next"
              onClick={goNext}
              title="Página siguiente"
            />
          )}
        </div>
      ) : (
        /* ---- CLOSED: Cover fills the exact same footprint ---- */
        <motion.div className="book-cover" onTap={handleToggleOpen}>
          <div className="book-spine"></div>
          <div className="book-cover-face">
            <div className="cover-ornament">❧</div>
            <h1 className="book-title">Glosario</h1>
            <div className="cover-ornament">❧</div>
            <div className="cover-subtitle">Avatarización & Mundicidad</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
