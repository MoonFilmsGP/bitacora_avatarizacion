import React, { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { TelemetryEngine } from '../TelemetryEngine';
import { ASSETS } from '../assets.js';

export default function AudioCassette({
  filename,
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

  // Apply filters to differentiate them
  const hue = filename === 'cassette2.png' ? 120 : filename === 'cassette3.png' ? 240 : 0;

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
        TelemetryEngine.log('Cassette_Stored', { filename });
      }
      return;
    }
  };

  return (
    <motion.div
      ref={containerRef}
      style={{
        position: 'absolute',
        zIndex,
        x,
        y,
        cursor: 'grab',
        filter: `drop-shadow(2px 4px 6px rgba(0,0,0,0.5)) hue-rotate(${hue}deg)`
      }}
      drag
      dragConstraints={{ left: -600, right: 600, top: -500, bottom: 500 }}
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onPointerDown={onInteraction}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      whileHover={{ scale: 1.01 }}
      initial={{ x: initialPos?.x || 0, y: initialPos?.y || 0, opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
    >
      <div style={{ position: 'relative' }}>
        <img src={ASSETS[filename]} alt={filename} draggable={false} style={{ width: '150px', display: 'block', pointerEvents: 'none' }} />
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
          {filename.replace('cassette', '').replace('.png', '') || '1'}
        </div>
      </div>
    </motion.div>
  );
}
