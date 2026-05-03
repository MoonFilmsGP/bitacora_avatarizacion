import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import RedactedDossier from './components/RedactedDossier';
import Toolbar from './components/Toolbar';
import FilingCabinet from './components/FilingCabinet';
import Glossary from './components/Glossary';
import CoffeeMachine from './components/CoffeeMachine';
import ImageDocument from './components/ImageDocument';
import TornNote from './components/TornNote';
import AudioPlayer from './components/AudioPlayer';
import AudioCassette from './components/AudioCassette';
import { conceptMapping } from './components/RedactedDossier';
import documents from './data/documents.json';
import './index.css';
import './App.css';

const EXTRA_FILES = ['FLUSSER.docx', 'MANO.avif', 'IMAGEN.jpg', 'TEXTO.jpeg', 'VACIO.webp', 'cassette.png', 'cassette2.png', 'cassette3.png', 'reproductor.png'];
const allKeys = [...Object.keys(documents), ...EXTRA_FILES];

const initialPositions = allKeys.reduce((acc, key) => {
  acc[key] = { x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 200 };
  return acc;
}, {});

// Los cajones iniciales se definen como estado dentro de App para poder modificarlos
const INITIAL_DRAWERS = [
  { id: 1, name: "SAN LUIS POTOSÍ", docs: ['SLP_OCTUBRE_2024.docx', 'SLP_NOVIEMBRE_2024.docx', 'SLP_DICIEMBRE_2024.docx', 'SLP_OCTUBRE_2025.docx', 'SLP_NOVIEMBRE_2025.docx', 'SLP_DICIEMBRE_2025.docx'] },
  { id: 2, name: "VACÍO", docs: [] },
  { id: 3, name: "?", docs: [], isLocked: true }
];

// ─── DYNAMIC GLOSSARY PARSER ───
const rawGlossary = documents['GLOSARIO.docx'] || '';
const rawBlocks = rawGlossary.split('\n\n').filter(b => b.trim() !== '' && b.trim() !== 'GLOSARIO');
const parsedGlossary = [];
let currentTerm = null;
let currentDef = [];

for (const block of rawBlocks) {
  if (!block.startsWith('(') && block.length < 50 && !block.endsWith('.') && !block.endsWith('...')) {
    if (currentTerm) {
      parsedGlossary.push({ term: currentTerm.replace(/ -.*?-/g, '').replace(':', '').trim(), def: currentDef });
    }
    currentTerm = block;
    currentDef = [];
  } else {
    currentDef.push(block.trim());
  }
}
if (currentTerm) {
  parsedGlossary.push({ term: currentTerm.replace(/ -.*?-/g, '').replace(':', '').trim(), def: currentDef });
}

// Split into pages of 2 entries each
const dynamicGlossaryPages = [];
for (let i = 0; i < parsedGlossary.length; i += 2) {
  dynamicGlossaryPages.push(parsedGlossary.slice(i, i + 2));
}

/*
  WORLD LAYOUT:
  ┌──────────────┐
  │  CORKBOARD   │  y = 0     (top-left)
  ├──────────────┬──────────────┐
  │     DESK     │   COFFEE     │  y = 100vh
  └──────────────┴──────────────┘
     x = 0         x = 100vw

  Camera (world translation) to show each view:
    desk:      x=0,      y=-100vh   ← desk row becomes visible
    corkboard: x=0,      y=0        ← corkboard row becomes visible
    coffee:    x=-100vw, y=-100vh   ← coffee column becomes visible
*/
const CAMERA = {
  desk:      { x: '0vw',    y: '-100vh' },
  corkboard: { x: '0vw',    y: '0vh'   },
  coffee:    { x: '-100vw', y: '-100vh' },
};

// ─── CorkboardView ─────────────────────────────────────────────────────────────
function getPreviewText(text, revealedConcepts) {
  if (!text) return "";
  let preview = text.substring(0, 300); // Only process first 300 chars for preview
  for (const [concept, regex] of Object.entries(conceptMapping)) {
    if (!revealedConcepts.includes(concept)) {
      preview = preview.replace(new RegExp(regex.source, 'gi'), match => '█'.repeat(match.length));
    }
  }
  return preview + "...";
}

