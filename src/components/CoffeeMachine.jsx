import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import './CoffeeMachine.css';
import { TelemetryEngine } from '../TelemetryEngine';

export default function CoffeeMachine({ setHasCoffeeOnDesk }) {
  const [pitcherWater, setPitcherWater] = useState(0); // 0 or 100
  const [machineWater, setMachineWater] = useState(0); // 0 to 100
  const [machineCoffee, setMachineCoffee] = useState(0); // 0 or 100
  const [carafeCoffee, setCarafeCoffee] = useState(0); // 0 to 100
  const [mugCoffee, setMugCoffee] = useState(0); // 0 to 100
  const [isBrewing, setIsBrewing] = useState(false);

  // Return to origin controls for draggable items
  const garrafonControls = useAnimation();
  const pitcherControls = useAnimation();
  const bagControls = useAnimation();
  const carafeControls = useAnimation();

  const checkCollision = (point, targetId) => {
    const el = document.getElementById(targetId);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    // Expand hitbox slightly for UX
    const padding = 20;
    return (
      point.x >= rect.left - padding &&
      point.x <= rect.right + padding &&
      point.y >= rect.top - padding &&
      point.y <= rect.bottom + padding
    );
  };

  const handleDragEnd = async (e, info, itemId) => {
    const pt = info.point;
    let hit = false;

    if (itemId === 'garrafon') {
      if (checkCollision(pt, 'obj-pitcher') && pitcherWater === 0) {
        setPitcherWater(100);
        hit = true;
      }
      garrafonControls.start({ x: 0, y: 0 });
    }

    if (itemId === 'pitcher') {
      if (checkCollision(pt, 'obj-machine-tank') && pitcherWater > 0 && machineWater === 0) {
        setMachineWater(pitcherWater);
        setPitcherWater(0);
        hit = true;
      }
      pitcherControls.start({ x: 0, y: 0 });
    }

    if (itemId === 'bag') {
      if (checkCollision(pt, 'obj-machine-filter') && machineCoffee === 0) {
        setMachineCoffee(100);
        hit = true;
      }
      bagControls.start({ x: 0, y: 0 });
    }

    if (itemId === 'carafe') {
      if (checkCollision(pt, 'obj-mug') && carafeCoffee > 0 && mugCoffee === 0) {
        const amountToPour = Math.min(carafeCoffee, 100);
        setMugCoffee(amountToPour);
        setCarafeCoffee(prev => prev - amountToPour);
        setHasCoffeeOnDesk(true); // Notify App that we got coffee
        TelemetryEngine.log('Coffee_Poured');
        hit = true;
      }
      carafeControls.start({ x: 0, y: 0 });
    }
  };

  const handleBrew = () => {
    if (machineWater > 0 && machineCoffee > 0 && !isBrewing) {
      setIsBrewing(true);
      TelemetryEngine.log('Coffee_Brewing_Started');
    }
  };

  useEffect(() => {
    let brewInterval;
    if (isBrewing) {
      brewInterval = setInterval(() => {
        setMachineWater((prev) => {
          if (prev <= 0) {
            clearInterval(brewInterval);
            setIsBrewing(false);
            setMachineCoffee(0); // used up
            return 0;
          }
          setCarafeCoffee((c) => Math.min(c + 5, 100));
          return prev - 5;
        });
      }, 300); // 5% every 300ms
    }
    return () => clearInterval(brewInterval);
  }, [isBrewing]);

  return (
    <div className="coffee-station">
      <div className="coffee-station-bg"></div>
      
      <div className="station-shelf">
        {/* Garrafón */}
        <motion.div 
          id="obj-garrafon"
          className="coffee-obj garrafon"
          drag dragMomentum={false}
          animate={garrafonControls}
          onDragEnd={(e, info) => handleDragEnd(e, info, 'garrafon')}
          whileDrag={{ scale: 1.1, zIndex: 50 }}
        >
          <div className="garrafon-water" />
          <div className="obj-label">GARRAFÓN</div>
        </motion.div>

        {/* Jarra de agua */}
        <motion.div 
          id="obj-pitcher"
          className="coffee-obj pitcher"
          drag dragMomentum={false}
          animate={pitcherControls}
          onDragEnd={(e, info) => handleDragEnd(e, info, 'pitcher')}
          whileDrag={{ scale: 1.1, zIndex: 50 }}
        >
          <div className="pitcher-water" style={{ height: `${pitcherWater}%` }} />
          <div className="obj-label">JARRA</div>
        </motion.div>

        {/* Bolsa de café */}
        <motion.div 
          id="obj-bag"
          className="coffee-obj bag"
          drag dragMomentum={false}
          animate={bagControls}
          onDragEnd={(e, info) => handleDragEnd(e, info, 'bag')}
          whileDrag={{ scale: 1.1, zIndex: 50 }}
        >
          <div className="obj-label">CAFÉ</div>
        </motion.div>
      </div>

      <div className="station-desk">
        {/* Máquina de Café */}
        <div className="coffee-machine">
          <div className="machine-top">
            <div id="obj-machine-tank" className="machine-tank">
              <div className="tank-water" style={{ height: `${machineWater}%` }} />
            </div>
            <div id="obj-machine-filter" className="machine-filter">
              {machineCoffee > 0 && <div className="filter-coffee" />}
            </div>
          </div>
          
          <div className="machine-mid">
            {/* Carafe is draggable from the machine */}
            {!isBrewing ? (
              <motion.div 
                id="obj-machine-carafe"
                className="machine-carafe"
                drag dragMomentum={false}
                animate={carafeControls}
                onDragEnd={(e, info) => handleDragEnd(e, info, 'carafe')}
                whileDrag={{ scale: 1.1, zIndex: 50 }}
              >
                <div className="carafe-liquid" style={{ height: `${carafeCoffee}%` }} />
              </motion.div>
            ) : (
              <div id="obj-machine-carafe" className="machine-carafe brewing">
                <div className="carafe-liquid" style={{ height: `${carafeCoffee}%` }} />
                <div className="coffee-drip" />
              </div>
            )}
          </div>
          
          <div className="machine-base">
            <div 
              className={`machine-btn ${isBrewing ? 'on' : ''}`}
              onClick={handleBrew}
            />
          </div>
        </div>

        {/* Taza */}
        <div id="obj-mug" className="coffee-obj mug">
          <div className="mug-liquid" style={{ height: `${mugCoffee}%` }} />
          <div className="obj-label">TAZA</div>
        </div>
      </div>
    </div>
  );
}
