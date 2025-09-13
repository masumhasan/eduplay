import React, { useState } from 'react';
import { CardControls } from '../CardControls/CardControls';
import './QuizGate.css';

type QuizGateProps = {
  onStartQuiz: () => void;
  onStartCustomQuiz: (topic: string) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const QuizGate = ({ onStartQuiz, onStartCustomQuiz, onMinimize, onClose, t }: QuizGateProps) => {
    const [customTopic, setCustomTopic] = useState('');

    const handleCustomQuizSubmit = () => {
        if (customTopic.trim()) {
            onStartCustomQuiz(customTopic.trim());
        }
    };

    return (
        <div className="quiz-gate-view">
            <div className="card">
                <CardControls onMinimize={onMinimize} onClose={onClose} />
                <h2>{t('quiz.ready')}</h2>
                <p>{t('quiz.generalQuizPrompt')}</p>
                <div className="age-options">
                    <button className="btn" onClick={onStartQuiz}>
                        {t('quiz.startGeneralQuiz')}
                    </button>
                </div>

                <div className="divider"><span>{t('quiz.or')}</span></div>

                <div className="custom-input-group">
                    <h3>{t('quiz.customQuizTitle')}</h3>
                    <p>{t('quiz.customQuizPrompt')}</p>
                    <input 
                        type="text" 
                        className="custom-input" 
                        placeholder={t('quiz.customQuizPlaceholder')}
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleCustomQuizSubmit()}}
                    />
                    <button 
                        className="btn" 
                        onClick={handleCustomQuizSubmit} 
                        disabled={!customTopic.trim()}
                    >
                        {t('quiz.startCustomQuiz')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizGate;