function CorkboardView({ corkboardItems, onRemovePin, onUpdatePin, activeTool, fullyDecipheredDocs, revealedConcepts }) {
  const [threadStart, setThreadStart] = useState(null);
  const [threads, setThreads] = useState([]); // { id, from: pinId, to: pinId, color }
  const [mousePos, setMousePos] = useState(null);
  const [pinDragState, setPinDragState] = useState({ active: false, inRange: false });
  const [draggedPinPos, setDraggedPinPos] = useState(null); // { id, x, y }

  const [phase3SuccessFlashed, setPhase3SuccessFlashed] = useState(false);
  const [phase4SuccessFlashed, setPhase4SuccessFlashed] = useState(false);
  const [glowP3, setGlowP3] = useState(false);
  const [glowP4, setGlowP4] = useState(false);

  const phase3ExactLinks = React.useMemo(() => {
    const p3Nodes = ['MANO.avif', 'IMAGEN.jpg', 'TEXTO.jpeg', 'VACIO.webp'];
    const p3Threads = threads.filter(t => p3Nodes.includes(t.from) || p3Nodes.includes(t.to));
    const hasThread = (a, b) => p3Threads.some(t => (t.from === a && t.to === b) || (t.from === b && t.to === a));
    return p3Threads.length === 3 &&
           hasThread('MANO.avif', 'IMAGEN.jpg') &&
           hasThread('IMAGEN.jpg', 'TEXTO.jpeg') &&
           hasThread('TEXTO.jpeg', 'VACIO.webp');
  }, [threads]);

  const phase4ExactLinks = React.useMemo(() => {
    const p4Nodes = ['cassette.png', 'cassette2.png', 'cassette3.png'];
    const p4Threads = threads.filter(t => p4Nodes.includes(t.from) || p4Nodes.includes(t.to));
    const hasThread = (a, b) => p4Threads.some(t => (t.from === a && t.to === b) || (t.from === b && t.to === a));
    return p4Threads.length === 3 &&
           hasThread('cassette.png', 'JALISCO_AGOSTO_2025.docx') &&
           hasThread('cassette2.png', 'JALISCO_SEPTIEMBRE_2025.docx') &&
           (hasThread('cassette3.png', 'JALISCO_SEPTIEMBRE_2025.docx') || hasThread('cassette3.png', 'JALISCO_NOVIEMBRE_2025.docx'));
  }, [threads]);

  useEffect(() => {
    if (phase3ExactLinks && !phase3SuccessFlashed) {
      setPhase3SuccessFlashed(true);
      setGlowP3(true);
      setTimeout(() => setGlowP3(false), 2000);
      window.dispatchEvent(new CustomEvent('phase3-success'));
    }
  }, [phase3ExactLinks, phase3SuccessFlashed]);

  useEffect(() => {
    if (phase4ExactLinks && !phase4SuccessFlashed) {
      setPhase4SuccessFlashed(true);
      setGlowP4(true);
      // It glows indefinitely to indicate success.
    }
  }, [phase4ExactLinks, phase4SuccessFlashed]);

  // Memoize preview text so we don't compile/run regex on every frame of a drag!
  const previews = React.useMemo(() => {
    const map = {};
    corkboardItems.forEach(item => {
      map[item.id] = getPreviewText(documents[item.id], revealedConcepts);
    });
    return map;
  }, [corkboardItems, revealedConcepts]);

  // Clear thread dragging if tool changes
  useEffect(() => {
    if (!activeTool.startsWith('thread-')) {
      setThreadStart(null);
      setMousePos(null);
    }
  }, [activeTool]);

  const handlePinClick = (id) => {
    if (activeTool.startsWith('thread-')) {
      if (!threadStart) {
        setThreadStart(id);
      } else {
        if (threadStart !== id) {
          const color = activeTool.replace('thread-', '');
          setThreads(prev => [...prev, { id: Date.now(), from: threadStart, to: id, color }]);
        }
        setThreadStart(null);
        setMousePos(null);
      }
    }
  };

  const handlePointerMove = (e) => {
    if (threadStart && activeTool.startsWith('thread-')) {
      const surface = document.querySelector('.cork-surface');
      if (surface) {
        const rect = surface.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const getPinCoords = (item) => {
    let wOffset = 90; // Default .cork-card width/2 (180/2)
    if (item.id.match(/\.(jpg|jpeg|png|avif|webp)$/i)) wOffset = 75; // 150/2
    else if (item.id === 'FLUSSER.docx') wOffset = 45; // 90/2
    return { px: item.x + wOffset, py: item.y + 10 };
  };

  return (
    <div 
      className={`cork-panel tool-${activeTool}`} 
      onPointerMove={handlePointerMove}
    >
      <header className="cork-header">
        <span className="cork-title">TABLERO DE INVESTIGACION</span>
      </header>
      
      <div className="cork-surface">
        <svg className="cork-threads-svg">
          {threads.map(t => {
            const fromItem = corkboardItems.find(i => i.id === t.from);
            const toItem = corkboardItems.find(i => i.id === t.to);
            if (!fromItem || !toItem) return null;
            const actualFromItem = draggedPinPos?.id === fromItem.id ? draggedPinPos : fromItem;
            const actualToItem = draggedPinPos?.id === toItem.id ? draggedPinPos : toItem;
            
            const fromCoords = getPinCoords(actualFromItem);
            const toCoords = getPinCoords(actualToItem);
            
            const px1 = fromCoords.px;
            const py1 = fromCoords.py;
            const px2 = toCoords.px;
            const py2 = toCoords.py;
            
            const dx = px2 - px1;
            const dy = py2 - py1;
            const len = Math.sqrt(dx*dx + dy*dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            
            const offsetAmt = t.color === 'red' ? 0 : t.color === 'blue' ? -15 : 15;
            
            return (
              <g 
                key={t.id} 
                onClick={() => activeTool === 'scissors' && setThreads(prev => prev.filter(thread => thread.id !== t.id))}
                style={{ pointerEvents: activeTool === 'scissors' ? 'auto' : 'none' }}
              >
                <line 
                  x1={px1 + nx * offsetAmt} y1={py1 + ny * offsetAmt} 
                  x2={px2 + nx * offsetAmt} y2={py2 + ny * offsetAmt} 
                  stroke="transparent" 
                  strokeWidth="30" 
                  style={{ cursor: activeTool === 'scissors' ? 'pointer' : 'default' }}
                  className={activeTool === 'scissors' ? 'scissors-target' : ''}
                />
                <line 
                  className={`thread-line ${activeTool === 'scissors' ? 'scissorable' : ''}`}
                  x1={px1 + nx * offsetAmt} y1={py1 + ny * offsetAmt} 
                  x2={px2 + nx * offsetAmt} y2={py2 + ny * offsetAmt} 
                  stroke={t.color} 
                  strokeWidth="2" 
                />
              </g>
            );
          })}
          {threadStart && mousePos && (() => {
            const fromItem = corkboardItems.find(i => i.id === threadStart);
            if (!fromItem) return null;
            
            const actualFromItem = draggedPinPos?.id === fromItem.id ? draggedPinPos : fromItem;
            const fromCoords = getPinCoords(actualFromItem);
            const px1 = fromCoords.px;
            const py1 = fromCoords.py;
            const px2 = mousePos.x;
            const py2 = mousePos.y;
            
            const dx = px2 - px1;
            const dy = py2 - py1;
            const len = Math.sqrt(dx*dx + dy*dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            
            const tColor = activeTool.replace('thread-', '');
            const offsetAmt = tColor === 'red' ? 0 : tColor === 'blue' ? -4 : 4;
            
            return (
              <line 
                x1={px1 + nx * offsetAmt} y1={py1 + ny * offsetAmt} 
                x2={px2 + nx * offsetAmt} y2={py2 + ny * offsetAmt} 
                stroke={tColor} 
                strokeWidth="2" 
                opacity="0.8"
              />
            );
          })()}
        </svg>

        {pinDragState.active && (
          <div className={`corkboard-drop-indicator desk-return-indicator ${pinDragState.inRange ? 'in-range' : ''}`}>
            <div className="indicator-text">↓ ARRASTRA ABAJO PARA DEVOLVER AL ESCRITORIO ↓</div>
          </div>
        )}

        {corkboardItems.length === 0 ? (
          <p className="cork-empty">Arrastra documentos hacia aquí para fijarlos.</p>
        ) : (
          corkboardItems.map((item) => {
            const isDeciphered = fullyDecipheredDocs.includes(item.id);
            return (
              <motion.div
              id={`cork-note-${item.id}`}
              key={item.id}
              className={`cork-note ${threadStart === item.id ? 'highlighted' : ''}`}
              drag={activeTool === 'hand'}
              dragMomentum={false}
              initial={{ x: item.x, y: item.y, rotate: item.rotation }}
              onDragStart={() => {
                window.__isDraggingPin = true;
                setPinDragState({ active: true, inRange: false });
              }}
              onDrag={(e, info) => {
                setPinDragState(prev => {
                  const inRange = info.point.y > window.innerHeight - 80;
                  if (prev && prev.active === true && prev.inRange === inRange) return prev;
                  return { active: true, inRange };
                });
                const surface = document.querySelector('.cork-surface');
                const node = document.getElementById(`cork-note-${item.id}`);
                if (surface && node) {
                  const surfRect = surface.getBoundingClientRect();
                  const nodeRect = node.getBoundingClientRect();
                  setDraggedPinPos({ id: item.id, x: nodeRect.left - surfRect.left, y: nodeRect.top - surfRect.top });
                } else {
                  setDraggedPinPos({ id: item.id, x: item.x + info.offset.x, y: item.y + info.offset.y });
                }
              }}
              onDragEnd={(e, info) => {
                window.__isDraggingPin = false;
                setPinDragState({ active: false, inRange: false });
                setDraggedPinPos(null);
                // If dragged back to desk (y > screen height - threshold)
                if (info.point.y > window.innerHeight - 80) {
                  // Eliminate associated threads
                  setThreads(prev => prev.filter(t => t.from !== item.id && t.to !== item.id));
                  onRemovePin(item.id);
                } else {
                  const surface = document.querySelector('.cork-surface');
                  const node = document.getElementById(`cork-note-${item.id}`);
                  if (surface && node) {
                    const surfRect = surface.getBoundingClientRect();
                    const nodeRect = node.getBoundingClientRect();
                    onUpdatePin(item.id, nodeRect.left - surfRect.left + 60, nodeRect.top - surfRect.top + 60);
                  } else {
                    onUpdatePin(item.id, info.point.x, info.point.y);
                  }
                }
              }}
              onPointerDown={() => handlePinClick(item.id)}
              style={{
                x: item.x,
                y: item.y,
                cursor: activeTool === 'hand' ? 'grab' : 'crosshair'
              }}
              whileDrag={{ scale: 1.1, zIndex: 10, cursor: 'grabbing' }}
              title={activeTool === 'hand' ? "Arrastra hacia abajo para devolver al escritorio" : "Clic para vincular"}
            >
              <div 
                className="cork-pin" 
                style={{ background: isDeciphered ? 'radial-gradient(circle at 35% 35%, #44ff44, #006400)' : undefined }}
              />
              {item.id.match(/\.(jpg|jpeg|png|avif|webp)$/i) ? (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={`/src/assets/${item.id}`} 
                    alt={item.id} 
                    draggable={false}
                    style={{ 
                      width: '150px', 
                      background: item.id.startsWith('cassette') ? 'transparent' : 'white',
                      border: item.id.startsWith('cassette') ? 'none' : '4px solid white', 
                      borderRadius: '2px',
                      boxShadow: (glowP3 && ['MANO.avif', 'IMAGEN.jpg', 'TEXTO.jpeg', 'VACIO.webp'].includes(item.id)) || (glowP4 && item.id.startsWith('cassette')) ? '0 0 20px 5px #44ff44' : (item.id.startsWith('cassette') ? 'none' : '2px 4px 6px rgba(0,0,0,0.4)'),
                      filter: item.id === 'cassette2.png' ? (glowP4 ? 'hue-rotate(120deg) drop-shadow(0 0 10px #44ff44)' : 'hue-rotate(120deg) drop-shadow(2px 4px 6px rgba(0,0,0,0.5))') : item.id === 'cassette3.png' ? (glowP4 ? 'hue-rotate(240deg) drop-shadow(0 0 10px #44ff44)' : 'hue-rotate(240deg) drop-shadow(2px 4px 6px rgba(0,0,0,0.5))') : (glowP4 && item.id.startsWith('cassette') ? 'drop-shadow(0 0 10px #44ff44)' : (item.id.startsWith('cassette') ? 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))' : 'none')),
                      transition: 'box-shadow 0.3s ease, filter 0.3s ease',
                      pointerEvents: 'none'
                    }} 
                  />
                  {item.id.startsWith('cassette') && (
                    <div style={{
                      position: 'absolute',
                      top: '36%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#111',
                      fontFamily: '"Comic Sans MS", cursive, sans-serif',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      opacity: 0.8,
                      pointerEvents: 'none',
                      textShadow: '0 0 2px rgba(255,255,255,0.8)'
                    }}>
                      {item.id.replace('cassette', '').replace('.png', '') || '1'}
                    </div>
                  )}
                </div>
              ) : item.id === 'FLUSSER.docx' ? (
                <div style={{
                  background: 'linear-gradient(135deg, #2c1800, #111 50%, #000)',
                  border: '1px solid rgba(255,215,0,0.5)',
                  width: '90px',
                  height: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: (glowP4 && ['JALISCO_AGOSTO_2025.docx', 'JALISCO_SEPTIEMBRE_2025.docx', 'JALISCO_NOVIEMBRE_2025.docx'].includes(item.id)) ? '0 0 20px 5px #44ff44' : '2px 4px 6px rgba(0,0,0,0.3)',
                  borderRadius: '0 3px 3px 0'
                }}>
                  <div style={{ 
                    color: 'gold', 
                    fontFamily: 'Cinzel, serif', 
                    fontSize: '40px', 
                    textShadow: '0 0 5px rgba(255,215,0,0.5)' 
                  }}>
                    0
                  </div>
                </div>
              ) : (
                <div className="cork-card" style={{
                  boxShadow: (glowP4 && ['JALISCO_AGOSTO_2025.docx', 'JALISCO_SEPTIEMBRE_2025.docx'].includes(item.id)) ? '0 0 20px 5px #44ff44' : '2px 4px 6px rgba(0,0,0,0.3)'
                }}>
                  <span className="cork-label">{item.id.replace('.docx', '')}</span>
                  <div className="cork-preview-text">
                    {previews[item.id]}
                  </div>
                </div>
              )}
            </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}


// ─── FaxInbox ──────────────────────────────────────────────────────────────
function FaxInbox({ activeTool, faxes, setFaxes }) {
  
  const toggleMinimize = (id, minimize) => {
    setFaxes(prev => prev.map(f => f.id === id ? { ...f, isMinimized: minimize } : f));
  };
  
  const setPrinted = (id) => {
    setFaxes(prev => prev.map(f => f.id === id ? { ...f, hasPrinted: true } : f));
  };

  return (
    <>
      {/* La bandeja siempre está en el escritorio */}
      <div className="inbox-tray">
        <div className="inbox-label">INBOX</div>
        
        {/* Si están minimizados, aparecen DENTRO de la bandeja */}
        {faxes.map(f => f.isMinimized && (
          <motion.div
            key={f.id}
            className="fax-envelope"
            onClick={() => toggleMinimize(f.id, false)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="envelope-icon">✉️</span>
            <span className="envelope-label">{f.id.split('_')[0]}</span>
          </motion.div>
        ))}
      </div>

      {/* Si no está minimizado, se muestra el fax abierto flotando */}
      {faxes.map((f, index) => !f.isMinimized && (
        <motion.div
          key={f.id}
          className="fax-container"
          style={{ zIndex: 50 + index }}
          initial={f.hasPrinted ? { y: 0, scale: 0.8, opacity: 0 } : { y: 800, opacity: 1 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={f.hasPrinted ? { type: "spring", stiffness: 300, damping: 20 } : { type: "tween", duration: 4, ease: "linear", delay: 0.5 }}
          onAnimationComplete={() => setPrinted(f.id)}
          drag={activeTool === 'hand'}
          dragConstraints={{ top: -400, bottom: 400, left: -200, right: 800 }}
          dragMomentum={false}
        >
          <div className="fax-close" onClick={() => toggleMinimize(f.id, true)}>X</div>
          <div className="fax-paper">
            <div className="fax-header">
              <div>TELEGRAM TRANSMISSION -- DATE: [REDACTED]</div>
              <div>FROM: Z. -- TO: NOVICE</div>
              <hr className="fax-divider" />
            </div>
            <h2>{f.id.split('_')[0]}</h2>
            {documents[f.id] ? documents[f.id].split('\n\n').slice(1).map((p, i) => (
              <p key={i} className={p === 'Z.' || p === '- Z.' ? 'fax-signature' : ''}>{p}</p>
            )) : <p>Cargando mensaje...</p>}
          </div>
        </motion.div>
      ))}
    </>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [activeTool, setActiveTool] = useState('hand');
  const [topZ, setTopZ] = useState(20);
  const [zIndices, setZIndices] = useState(
    Object.keys(documents).reduce((acc, key) => ({ ...acc, [key]: 20 }), {})
  );
  const [deskDocuments, setDeskDocuments] = useState([]);
  const [corkboardItems, setCorkboardItems] = useState([]);
  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [hoveredDossier, setHoveredDossier] = useState(null);
  const [view, setView] = useState('desk');
  const [selectedGlossaryWord, setSelectedGlossaryWord] = useState(null);
  const [dragState, setDragState] = useState({ active: false, inRange: false });
  const [fullyDecipheredDocs, setFullyDecipheredDocs] = useState([]);
  const [revealedConcepts, setRevealedConcepts] = useState([]);
  const [hasCoffeeOnDesk, setHasCoffeeOnDesk] = useState(false);

  // ─── GAME STATE MACHINE ───
  const [gamePhase, setGamePhase] = useState(1);
  const [drawerData, setDrawerData] = useState(INITIAL_DRAWERS);
  const [faxes, setFaxes] = useState([
    { id: 'BIENVENIDX_0.docx', isMinimized: false, hasPrinted: false }
  ]);

  useEffect(() => {
    if (gamePhase === 1) {
      const phase1Docs = INITIAL_DRAWERS[0].docs;
      const allPhase1Deciphered = phase1Docs.length > 0 && phase1Docs.every(doc => fullyDecipheredDocs.includes(doc));
      
      if (allPhase1Deciphered) {
        setGamePhase(2);
        setDrawerData(prev => prev.map(d => {
          if (d.id === 2) {
            return { ...d }; // Keep name as VACÍO until phase 4
          }
          return d;
        }));
      }
    }
  }, [fullyDecipheredDocs, gamePhase]);

  // ─── TELEGRAM STATE MACHINE ───
  useEffect(() => {
    if (revealedConcepts.length >= 3) {
      setFaxes(prev => prev.some(f => f.id === 'CORCHO_1.docx') ? prev : [...prev, { id: 'CORCHO_1.docx', isMinimized: false, hasPrinted: false }]);
    }
    if (revealedConcepts.length >= 7) {
      setFaxes(prev => prev.some(f => f.id === 'NECTAR_2.docx') ? prev : [...prev, { id: 'NECTAR_2.docx', isMinimized: false, hasPrinted: false }]);
    }
    const totalConcepts = Object.keys(conceptMapping).length;
    // Set threshold to 8 because some concepts (like "Partida") might only exist in the glossary, not in the documents themselves.
    if (revealedConcepts.length >= 8) {
      setFaxes(prev => prev.some(f => f.id === 'CORREO_3.docx') ? prev : [...prev, { id: 'CORREO_3.docx', isMinimized: false, hasPrinted: false }]);
      // Las fotografías deben aparecer en la mesa
      setDeskDocuments(prev => {
        const PHASE3_FILES = ['FLUSSER.docx', 'MANO.avif', 'IMAGEN.jpg', 'TEXTO.jpeg', 'VACIO.webp'];
        const missing = PHASE3_FILES.filter(f => !prev.includes(f) && !corkboardItems.some(c => c.id === f));
        if (missing.length > 0) return [...prev, ...missing];
        return prev;
      });
    }
  }, [revealedConcepts]);

  // ─── PHASE 3 SUCCESS LISTENER ───
  useEffect(() => {
    const handlePhase3Success = () => {
      setTimeout(() => {
        setGamePhase(4);
        setFaxes(prev => prev.some(f => f.id === 'FELICIDADES_4.docx') ? prev : [...prev, { id: 'FELICIDADES_4.docx', isMinimized: false, hasPrinted: false }]);
        setDeskDocuments(prev => {
          if (!prev.includes('reproductor.png')) return [...prev, 'reproductor.png'];
          return prev;
        });
        setDrawerData(prev => prev.map(d => d.id === 2 ? {
          ...d, 
          name: "JALISCO 2025-2026",
          docs: ['JALISCO_AGOSTO_2025.docx', 'JALISCO_SEPTIEMBRE_2025.docx', 'JALISCO_NOVIEMBRE_2025.docx', 'cassette.png', 'cassette2.png', 'cassette3.png'],
          isLocked: false
        } : d));
      }, 1500); // Esperar el destello verde antes de aventar las cosas
    };
    window.addEventListener('phase3-success', handlePhase3Success);
    return () => window.removeEventListener('phase3-success', handlePhase3Success);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) setIsCabinetOpen(true);
        return;
      }
      if (!isCabinetOpen) {
        if (dragState.active || window.__isDraggingPin) return;
        
        if (e.code === 'ArrowUp'    || e.code === 'KeyW') setView('corkboard');
        if (e.code === 'ArrowRight' || e.code === 'KeyD') setView('coffee');
        if (e.code === 'ArrowDown'  || e.code === 'KeyS') setView('desk');
        if (e.code === 'ArrowLeft'  || e.code === 'KeyA') setView('desk');
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsCabinetOpen(false);
        setActiveDrawer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isCabinetOpen, dragState.active]);

  // — untouched —
  const bringToFront = (key) => {
    setTopZ(topZ + 1);
    setZIndices({ ...zIndices, [key]: topZ + 1 });
  };
  
  const toggleDocument = (key) => {
    // If it's already on desk, we don't automatically remove it unless it's stored in cabinet.
    // toggleDocument is used by cabinet pull out/store.
    if (deskDocuments.includes(key)) {
      setDeskDocuments(deskDocuments.filter(d => d !== key));
    } else {
      setDeskDocuments([...deskDocuments, key]);
      bringToFront(key);
    }
  };

  const handlePinToCorkboard = (key, x, y) => {
    setDeskDocuments(prev => prev.filter(d => d !== key));
    setCorkboardItems(prev => [...prev, { id: key, x: x - 60, y: y - 60, rotation: (Math.random() - 0.5) * 15 }]);
  };

  const handleUpdatePin = (key, x, y) => {
    setCorkboardItems(prev => prev.map(item => item.id === key ? { ...item, x: x - 60, y: y - 60 } : item));
  };

  const handleRemovePin = (key) => {
    setCorkboardItems(prev => prev.filter(item => item.id !== key));
    setDeskDocuments(prev => [...prev, key]);
    bringToFront(key);
    setView('desk');
  };

  return (
    /* 1. CONTENEDOR MAESTRO */
    <div className="app-root">

      {/* HUD — position absolute relativo al app-root */}
      <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} view={view} />

      <div className={`view-label ${view === 'corkboard' ? 'top-label' : ''}`}>
        {view === 'desk'      && <><span>ESCRITORIO</span><span className="nav-hint">W arriba  ·  D derecha</span></>}
        {view === 'corkboard' && <><span>TABLERO</span><span className="nav-hint">S / Abajo  para regresar</span></>}
        {view === 'coffee'    && <><span>DESCANSO</span><span className="nav-hint">A / Izquierda  para regresar</span></>}
      </div>

      {/* 2. EL MUNDO */}
      <motion.div
        className="world"
        initial={false}
        animate={CAMERA[view]}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      >

        {/* 3a. CAPA SUPERIOR — Corkboard (top: 0, left: 0) */}
        <div className="world-cell cork-cell">
          <CorkboardView 
            corkboardItems={corkboardItems} 
            onRemovePin={handleRemovePin} 
            onUpdatePin={handleUpdatePin} 
            activeTool={activeTool} 
            fullyDecipheredDocs={fullyDecipheredDocs}
            revealedConcepts={revealedConcepts}
          />
        </div>

        {/* 3b. CAPA CENTRAL — Desk (top: 100vh, left: 0) */}
        <div className={`world-cell desk-cell tool-${activeTool}`}>

          {/* Iluminación de escritorio (Z-index: 31 y 90) */}
          <div className="lamp-overlay-dodge" />
          <div className="lamp-overlay-multiply" />

          {dragState.active && (
            <div className={`corkboard-drop-indicator ${dragState.inRange ? 'in-range' : ''}`}>
              <div className="indicator-text">↑ ARRASTRA AL BORDE PARA FIJAR EN CORCHO ↑</div>
            </div>
          )}

          {/* Prompt dentro de la celda del escritorio */}
          <motion.div 
            className="cabinet-prompt-desk"
            animate={{ opacity: isCabinetOpen ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            MANTEN [ESPACIO] PARA ABRIR ARCHIVERO
          </motion.div>

          {/* Taza de café en el escritorio */}
          {hasCoffeeOnDesk && (
            <div className="desk-mug">
              <div className="desk-mug-liquid"></div>
              <div className="desk-mug-label">TAZA</div>
            </div>
          )}

          {/* Glosario */}
          <Glossary 
            selectedGlossaryWord={selectedGlossaryWord}
            setSelectedGlossaryWord={setSelectedGlossaryWord}
            activeTool={activeTool}
            glossaryPages={dynamicGlossaryPages}
          />
          
          <FaxInbox activeTool={activeTool} faxes={faxes} setFaxes={setFaxes} />

          {/* Documentos en la mesa */}
          {deskDocuments.map((key) => {
            if (key === 'reproductor.png') {
              return (
                <AudioPlayer
                  key={key}
                  initialPos={{ x: window.innerWidth / 2 - 250, y: - (window.innerHeight / 2) + 150 }}
                  zIndex={zIndices[key]}
                  onInteraction={() => bringToFront(key)}
                />
              );
            }
            if (key.startsWith('cassette')) {
              return (
                <AudioCassette
                  key={key}
                  filename={key}
                  view={view}
                  onPinToCorkboard={handlePinToCorkboard}
                  setDragState={setDragState}
                  setView={setView}
                  initialPos={initialPositions[key]}
                  zIndex={zIndices[key]}
                  onInteraction={() => bringToFront(key)}
                  isCabinetOpen={isCabinetOpen}
                  activeDrawer={activeDrawer}
                  onHoverCabinet={(title) => setHoveredDossier(title)}
                  onStore={() => handleRemoveFromDesk(key)}
                  drawerData={drawerData}
                />
              );
            }
            if (key.match(/\.(jpg|jpeg|png|avif|webp)$/i)) {
              return (
                <ImageDocument
                  key={key}
                  filename={key}
                  view={view}
                  onPinToCorkboard={handlePinToCorkboard}
                  setDragState={setDragState}
                  setView={setView}
                  initialPos={initialPositions[key]}
                  zIndex={zIndices[key]}
                  onInteraction={() => bringToFront(key)}
                  isCabinetOpen={isCabinetOpen}
                  activeDrawer={activeDrawer}
                  onHoverCabinet={(title) => setHoveredDossier(title)}
                  onStore={() => toggleDocument(key)}
                  drawerData={drawerData}
                />
              );
            }
            if (key === 'FLUSSER.docx') {
              return (
                <TornNote
                  key={key}
                  filename={key}
                  text={documents[key]}
                  view={view}
                  onPinToCorkboard={handlePinToCorkboard}
                  setDragState={setDragState}
                  setView={setView}
                  initialPos={initialPositions[key]}
                  zIndex={zIndices[key]}
                  onInteraction={() => bringToFront(key)}
                  isCabinetOpen={isCabinetOpen}
                  activeDrawer={activeDrawer}
                  onHoverCabinet={(title) => setHoveredDossier(title)}
                  onStore={() => toggleDocument(key)}
                  drawerData={drawerData}
                />
              );
            }
            return (
              <RedactedDossier
                key={key}
                title={key.replace('.docx', '')}
                filename={key}
                text={documents[key]}
                activeTool={activeTool}
                selectedGlossaryWord={selectedGlossaryWord}
                view={view}
                onPinToCorkboard={handlePinToCorkboard}
                setDragState={setDragState}
                revealedConcepts={revealedConcepts}
                onRevealConcept={(concept) => setRevealedConcepts(prev => [...new Set([...prev, concept])])}
                isFullyDeciphered={fullyDecipheredDocs.includes(key)}
                setFullyDecipheredDocs={setFullyDecipheredDocs}
                onFullyDeciphered={(key) => setFullyDecipheredDocs(prev => [...new Set([...prev, key])])}
                setView={setView}
                initialPos={initialPositions[key]}
                zIndex={zIndices[key]}
                onInteraction={() => bringToFront(key)}
                isCabinetOpen={isCabinetOpen}
                activeDrawer={activeDrawer}
                onHoverCabinet={(title) => setHoveredDossier(title)}
                onStore={() => toggleDocument(key)}
                drawerData={drawerData}
              />
            );
          })}

          {/* FilingCabinet con z-index alto */}
          <div className="filing-cabinet-slot">
            <FilingCabinet
              isOpen={isCabinetOpen}
              allDocuments={Object.keys(documents)}
              deskDocuments={deskDocuments}
              corkboardItems={corkboardItems}
              activeDrawer={activeDrawer}
              setActiveDrawer={setActiveDrawer}
              drawerData={drawerData}
              hoveredDossier={hoveredDossier}
              onPullOut={toggleDocument}
            />
          </div>
        </div>

        {/* 3c. CAPA LATERAL — Coffee (top: 100vh, left: 100vw) */}
        <div className="world-cell coffee-cell">
          <CoffeeMachine setHasCoffeeOnDesk={setHasCoffeeOnDesk} />
        </div>

      </motion.div>
    </div>
  );
}

export default App;
