import React, { useEffect, useRef } from 'react';
import { AgentProfile, AgentAvatarState, ChatMessage } from '../../lib/types';
import { VideoOnIcon, VideoOffIcon } from '../Icons/Icons';
import './VoiceAssistantView.css';

const AgentAvatar = ({ agent, state }: { agent: AgentProfile; state: AgentAvatarState; }) => {
    return (
        <div className={`agent-avatar-container state-${state}`}>
            <div className="agent-avatar-pulse"></div>
            <div className="agent-avatar">
                {state === 'thinking' ? '🤔' : agent.avatar}
            </div>
        </div>
    );
};

type VoiceAssistantViewProps = {
    agent: AgentProfile;
    history: ChatMessage[];
    avatarState: AgentAvatarState;
    isAgentSpeaking: boolean;
    isCameraEnabled: boolean;
    setIsCameraEnabled: (enabled: boolean) => void;
    localVideoEl: React.RefObject<HTMLVideoElement>;
    onSendMessage: (message: string) => void;
    t: (key: string) => string;
    inputText: string;
    setInputText: (text: string) => void;
};

const VoiceAssistantView = ({
    agent,
    history,
    avatarState,
    isAgentSpeaking,
    isCameraEnabled,
    setIsCameraEnabled,
    localVideoEl,
    onSendMessage,
    t,
    inputText,
    setInputText,
}: VoiceAssistantViewProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);
    
    const handleSend = () => {
        if (inputText.trim()) {
            onSendMessage(inputText.trim());
            setInputText('');
        }
    };
    
    return (
        <div className="voice-assistant-view">
            <div className="agent-header">
                <AgentAvatar agent={agent} state={avatarState} />
                <h2>{t(`voiceAssistant.${agent.name}`)}</h2>
                <div className={`audio-visualizer ${isAgentSpeaking ? "speaking" : ""}`}>
                    {[...Array(5)].map((_, i) => <div key={i} className="bar"></div>)}
                </div>
            </div>
            
            <div className="va-messages-container">
                {history.map((msg, i) => (
                    <div key={i} className={`va-chat-bubble-wrapper ${msg.sender}`}>
                        <div className="va-chat-bubble">{msg.text}</div>
                    </div>
                ))}
                 {avatarState === 'thinking' && (
                     <div className="va-chat-bubble-wrapper buddy">
                         <div className="va-chat-bubble typing-indicator">
                             <span></span><span></span><span></span>
                         </div>
                     </div>
                 )}
                <div ref={messagesEndRef} />
            </div>

            <div className="va-input-area">
                <input
                    type="text"
                    className="va-text-input"
                    placeholder={t('chat.placeholder')}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                <button onClick={handleSend} className="va-send-btn" aria-label="Send message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>

            <div className="user-camera-view" style={{ display: isCameraEnabled ? 'block' : 'none' }}>
                <video ref={localVideoEl} muted playsInline />
            </div>
             <button className="camera-toggle-btn" onClick={() => setIsCameraEnabled(!isCameraEnabled)}>
                {isCameraEnabled ? <VideoOnIcon /> : <VideoOffIcon />}
            </button>
        </div>
    );
};

export default VoiceAssistantView;
