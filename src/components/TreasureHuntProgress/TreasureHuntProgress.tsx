import React from 'react';
import './TreasureHuntProgress.css';

type TreasureHuntProgressProps = {
    current: number;
    total: number;
    t: (key: string) => string;
};

// This needs to be declared for TypeScript since the lottie-player is loaded via script tag
// FIX: Corrected the type definition for the 'lottie-player' custom element to be recognized by TypeScript's JSX parser.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': React.HTMLAttributes<HTMLElement> & {
        src: string;
        background?: string;
        speed?: string;
        loop?: boolean;
        autoplay?: boolean;
      };
    }
  }
}

export const TreasureHuntProgress = ({ current, total, t }: TreasureHuntProgressProps) => {
    const isComplete = current === total;

    return (
        <div className="treasure-hunt-progress-overlay">
            <div className={`treasure-hunt-progress-card ${isComplete ? 'complete' : ''}`}>
                {isComplete && (
                     <lottie-player
                        src="https://assets10.lottiefiles.com/packages/lf20_u4yrau.json"
                        background="transparent"
                        speed="1"
                        autoplay
                    ></lottie-player>
                )}
                <h2>{isComplete ? t('treasureHunt.objectiveComplete') : t('treasureHunt.objectiveFound')}</h2>
                <p className="progress-text">{current} / {total}</p>
                <p className="progress-label">{t('treasureHunt.found')}</p>
            </div>
        </div>
    );
};