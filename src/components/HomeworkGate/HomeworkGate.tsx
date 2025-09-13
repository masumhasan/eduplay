import React from 'react';
import { HomeworkMode } from '../../lib/types';
import { QuizIcon, ObjectsIcon, StoryIcon, HomeworkIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import './HomeworkGate.css';

type HomeworkGateProps = {
  onSelectMode: (mode: HomeworkMode) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const HomeworkGate = ({ onSelectMode, onMinimize, onClose, t }: HomeworkGateProps) => {
  const modes: { mode: HomeworkMode; icon: JSX.Element; label: string }[] = [
    { mode: 'math', icon: <QuizIcon />, label: t('homework.math') },
    { mode: 'science', icon: <ObjectsIcon />, label: t('homework.science') },
    { mode: 'essay', icon: <StoryIcon />, label: t('homework.essay') },
    { mode: 'general', icon: <HomeworkIcon />, label: t('homework.general') },
  ];

  return (
    <div className="homework-gate-view">
      <div className="card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        <h2>{t('homework.title')}</h2>
        <p>{t('homework.prompt')}</p>
        <div className="homework-modes-grid">
          {modes.map(({ mode, icon, label }) => (
            <div
              key={mode}
              className="homework-mode-card"
              onClick={() => onSelectMode(mode)}
            >
              {icon}
              <h3>{label}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeworkGate;