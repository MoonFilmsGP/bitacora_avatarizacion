import React, { useRef, useState, useMemo, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { TelemetryEngine } from '../TelemetryEngine';
import RedactedText from './RedactedText';
import './RedactedDossier.css';

// Dictionary mapping concepts to their variations for robust matching
export const conceptMapping = {
  "Skin": /skins?/i,
  "Videojuego": /videojuegos?/i,
  "Juego/Jugador": /juegos?|jugar|juegan?|jugamos|jugadores?/i,
  "Realidad": /realidad(?:es)?/i,
  "Virtual": /virtual(?:es|idad)?/i,
  "Mundicidad": /mundicidad|mundos?/i,
  "Partida": /partidas?/i,
  "Avatar": /avatar(?:es)?|avataridad|avatarizaci[oó]n/i,
  "Interfaz": /interfaz|interfaces/i,
  "Imágenes técnicas": /im[aá]genes t[eé]cnicas|imagen t[eé]cnica/i
};

// Combine all variations into one global regex for the parser
const allVariations = Object.values(conceptMapping).map(r => r.source).join("|");
const keywordRegex = new RegExp(`(^|[^A-Za-zÁ-Úá-úñÑ])(` + allVariations + `)(?=[^A-Za-zÁ-Úá-úñÑ]|$)`, 'gi');

export const getConceptForWord = (word) => {
  for (const [concept, regex] of Object.entries(conceptMapping)) {
    // Exact match for the word variation
    if (new RegExp(`^${regex.source}$`, 'i').test(word)) return concept;
  }
  return null;
};

function parseAndRedact(text, activeTool, selectedGlossaryWord, docId, pageIndex, paragraphIndex, revealedConcepts, onRevealConcept) {
  if (!text) return null;
  // Because the regex has 2 capturing groups (Group 1: preceding char, Group 2: the keyword),
  // String.split will insert BOTH groups into the array for every match.
  // The structure will be: [text, prevChar, keyword, text, prevChar, keyword, text...]
  // Thus, the keyword is always at index % 3 === 2
  const parts = text.split(keywordRegex);
  
  return parts.map((part, i) => {
    if (i % 3 === 2) {
      const uniqueId = `${docId}-p${pageIndex}-par${paragraphIndex}-w${i}`;
      const expectedConcept = getConceptForWord(part);
      return <RedactedText key={i} id={uniqueId} text={part} activeTool={activeTool} selectedGlossaryWord={selectedGlossaryWord} revealedConcepts={revealedConcepts} onRevealConcept={onRevealConcept} expectedConcept={expectedConcept} />;
    }
    return <span key={i}>{part}</span>;
  });
}


export default function RedactedDossier({ 
  title, 
  filename, 
  text, 
  activeTool, 
  selectedGlossaryWord, 
  view, 
  onPinToCorkboard, 
  setDragState, 
  initialPos, 
  zIndex, 
  onInteraction, 
  isCabinetOpen, 
  activeDrawer, 
  onHoverCabinet, 
  onStore, 
  onFullyDeciphered, 
  setView,
  revealedConcepts,
  onRevealConcept,
  isFullyDeciphered,
  drawerData
}) {
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [pointerDownPos, setPointerDownPos] = useState(null);
  
  const x = useMotionValue(initialPos?.x || 0);
  const y = useMotionValue(initialPos?.y || 0);

  // Recalculate if it's fully deciphered on render based on global revealedConcepts
  useEffect(() => {
    // If we are already marked as fully deciphered globally, skip
    if (isFullyDeciphered) return;
    if (!text) return;

    let allRevealed = true;
    const parts = text.split(keywordRegex);
    for (let i = 2; i < parts.length; i += 3) {
      const concept = getConceptForWord(parts[i]);
      if (concept && !revealedConcepts.includes(concept)) {
        allRevealed = false;
        break;
      }
    }

    if (allRevealed && parts.length > 1) {
      if (onFullyDeciphered) onFullyDeciphered(filename);
      TelemetryEngine.log('Dossier_Fully_Deciphered', { filename });
    }
  }, [revealedConcepts, text, filename, isFullyDeciphered, onFullyDeciphered]);

  // Paginate text into chunks
  const pages = useMemo(() => {
    if (!text) return [[""]];
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
    const result = [];
    let currentChunk = [];
    let currentLen = 0;
    
    paragraphs.forEach(p => {
      if (currentLen + p.length > 700 && currentChunk.length > 0) {
        result.push(currentChunk);
        currentChunk = [];
        currentLen = 0;
      }
      currentChunk.push(p);
      currentLen += p.length;
    });
    if (currentChunk.length > 0) result.push(currentChunk);
    return result;
  }, [text]);

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
    if (inCabinetZone !== isHovering) {
      setIsHovering(inCabinetZone);
      onHoverCabinet(inCabinetZone ? filename : null);
    }
  };

  const handleDragEnd = (event, info) => {
    if (setDragState) setDragState({ active: false, inRange: false });

    // If we drop it while looking at the corkboard, pin it!
    if (view === 'corkboard') {
      onPinToCorkboard(filename, info.point.x, info.point.y);
      return;
    }

    // If dragged to the top edge while on desk, automatically send it to corkboard
    if (view === 'desk' && info.point.y < 80) {
      onPinToCorkboard(filename, info.point.x, window.innerHeight - 150);
      setView('corkboard');
      return;
    }

    // If dropped over the right side (where the cabinet is) while it's open, try to store it
    if (isCabinetOpen && info.point.x > window.innerWidth - 400) {
      onHoverCabinet(null);
      setIsHovering(false);

      // Verify if the active drawer is the correct one for this document
      const correctDrawer = drawerData.find(d => d.docs.includes(filename));
      if (correctDrawer && correctDrawer.id === activeDrawer) {
        onStore();
        TelemetryEngine.log('Dossier_Stored_Via_Drag', { title });
      } else {
        // Deny drop (bounces back naturally since we don't store it)
        TelemetryEngine.log('Dossier_Store_Denied', { title, activeDrawer });
      }
      return;
    }

    TelemetryEngine.log('Dossier_Dragged', {
      title,
      endX: info.point.x,
      endY: info.point.y,
    });
  };

  const nextPage = (e) => {
    e.stopPropagation();
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      TelemetryEngine.log('Dossier_Page_Changed', { title, page: currentPage + 2 });
    }
  };

  const prevPage = (e) => {
    e.stopPropagation();
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      TelemetryEngine.log('Dossier_Page_Changed', { title, page: currentPage });
    }
  };

  const isDragDisabled = activeTool !== 'hand';

  const hasNext = currentPage < pages.length - 1;
  const hasPrev = currentPage > 0;
  
  let paperClasses = "dossier-paper";
  if (hasNext && hasPrev) paperClasses += " has-both";
  else if (hasNext) paperClasses += " has-next";
  else if (hasPrev) paperClasses += " has-prev";

  return (
    <motion.div
      ref={containerRef}
      className={`dossier-container ${isDragDisabled ? 'disable-drag' : ''}`}
      style={{ x, y, zIndex }}
      drag={!isDragDisabled}
      dragConstraints={{ left: -600, right: 600, top: -500, bottom: 500 }}
      dragElastic={0.1}
      dragMomentum={true}
      dragTransition={{ power: 0.1, timeConstant: 100, bounceStiffness: 200, bounceDamping: 20 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onPointerDown={(e) => {
        setPointerDownPos({ x: e.clientX, y: e.clientY });
        onInteraction(e);
      }}
      onPointerMove={(e) => {
        if (isDragDisabled && pointerDownPos) {
          const dx = e.clientX - pointerDownPos.x;
          const dy = e.clientY - pointerDownPos.y;
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            window.dispatchEvent(new CustomEvent('tool-hint', { detail: 'hand' }));
            setPointerDownPos(null);
          }
        }
      }}
      onPointerUp={() => setPointerDownPos(null)}
      whileDrag={{ scale: 1.05, boxShadow: "0px 40px 80px rgba(0,0,0,0.6)" }}
      whileHover={{ scale: isDragDisabled ? 1 : 1.01 }}
      initial={{ x: initialPos?.x || 0, y: initialPos?.y || 0 }}
    >
      <div className={paperClasses}>
        <h3 className="dossier-title-small">{title}</h3>
        <p className="dossier-meta">STATUS: {isFullyDeciphered ? <span style={{ color: 'darkgreen' }}>DECLASSIFIED</span> : <span style={{ color: 'darkred' }}>CLASSIFIED</span>}</p>
        <hr className="dossier-divider" />
        
        <div className="dossier-content">
          {pages[currentPage] && pages[currentPage].map((paragraph, index) => (
            <p key={index}>
              {parseAndRedact(paragraph, activeTool, selectedGlossaryWord, title, currentPage, index, revealedConcepts, onRevealConcept)}
            </p>
          ))}
        </div>

        {/* Folded Corners for Pagination */}
        {hasPrev && (
          <div className="fold-corner prev" onClick={prevPage} title="Página Anterior"></div>
        )}
        {hasNext && (
          <div className="fold-corner next" onClick={nextPage} title="Página Siguiente"></div>
        )}

        {/* Page Indicator */}
        {pages.length > 1 && (
          <div className="page-indicator">
            {currentPage + 1} / {pages.length}
          </div>
        )}
      </div>
    </motion.div>
  );
}
