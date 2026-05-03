import React, { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ASSETS } from '../assets.js';

export default function AudioPlayer({
  initialPos,
  zIndex,
  onInteraction
}) {
  const containerRef = useRef(null);
  const x = useMotionValue(initialPos?.x || 0);
  const y = useMotionValue(initialPos?.y || 0);

  return (
    <motion.div
      ref={containerRef}
      style={{
        position: 'absolute',
        zIndex,
        x,
        y,
        filter: 'drop-shadow(4px 8px 12px rgba(0,0,0,0.6))'
      }}
      onPointerDown={onInteraction}
      initial={{ x: initialPos?.x || 0, y: (window.innerHeight || 1000) + 200, opacity: 0 }}
      animate={{ y: initialPos?.y || 0, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
    >
      <div style={{ position: 'relative' }}>
        <img src={ASSETS['reproductor.png']} alt="Reproductor de audio" draggable={false} style={{ width: '400px', display: 'block', pointerEvents: 'none' }} />
        
        {/* Play Button */}
        <button 
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '120px',
            width: '40px',
            height: '20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Play pressed');
          }}
          title="Play"
        />

        {/* Eject Button */}
        <button 
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '120px',
            width: '40px',
            height: '20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Eject pressed');
          }}
          title="Expulsar Cassette"
        />
      </div>
    </motion.div>
  );
}
