import React from 'react';
import { CardControls } from '../CardControls/CardControls';
import { PlaygroundIcon } from '../Icons/Icons';
import './PlaygroundGate.css';

type PlaygroundGateProps = {
  onStart: () => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const PlaygroundGate = ({ onStart, onMinimize, onClose, t }: PlaygroundGateProps) => {
    return (
        <div className="playground-gate-view">
            <div className="card">
                <CardControls onMinimize={onMinimize} onClose={onClose} />
                <PlaygroundIcon />
                <h2>{t('header.playground')}</h2>
                <p>{t('playground.prompt')}</p>
                <div className="age-options">
                    <button className="btn" onClick={onStart}>
                        {t('playground.start')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaygroundGate;
