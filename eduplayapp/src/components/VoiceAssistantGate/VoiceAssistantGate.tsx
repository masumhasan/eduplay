import React from 'react';
import { AgentProfile } from '../../lib/types';
import { AGENT_PROFILES } from '../../lib/agents';
import { AgentIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import './VoiceAssistantGate.css';

type VoiceAssistantGateProps = {
    onAgentSelect: (agent: AgentProfile) => void;
    onMinimize: () => void;
    onClose: () => void;
    t: (key: string) => string;
};

const VoiceAssistantGate = ({ onAgentSelect, onMinimize, onClose, t }: VoiceAssistantGateProps) => (
    <div className="voice-assistant-gate-view">
        <div className="card">
            <CardControls onMinimize={onMinimize} onClose={onClose} />
            <AgentIcon />
            <h2>{t('voiceAssistant.title')}</h2>
            <p>{t('voiceAssistant.prompt')}</p>
            <div className="agent-selection-grid">
                {Object.values(AGENT_PROFILES).map(agent => (
                    <div key={agent.name} className="agent-card" onClick={() => onAgentSelect(agent)}>
                        <div className="agent-card-avatar">{agent.avatar}</div>
                        <h3>{t(`voiceAssistant.${agent.name}`)}</h3>
                        <p>{t(`voiceAssistant.${agent.descriptionKey}`)}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default VoiceAssistantGate;