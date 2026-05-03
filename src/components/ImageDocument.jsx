import React, { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { TelemetryEngine } from '../TelemetryEngine';
import { ASSETS } from '../assets.js';

export default function ImageDocument({
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
  drawerData,
  onUnlockDrawer
}) {
  const containerRef = useRef(null);
  const x = useMotionValue(initialPos?.x || 0);
  const y = useMotionValue(initialPos?.y || 0);

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
      if (filename === 'llave.png') {
        const targetDrawer = drawerData.find(d => d.id === 3);
        if (targetDrawer && targetDrawer.isLocked) {
          if (onUnlockDrawer) onUnlockDrawer(3);
          setTimeout(() => onStore(), 50); // consume the key
          TelemetryEngine.log('Drawer_Unlocked_With_Key', { drawerId: 3 });
          return;
        }
      }

      const correctDrawer = drawerData.find(d => d.docs.includes(filename));
      if (correctDrawer && correctDrawer.id === activeDrawer) {
        setTimeout(() => onStore(), 50);
        TelemetryEngine.log('Photo_Stored_Via_Drag', { filename });
      }
      return;
    }

    TelemetryEngine.log('Photo_Dragged', { filename, endX: info.point.x, endY: info.point.y });
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
        filter: filename === 'llave.png' ? 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))' : 'drop-shadow(2px 4px 10px rgba(0,0,0,0.5))',
        background: filename === 'llave.png' ? 'transparent' : 'white',
        padding: filename === 'llave.png' ? '0' : '10px',
        paddingBottom: filename === 'llave.png' ? '0' : '30px',
        mixBlendMode: filename === 'llave.png' ? 'multiply' : 'normal'
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
      initial={{ x: initialPos?.x || 0, y: (window.innerHeight || 1000) + 200, opacity: 0 }}
      animate={{ y: initialPos?.y || 0, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
    >
      <img src={ASSETS[filename]} alt={filename} draggable={false} style={{ maxWidth: '300px', maxHeight: '400px', display: 'block', pointerEvents: 'none' }} />
    </motion.div>
  );
}
