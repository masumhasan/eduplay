import React, { useState, useRef } from 'react';
import { HomeworkMode } from '../../lib/types';
import { LoadingView } from '../LoadingView/LoadingView';
import { ObjectsIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import './HomeworkSolverView.css';

type HomeworkSolverViewProps = {
  mode: HomeworkMode;
  onSubmit: (input: { text?: string; image?: { data: string; mimeType: string } }) => void;
  onScanRequest: () => void;
  solution: string | null;
  isLoading: boolean;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const HomeworkSolverView = ({
  mode,
  onSubmit,
  onScanRequest,
  solution,
  isLoading,
  onMinimize,
  onClose,
  t,
}: HomeworkSolverViewProps) => {
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        onSubmit({ image: { data: base64String, mimeType: file.type } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (inputText.trim()) {
      onSubmit({ text: inputText });
    }
  };

  return (
    <div className="homework-solver-view">
      <div className="card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        <div className="homework-input-area">
          <textarea
            placeholder={t('homework.textPlaceholder')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="homework-input-options">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
            />
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              {t('homework.upload')}
            </button>
            <button className="btn btn-secondary" onClick={onScanRequest}>
              <ObjectsIcon /> {t('homework.scan')}
            </button>
          </div>
          <button className="btn" onClick={handleSubmit} disabled={!inputText.trim() || isLoading}>
            {t('homework.getHelp')}
          </button>
        </div>
        
        {isLoading && <LoadingView t={t} />}

        {solution && !isLoading && (
          <div className="solution-box">
            <h3>{t('homework.solutionTitle')}</h3>
            <div className="solution-content">
                {solution}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkSolverView;