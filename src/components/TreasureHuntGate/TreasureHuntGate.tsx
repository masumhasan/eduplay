import React from 'react';
import { TreasureHuntIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import './TreasureHuntGate.css';

type TreasureHuntGateProps = {
  onStart: () => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const TreasureHuntGate = ({ onStart, onMinimize, onClose, t }: TreasureHuntGateProps) => {
  return (
    <div className="quiz-gate-view">
      <div className="card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        <TreasureHuntIcon />
        <h2>{t('treasureHunt.title')}</h2>
        <p>{t('treasureHunt.prompt')}</p>
        <button className="btn" onClick={onStart}>
          {t('treasureHunt.startButton')}
        </button>
      </div>
    </div>
  );
};

export default TreasureHuntGate;