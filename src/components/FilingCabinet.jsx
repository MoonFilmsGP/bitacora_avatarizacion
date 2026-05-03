import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TelemetryEngine } from '../TelemetryEngine';
import './FilingCabinet.css';



export default function FilingCabinet({ 
  isOpen, 
  allDocuments, 
  deskDocuments, 
  corkboardItems,
  activeDrawer, 
  setActiveDrawer, 
  drawerData, 
  hoveredDossier, 
  onPullOut 
}) {
  const [shakingDrawer, setShakingDrawer] = useState(null);

  // Close the drawer if the cabinet is closed
  useEffect(() => {
    if (!isOpen) {
      setActiveDrawer(null);
    }
  }, [isOpen]);

  // Listen for keyboard input when cabinet is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (['1', '2', '3'].includes(e.key)) {
        if (!e.repeat) {
          const targetId = parseInt(e.key);
          const targetDrawer = drawerData.find(d => d.id === targetId);
          if (targetDrawer && targetDrawer.isLocked) {
            // Cannot open locked drawer
            setShakingDrawer(targetId);
            setTimeout(() => setShakingDrawer(null), 400); // 400ms shake
            TelemetryEngine.log('Cabinet_Drawer_Locked_Attempt', { drawerId: e.key });
            return;
          }
          setActiveDrawer(targetId);
          TelemetryEngine.log('Cabinet_Drawer_Pulled_Open', { drawerId: e.key });
        }
      }
    };

    const handleKeyUp = (e) => {
      if (['1', '2', '3'].includes(e.key)) {
        setActiveDrawer((prev) => {
          if (prev === parseInt(e.key)) {
            TelemetryEngine.log('Cabinet_Drawer_Released_Closed', { drawerId: e.key });
            return null;
          }
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  const handleDragEnd = (event, info, doc) => {
    // If dropped on the desk (outside the cabinet zone)
    if (info.point.x < window.innerWidth - 400) {
      setTimeout(() => {
        onPullOut(doc);
        TelemetryEngine.log('Cabinet_Folder_Pulled_To_Desk', { doc });
      }, 50); // delay unmount to allow drag event to clear safely
    }
  };

  // Determine drop zone feedback for dossiers being stored
  let dropOverlay = null;
  if (hoveredDossier && activeDrawer !== null) {
    const correctDrawer = drawerData.find(d => d.docs.includes(hoveredDossier));
    const isValid = correctDrawer && correctDrawer.id === activeDrawer;
    dropOverlay = (
      <div className={`cabinet-drop-overlay ${isValid ? 'valid' : 'invalid'}`}>
        <div className="drop-icon">{isValid ? '↓' : '×'}</div>
        <div className="drop-text">{isValid ? 'SUELTA PARA ARCHIVAR' : 'CAJÓN INCORRECTO'}</div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="filing-cabinet"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Metal Drawer Aesthetics */}
          <div className="cabinet-casing">
            <div className="cabinet-inner-shadow"></div>
            
            <h2 className="cabinet-title">
              {activeDrawer === null ? "ARCHIVOS CONFIDENCIALES" : `CAJÓN [${activeDrawer}] ABIERTO`}
            </h2>
            
            <div className="cabinet-content-area">
              {/* EXTERIOR: ALWAYS VISIBLE */}
              <div className="cabinet-front-view">
                {drawerData.map(d => (
                  <div key={d.id} className={`drawer-front ${activeDrawer === d.id ? 'active' : ''} ${shakingDrawer === d.id ? 'shake-locked' : ''}`}>
                    <div className="drawer-handle-container">
                      <div className="drawer-handle"></div>
                    </div>
                    <div className="drawer-label-plate">
                      {d.isLocked ? (
                        <>
                          <div className="drawer-number" style={{ color: '#ff4444' }}>[BLOQUEADO]</div>
                          <div className="drawer-name" style={{ fontSize: '20px' }}>🔒 {d.name}</div>
                        </>
                      ) : (
                        <>
                          <div className="drawer-number">MANTÉN [{d.id}] PARA JALAR</div>
                          <div className="drawer-name">{d.name}</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* INTERIOR: RENDERS ON TOP WHEN ACTIVE */}
              <AnimatePresence>
                {activeDrawer !== null && (
                  <motion.div 
                    key="interior"
                    className="cabinet-drawers"
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    {drawerData.find(d => d.id === activeDrawer)?.docs.map((doc, index) => {
                      const isOnDesk = deskDocuments.includes(doc) || (corkboardItems && corkboardItems.some(i => i.id === doc));
                      const title = doc.replace('.docx', '');
                      
                      // If it's on the desk or corkboard, it's missing from the drawer (just an empty gap)
                      if (isOnDesk) {
                        return (
                          <div key={doc} className="cabinet-folder-gap">
                            <span className="gap-label">EXTRAÍDO</span>
                          </div>
                        );
                      }

                      const isCassette = doc.startsWith('cassette');

                      return (
                        <motion.div 
                          key={doc}
                          className={isCassette ? "cabinet-cassette full" : "cabinet-folder full"}
                          drag
                          dragSnapToOrigin={true}
                          onDragEnd={(e, info) => handleDragEnd(e, info, doc)}
                          whileHover={{ x: -15, transition: { duration: 0.2 } }}
                          whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 500 }}
                          title="Arrastrar a la mesa"
                        >
                          {!isCassette && (
                            <div className="folder-tab" style={{ right: `${(index % 3) * 30 + 10}px` }}>
                              {title.substring(0, 3).toUpperCase()}
                            </div>
                          )}
                          <div className={isCassette ? "cassette-label" : "folder-label"}>
                            {isCassette ? `CASSETTE ${doc.replace('cassette', '').replace('.png', '') || '1'}` : title}
                          </div>
                          <div className={isCassette ? "cassette-pull-hint" : "folder-pull-hint"}>« ARRASTRAR</div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {dropOverlay}
            </div>
            
            <div className="cabinet-footer">
              {activeDrawer === null ? "MANTÉN [1][2][3] PARA ABRIR CAJÓN" : "SUELTA PARA CERRAR"}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
