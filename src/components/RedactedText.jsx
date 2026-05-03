import React, { useState } from 'react';
import { TelemetryEngine } from '../TelemetryEngine';
import './RedactedText.css';

export default function RedactedText({ id, text, activeTool = 'hand', selectedGlossaryWord, revealedConcepts, onRevealConcept, expectedConcept }) {
  const [isError, setIsError] = useState(false);

  // normalizer helper function
  const normalize = (str) => {
    if (!str) return "";
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const isRevealed = expectedConcept && revealedConcepts.includes(expectedConcept);

  const handleClick = (e) => {
    // If hand tool is active, they might be trying to reveal. Give hint!
    if (activeTool !== 'lens') {
      window.dispatchEvent(new CustomEvent('tool-hint', { detail: 'lens' }));
      return;
    }
    
    // Prevent dragging from starting when clicking text with the lens
    e.stopPropagation();

    if (isRevealed) return;
    
    if (selectedGlossaryWord && expectedConcept) {
      const attempt = normalize(selectedGlossaryWord);
      const target = normalize(expectedConcept);
      
      if (attempt === target) {
        if (onRevealConcept) onRevealConcept(expectedConcept);
        TelemetryEngine.log('Redaction_Revealed', { id, text, guessed: selectedGlossaryWord, concept: expectedConcept });
      } else {
        triggerError();
        TelemetryEngine.log('Redaction_Guess_Failed', { id, text, guessed: selectedGlossaryWord });
      }
    } else {
      triggerError();
    }
  };

  const triggerError = () => {
    setIsError(true);
    setTimeout(() => setIsError(false), 400);
  };

  if (isRevealed) {
    return (
      <span className="revealed-text">
        {text}
      </span>
    );
  }

  return (
    <span
      className={`redacted-bar ${isError ? 'error' : ''}`}
      onClick={handleClick}
      title="Unreadable"
    >
      {text}
    </span>
  );
}
