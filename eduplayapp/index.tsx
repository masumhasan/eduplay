
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, Chat, Part, Tool, FunctionCall } from '@google/genai';
import { Room, RoomEvent, LocalParticipant, RemoteParticipant, LocalVideoTrack, RemoteTrack, VideoTrack, createLocalVideoTrack } from 'livekit-client';


// --- FIX: Add interfaces for Web Speech API to fix SpeechRecognition errors ---
// This is to provide type definitions for the Web Speech API which is not standard in all TS lib files.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

// Extend the Window interface
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

// --- Types ---
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface LearningBuddyResponse {
  identification: string;
  funFacts: string[];
  soundSuggestion?: string;
  quiz: QuizQuestion;
  encouragement: string;
}

interface ChatMessage {
    sender: 'user' | 'buddy';
    text: string;
}

interface UserProgress {
  stars: number;
  quizzesCompleted: number;
  objectsDiscovered: number;
  learningStreak: number;
  quizLevel: number;
}

type Screen = 'welcome' | 'home' | 'media' | 'loading' | 'result' | 'chat' | 'quiz' | 'rewards';
type ActiveTab = 'Home' | 'Object Scan' | 'Chat' | 'Quiz' | 'Rewards';
type TtsGender = 'male' | 'female';
type MediaType = 'image' | 'video' | 'audio';


// --- SVG Icons ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const ObjectsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const QuizIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path fill="currentColor" d="M15.07,13.45C14.71,14.2,14,15,12,15a3,3,0,0,1-3-3c0-2,3-3,3-3A3,3,0,0,1,14.2,9.92"></path><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"></path><rect x="11" y="17" width="2" height="2"></rect></svg>;
const RewardsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const MicIcon = ({ size = 24 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const MicOffIcon = ({ size = 24 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const StarIcon = ({ filled = false }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const SunIcon = ({ size = 24 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = ({ size = 24 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;


// --- Main App Component ---
const App = () => {
    // --- State Management ---
    const [screen, setScreen] = useState<Screen>('welcome');
    const [activeTab, setActiveTab] = useState<ActiveTab>('Home');
    const [learningBuddyResponse, setLearningBuddyResponse] = useState<LearningBuddyResponse | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress>({ stars: 0, quizzesCompleted: 0, objectsDiscovered: 0, learningStreak: 0, quizLevel: 1 });
    const [error, setError] = useState<string | null>(null);
    const [media, setMedia] = useState<{ type: MediaType, data: string, file?: File }>({ type: 'image', data: '' });
    const [quizAnswered, setQuizAnswered] = useState(false);
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

    // TTS & STT State
    const [isTtsOn, setIsTtsOn] = useState(true);
    const [ttsGender, setTtsGender] = useState<TtsGender>('female');
    const [isVoiceCommandOn, setIsVoiceCommandOn] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceCommandError, setVoiceCommandError] = useState<string | null>(null);

    // Dark Mode
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Chat State
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chat, setChat] = useState<Chat | null>(null);
    const [isBuddyTyping, setIsBuddyTyping] = useState(false);
    
    // LiveKit & Playground State
    const roomRef = useRef<Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const [showChatPanel, setShowChatPanel] = useState(true);
    const [showVideoPanel, setShowVideoPanel] = useState(true);
    const [showAudioPanel, setShowAudioPanel] = useState(true);
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
    const localVideoEl = useRef<HTMLVideoElement>(null);
    
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // --- Gemini AI Setup ---
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const tools: Tool[] = [{
        functionDeclarations: [
            { name: 'startQuiz', description: 'Starts a quiz for the user.' },
            { name: 'getUserProgress', description: 'Gets the user\'s current progress and stats.' },
        ],
    }];
    
    // --- Effects ---
    useEffect(() => {
        document.body.className = `${screen}-bg ${isDarkMode ? 'dark-mode' : ''}`;
    }, [screen, isDarkMode]);

    useEffect(() => {
        if (!process.env.API_KEY) {
            setError("API key is missing. Please set it up to use the app.");
        }
    }, []);
    
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
        }
    }, []);

    // Global Voice Command Listener
    useEffect(() => {
        const recognition = recognitionRef.current;
        if (isVoiceCommandOn && recognition && screen !== 'chat') {
            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => {
                setIsListening(false);
                // Automatically restart listening if voice commands are on
                if (isVoiceCommandOn) {
                    setTimeout(() => recognition.start(), 250);
                }
            };
            recognition.onerror = (event) => {
                console.error("Voice command error:", event.error);
                if (event.error !== 'aborted') {
                   setVoiceCommandError("I'm having trouble hearing you. Please check your internet connection.");
                   setTimeout(() => setVoiceCommandError(null), 3000);
                }
            };
            recognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase().trim();
                handleVoiceCommand(command);
            };
            recognition.start();
        } else {
            recognition?.stop();
        }
        return () => {
            recognition?.stop();
        };
    }, [isVoiceCommandOn, screen]);


    // --- Core Handlers ---
    const handleStart = () => setScreen('home');
    
    const handleNav = (tab: ActiveTab) => {
        setActiveTab(tab);
        switch (tab) {
            case 'Home': setScreen('home'); break;
            case 'Object Scan': setScreen('media'); break;
            case 'Chat': setScreen('chat'); break;
            case 'Quiz': setScreen('quiz'); break;
            case 'Rewards': setScreen('rewards'); break;
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result as string;
                const base64Data = data.split(',')[1];
                setMedia({ type: file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image', data: base64Data, file });
                generateContentForMedia(base64Data, file.type);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAnswerQuiz = (selectedIndex: number) => {
        if (!learningBuddyResponse || quizAnswered) return;
        setQuizAnswered(true);
        const correct = selectedIndex === learningBuddyResponse.quiz.correctAnswerIndex;
        setLastAnswerCorrect(correct);
        if (correct) {
            setUserProgress(prev => ({ ...prev, stars: prev.stars + 1, quizzesCompleted: prev.quizzesCompleted + 1 }));
            speak("That's right! Great job!");
        } else {
            speak("Good try! The correct answer was " + learningBuddyResponse.quiz.options[learningBuddyResponse.quiz.correctAnswerIndex]);
        }
    };
    
    const handleNext = () => {
        setLearningBuddyResponse(null);
        setMedia({ type: 'image', data: '' });
        setQuizAnswered(false);
        setScreen('media');
    };

    const handleVoiceCommand = (command: string) => {
        if (command.includes("open quiz") || command.includes("start quiz")) {
            handleNav('Quiz');
        } else if (command.includes("open chat") || command.includes("go to chat")) {
            handleNav('Chat');
        } else if (command.includes("scan") || command.includes("object")) {
            handleNav('Object Scan');
        } else if (command.includes("open rewards") || command.includes("show my stars")) {
            handleNav('Rewards');
        } else if (command.includes("go home")) {
            handleNav('Home');
        } else if (command.includes("dark mode on") || command.includes("turn on dark mode")) {
            setIsDarkMode(true);
        } else if (command.includes("dark mode off") || command.includes("turn off dark mode")) {
            setIsDarkMode(false);
        }
    };
    
    // --- AI & Generation ---
    const generateContentForMedia = async (base64Data: string, mimeType: string) => {
        setScreen('loading');
        try {
            const prompt = "You are 'EduPlay', a fun and encouraging learning companion for kids aged 4-8. Identify the main object, animal, or scene in this media. Provide three short, exciting fun facts about it. If it makes a sound, suggest what sound it makes. Create one simple multiple-choice quiz question about it. Finally, give a short, positive encouragement. Format the output as a JSON object.";
            
            const contentPart: Part = {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                },
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [ {text: prompt}, contentPart ] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            identification: { type: Type.STRING },
                            funFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                            soundSuggestion: { type: Type.STRING },
                            quiz: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswerIndex: { type: Type.INTEGER },
                                }
                            },
                            encouragement: { type: Type.STRING },
                        }
                    }
                }
            });

            const buddyResponse = JSON.parse(response.text) as LearningBuddyResponse;
            setLearningBuddyResponse(buddyResponse);
            setUserProgress(p => ({ ...p, objectsDiscovered: p.objectsDiscovered + 1 }));
            setScreen('result');
            speak(`Wow, it's a ${buddyResponse.identification}! Here are some fun facts.`);
        } catch (err) {
            console.error(err);
            setError("Oops! I had a little trouble understanding that. Let's try something else!");
            setScreen('media');
        }
    };

    const generateStandaloneQuiz = async (ageGroup: string) => {
        setScreen('loading');
        try {
            const prompt = `Generate a single, fun, multiple-choice quiz question suitable for a ${ageGroup} year old. The question should be about a general knowledge topic like animals, science, or geography. The difficulty should be appropriate for a child who is at quiz level ${userProgress.quizLevel}. Level 1 is very easy, and the difficulty should increase with the level. Ensure the options are clear and there's only one correct answer. Format the output as a JSON object with keys: "question", "options" (an array of 4 strings), and "correctAnswerIndex" (a number from 0-3).`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctAnswerIndex: { type: Type.INTEGER },
                        }
                    }
                }
            });

            const quizQuestion = JSON.parse(response.text) as QuizQuestion;
            // Create a temporary LearningBuddyResponse to reuse the result view logic
            setLearningBuddyResponse({
                identification: `Quiz Time! Level ${userProgress.quizLevel}`,
                funFacts: [],
                quiz: quizQuestion,
                encouragement: "Let's see what you know!"
            });
            setScreen('result');
            speak(quizQuestion.question);
        } catch (err) {
            console.error(err);
            setError("I couldn't come up with a quiz question right now. Let's try again!");
            setScreen('quiz');
        }
    };


    // --- Speech Synthesis & Recognition ---
    const speak = (text: string) => {
        if (!isTtsOn || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        let desiredVoice = null;

        if (ttsGender === 'female') {
            desiredVoice = voices.find(v => v.name.toLowerCase().includes('zephyr')) || 
                           voices.find(v => v.name.toLowerCase().includes('female')) ||
                           voices.find(v => !v.name.toLowerCase().includes('male'));
        } else {
            desiredVoice = voices.find(v => v.name.toLowerCase().includes('charon')) || 
                           voices.find(v => v.name.toLowerCase().includes('male'));
        }

        if (desiredVoice) utterance.voice = desiredVoice;
        
        utterance.onstart = () => setIsAgentSpeaking(true);
        utterance.onend = () => setIsAgentSpeaking(false);
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e.error);
            setIsAgentSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
    };
    
    const handleListenForChat = () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        const micButton = document.querySelector('.chat-mic-btn');
        recognition.onstart = () => micButton?.classList.add('listening');
        recognition.onend = () => micButton?.classList.remove('listening');
        
        recognition.onerror = (event) => {
            console.error("STT Error:", event.error);
            if (event.error === 'no-speech') {
                 setVoiceCommandError("I didn't hear anything. Try again!");
            } else if (event.error === 'network') {
                 setVoiceCommandError("I'm having trouble hearing you. Please check your internet connection.");
            }
            setTimeout(() => setVoiceCommandError(null), 3000);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            handleVoiceInput(transcript);
        };
        recognition.start();
    };


    // --- Chat Logic ---
     useEffect(() => {
        if (screen === 'chat' && !chat) {
            // FIX: The 'tools' property should be inside the 'config' object.
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    tools,
                    systemInstruction: "You are EduPlay, a fun, friendly, and curious learning buddy for kids. Keep your responses short, cheerful, and encouraging. Use simple language and lots of emojis."
                }
            });
            setChat(newChat);
            if (chatHistory.length === 0) {
                 const initialMessage = { sender: 'buddy' as const, text: "Hi there! I'm EduPlay! What do you want to talk about today?" };
                 setChatHistory([initialMessage]);
                 speak(initialMessage.text);
            }
        }
    }, [screen, chat]);
    
    const handleVoiceInput = async (userInput: string) => {
        if (!userInput || !chat) return;

        const userMessage: ChatMessage = { sender: 'user', text: userInput };
        setChatHistory(prev => [...prev, userMessage]);
        setIsBuddyTyping(true);

        const response = await chat.sendMessage({ message: userInput });
        
        // FIX: Correctly filter and map function calls from the response parts.
        // The 'Part' object from @google/genai has a 'functionCall' property, not a 'type' property.
        const functionCalls = response.candidates?.[0].content.parts
            .filter(part => !!part.functionCall)
            .map(part => part.functionCall!) ?? [];

        if (functionCalls.length > 0) {
            const call = functionCalls[0];
            let result;
            if (call.name === 'startQuiz') {
                handleNav('Quiz');
                result = { output: "Starting quiz." };
            } else if (call.name === 'getUserProgress') {
                result = { output: JSON.stringify(userProgress) };
            }
            
            // FIX: The 'sendMessage' method expects a 'message' property, not 'parts'.
            const functionResponse = await chat.sendMessage({
                message: [{ functionResponse: { name: call.name, response: result } }],
            });
            
            const buddyMessage: ChatMessage = { sender: 'buddy', text: functionResponse.text };
            setChatHistory(prev => [...prev, buddyMessage]);
            speak(functionResponse.text);
        } else {
             const buddyMessage: ChatMessage = { sender: 'buddy', text: response.text };
             setChatHistory(prev => [...prev, buddyMessage]);
             speak(response.text);
        }
        
        setIsBuddyTyping(false);
    };

    // --- LiveKit Simulation ---
    useEffect(() => {
        if (screen === 'chat') {
            connectToRoom();
        } else {
            disconnectFromRoom();
        }
        return () => disconnectFromRoom();
    }, [screen]);

    const getLiveKitToken = async (roomName: string, participantName: string): Promise<string> => {
        // In a real app, this would make a request to a server backend.
        // The server would use the API Key and Secret to generate a token.
        // For this demo, we'll return a placeholder and simulate connection.
        console.warn("Using placeholder LiveKit token. In production, this must be generated server-side.");
        return "placeholder_token";
    };
    
    const connectToRoom = async () => {
        try {
            if (isCameraEnabled && !localVideoTrackRef.current) {
                const track = await createLocalVideoTrack();
                if (localVideoEl.current) {
                    track.attach(localVideoEl.current);
                }
                localVideoTrackRef.current = track;
            }
            setIsConnected(true); // Simulate connection
            console.log("LiveKit simulation: Connected to room and set up local media.");
        } catch (error) {
            console.error("Failed to set up local media for LiveKit simulation", error);
        }
    };
    
    const disconnectFromRoom = () => {
        roomRef.current?.disconnect();
        localVideoTrackRef.current?.stop();
        localVideoTrackRef.current = null;
        setIsConnected(false);
    };
    
    useEffect(() => {
        const track = localVideoTrackRef.current;
        if (track) {
            if (isCameraEnabled) {
                track.unmute();
                if (localVideoEl.current) track.attach(localVideoEl.current);
            } else {
                track.mute();
            }
        } else if (isCameraEnabled && screen === 'chat') {
             // If track doesn't exist but camera is enabled, try to create it
             connectToRoom();
        }
    }, [isCameraEnabled, screen]);


    // --- UI Components ---
    const getHeaderTitle = () => {
        if (screen === 'loading' || screen === 'result') return "Thinking...";
        if (screen === 'quiz' && learningBuddyResponse) return "Quiz Time!";
        switch(activeTab) {
            case 'Home': return "Home";
            case 'Object Scan': return "Object Scan";
            case 'Chat': return "Chat";
            case 'Quiz': return "Quiz";
            case 'Rewards': return "My Rewards";
            default: return "EduPlay";
        }
    };

    if (error) {
        return <div className="error-message"><h2>Error</h2><p>{error}</p></div>;
    }

    const renderScreen = () => {
        switch (screen) {
            case 'welcome': return <WelcomeScreen onStart={handleStart} />;
            case 'home': return <HomeView userProgress={userProgress} onNavigate={(tab) => handleNav(tab)} />;
            case 'media': return <MediaView onFileChange={handleFileChange} fileInputRef={fileInputRef} videoRef={videoRef} />;
            case 'loading': return <LoadingView />;
            case 'result': return <ResultView response={learningBuddyResponse} media={media} onAnswer={handleAnswerQuiz} answered={quizAnswered} correct={lastAnswerCorrect} onNext={handleNext} />;
            case 'chat': return <PlaygroundChatView messages={chatHistory} onSend={handleVoiceInput} isBuddyTyping={isBuddyTyping} isAgentSpeaking={isAgentSpeaking} isConnected={isConnected} showChat={showChatPanel} setShowChat={setShowChatPanel} showVideo={showVideoPanel} setShowVideo={setShowVideoPanel} showAudio={showAudioPanel} setShowAudio={setShowAudioPanel} isCameraEnabled={isCameraEnabled} setIsCameraEnabled={setIsCameraEnabled} isMicEnabled={isMicEnabled} setIsMicEnabled={setIsMicEnabled} localVideoEl={localVideoEl} onListen={handleListenForChat} voiceError={voiceCommandError} />;
            case 'quiz': return <QuizGate onStartQuiz={generateStandaloneQuiz} />;
            case 'rewards': return <RewardsView progress={userProgress} />;
            default: return <WelcomeScreen onStart={handleStart} />;
        }
    };
    
    return (
      <div className={`app-layout screen-${screen}`}>
        {(screen !== 'welcome' && screen !== 'chat') && <Header title={getHeaderTitle()} isVoiceCommandOn={isVoiceCommandOn} setIsVoiceCommandOn={setIsVoiceCommandOn} isListening={isListening} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
        {screen === 'chat' && <Header title="Chat" isVoiceCommandOn={isVoiceCommandOn} setIsVoiceCommandOn={setIsVoiceCommandOn} isListening={isListening} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}

        <main>{renderScreen()}</main>
        
        {screen !== 'welcome' && <BottomNav activeTab={activeTab} onNav={handleNav} />}
      </div>
    );
};


const Header = ({ title, isVoiceCommandOn, setIsVoiceCommandOn, isListening, isDarkMode, setIsDarkMode }: { title: string, isVoiceCommandOn: boolean, setIsVoiceCommandOn: (on: boolean) => void, isListening: boolean, isDarkMode: boolean, setIsDarkMode: (on: boolean) => void }) => {
    return (
        <header className="app-header">
            <h2>{title}</h2>
            <div className="header-controls">
                <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} aria-label="Toggle dark mode">
                    {isDarkMode ? <SunIcon size={24} /> : <MoonIcon size={24} />}
                </button>
                <button className={`voice-command-toggle ${isListening ? 'listening' : ''}`} onClick={() => setIsVoiceCommandOn(!isVoiceCommandOn)} aria-label="Toggle Voice Commands">
                    {isVoiceCommandOn ? <MicIcon size={28} /> : <MicOffIcon size={28} />}
                </button>
            </div>
        </header>
    );
};

const BottomNav = ({ activeTab, onNav }: { activeTab: ActiveTab, onNav: (tab: ActiveTab) => void }) => {
    const navItems: ActiveTab[] = ['Home', 'Object Scan', 'Chat', 'Quiz', 'Rewards'];
    const icons: { [key in ActiveTab]: JSX.Element } = {
        'Home': <HomeIcon />,
        'Object Scan': <ObjectsIcon />,
        'Chat': <ChatIcon />,
        'Quiz': <QuizIcon />,
        'Rewards': <RewardsIcon />
    };

    return (
        <nav className="bottom-nav">
            {navItems.map(item => (
                <a key={item} className={`nav-item ${activeTab === item ? 'active' : ''}`} onClick={() => onNav(item)}>
                    {icons[item]}
                    <span>{item}</span>
                </a>
            ))}
        </nav>
    );
};

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => (
    <div className="welcome-screen">
        <img src="https://raw.githubusercontent.com/masumhasan/eduplay/refs/heads/main/images/edubot.gif" alt="EduPlay Mascot" className="robot-illustration" />
        <h1>EduPlay</h1>
        <p className="tagline">Your fun learning companion!</p>
        <button onClick={onStart} className="btn btn-start">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
            Start Learning!
        </button>
        <p className="subtitle">Let's explore and learn together! ✨</p>
    </div>
);

const HomeView = ({ userProgress, onNavigate }: { userProgress: UserProgress, onNavigate: (tab: ActiveTab) => void }) => (
    <div className="home-view">
        <div className="greeting">
            <h2>Hello there!</h2>
            <p>What would you like to do today?</p>
        </div>
        <div className="progress-summary-card">
            <div className="summary-item">
                <StarIcon filled />
                <div>
                    <h3>{userProgress.stars}</h3>
                    <p>Stars</p>
                </div>
            </div>
             <div className="summary-item">
                <QuizIcon />
                <div>
                    <h3>{userProgress.quizzesCompleted}</h3>
                    <p>Quizzes</p>
                </div>
            </div>
        </div>
        <div className="feature-nav">
            <div className="feature-card" onClick={() => onNavigate('Object Scan')}>
                <div className="feature-icon-wrapper scan"><ObjectsIcon /></div>
                <div>
                    <h3>Scan an Object</h3>
                    <p>Learn about things around you.</p>
                </div>
            </div>
            <div className="feature-card" onClick={() => onNavigate('Chat')}>
                <div className="feature-icon-wrapper chat"><ChatIcon /></div>
                <div>
                    <h3>Chat with Buddy</h3>
                    <p>Ask questions and have fun.</p>
                </div>
            </div>
            <div className="feature-card" onClick={() => onNavigate('Quiz')}>
                <div className="feature-icon-wrapper quiz"><QuizIcon /></div>
                <div>
                    <h3>Take a Quiz</h3>
                    <p>Test your knowledge.</p>
                </div>
            </div>
        </div>
    </div>
);

const MediaView = ({ onFileChange, fileInputRef, videoRef }: { onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, fileInputRef: React.RefObject<HTMLInputElement>, videoRef: React.RefObject<HTMLVideoElement> }) => {
    const [mediaType, setMediaType] = useState<MediaType>('image');
    
    useEffect(() => {
        if (mediaType === 'image' || mediaType === 'video') {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
                .catch(err => console.error("Camera error:", err));
        } else {
             if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
             }
        }
    }, [mediaType]);

    return (
        <div className="camera-view">
            <div className="media-type-selector">
                <button className={mediaType === 'image' ? 'active' : ''} onClick={() => setMediaType('image')}>Image</button>
                <button className={mediaType === 'video' ? 'active' : ''} onClick={() => setMediaType('video')}>Video</button>
                <button className={mediaType === 'audio' ? 'active' : ''} onClick={() => setMediaType('audio')}>Audio</button>
            </div>
            <div className="camera-container">
                {mediaType === 'image' || mediaType === 'video' ? (
                     <video ref={videoRef} autoPlay playsInline muted />
                ) : (
                    <div className="upload-placeholder">
                        <UploadIcon />
                        <h3>Upload an audio file</h3>
                        <p>MP3, WAV, etc.</p>
                    </div>
                )}
            </div>
            <div className="controls-container">
                <button className="btn" onClick={() => fileInputRef.current?.click()}>
                    Upload File
                </button>
                <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} accept={`${mediaType}/*`} />
            </div>
        </div>
    );
};

const LoadingView = () => (
    <div className="loading-overlay">
        <div className="loader-spinner"></div>
        <h2>Thinking...</h2>
        <p>Your learning buddy is preparing something amazing for you!</p>
    </div>
);

const ResultView = ({ response, media, onAnswer, answered, correct, onNext }: { response: LearningBuddyResponse | null, media: { type: MediaType, data: string }, onAnswer: (index: number) => void, answered: boolean, correct: boolean, onNext: () => void }) => {
    if (!response) return null;
    const { identification, funFacts, soundSuggestion, quiz, encouragement } = response;
    return (
        <div className="result-view">
            <div className="response-card">
                 {media.data && media.type === 'image' && <img src={`data:image/jpeg;base64,${media.data}`} alt={identification} className="result-image" />}
                 {media.data && media.type === 'video' && <video src={`data:video/mp4;base64,${media.data}`} controls className="result-image" />}
                 {media.data && media.type === 'audio' && <audio src={`data:audio/mp3;base64,${media.data}`} controls className="result-audio" />}
                
                <h2>{identification}</h2>

                {funFacts.length > 0 && (
                    <div className="section">
                        <div className="section-header"><h3>Fun Facts!</h3></div>
                        <ul>{funFacts.map((fact, i) => <li key={i}>{fact}</li>)}</ul>
                    </div>
                )}

                {soundSuggestion && <p className="sound-suggestion">Try making this sound: <strong>{soundSuggestion}</strong></p>}

                <div className="section">
                    <div className="section-header"><h3>Quick Quiz!</h3></div>
                    <p className="quiz-question">{quiz.question}</p>
                    <div className="quiz-options">
                        {quiz.options.map((option, i) => (
                            <button key={i} onClick={() => onAnswer(i)} disabled={answered} className={`quiz-option ${answered && i === quiz.correctAnswerIndex ? 'correct' : ''} ${answered && !correct && i !== quiz.correctAnswerIndex ? 'incorrect' : ''}`}>
                                {option}
                            </button>
                        ))}
                    </div>
                     {answered && (
                        <div className="quiz-feedback">
                           <h3>
                             {correct ? "You got it right!" : "Good try!"}
                             <img src={correct ? "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif" : "https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.gif"} alt={correct ? 'celebrating emoji' : 'hugging emoji'} width="40" height="40"/>
                           </h3>
                        </div>
                    )}
                </div>
                
                <button onClick={onNext} className="btn">Next Adventure!</button>
            </div>
        </div>
    );
};

const PlaygroundChatView = ({ messages, onSend, isBuddyTyping, isAgentSpeaking, isConnected, showChat, setShowChat, showVideo, setShowVideo, showAudio, setShowAudio, isCameraEnabled, setIsCameraEnabled, isMicEnabled, setIsMicEnabled, localVideoEl, onListen, voiceError }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isBuddyTyping]);
    
    const handleSend = () => {
        if(inputValue.trim()) {
            onSend(inputValue.trim());
            setInputValue("");
        }
    }

    return (
        <div className="playground-container">
            {showAudio && (
                 <div className="panel audio-panel">
                    
                    <div className={`audio-visualizer ${isAgentSpeaking ? 'speaking' : ''}`}>
                        {[...Array(5)].map((_, i) => <div key={i} className="bar"></div>)}
                    </div>
                </div>
            )}
           
            {showChat && (
                <div className="panel chat-panel">
                    <h3>Chat</h3>
                    <div className="chat-messages-container">
                        {messages.map((msg, i) => (
                            <div key={i} className={`playground-chat-bubble-wrapper ${msg.sender === 'buddy' ? 'buddy' : 'user'}`}>
                                <div className="sender-label">{msg.sender === 'buddy' ? 'AGENT' : 'YOU'}</div>
                                <div className="playground-chat-bubble">{msg.text}</div>
                            </div>
                        ))}
                         {isBuddyTyping && (
                            <div className="playground-chat-bubble-wrapper buddy">
                                <div className="sender-label">AGENT</div>
                                <div className="playground-chat-bubble">Typing...</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    {voiceError && <div className="error-message">{voiceError}</div>}
                    <div className="chat-input-area">
                        <input type="text" placeholder="Type a message..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
                        <button className="chat-mic-btn" onClick={onListen}><MicIcon size={20} /></button>
                        <button onClick={handleSend} disabled={!inputValue.trim()}>SEND</button>
                    </div>
                </div>
            )}
            
            <div className="panel sidebar-panel">
          
                <div className="sidebar-content">
                    
                    <div>
                        <h4>Status</h4>
                        <div className="status-grid">
                            <span>Room connected</span><span className="status-ok">{isConnected ? 'CONNECTED' : '...'}</span>
                            <span>Agent connected</span><span className="status-ok">TRUE</span>
                            <span>Agent status</span><span>{isAgentSpeaking ? 'SPEAKING' : 'IDLE'}</span>
                        </div>
                    </div>
                    
                    {showVideo && (
                        <div>
                            <h4>Camera</h4>
                            <div className="camera-preview">
                                {isCameraEnabled && <video ref={localVideoEl} muted playsInline />}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const QuizGate = ({ onStartQuiz }: { onStartQuiz: (ageGroup: string) => void }) => (
    <div className="quiz-gate-view">
        <div className="card">
            <h2>Ready for a Quiz?</h2>
            <p>Select your age group to start!</p>
            <div className="age-options">
                <button className="btn" onClick={() => onStartQuiz('4-5')}>4-5 years</button>
                <button className="btn btn-secondary" onClick={() => onStartQuiz('6-8')}>6-8 years</button>
            </div>
        </div>
    </div>
);

const RewardsView = ({ progress }: { progress: UserProgress }) => {
    const levelProgress = (progress.quizzesCompleted % 5) * 20; // 5 quizzes per level
    return (
        <div className="rewards-view">
            <div className="card main-progress-card">
                 <h2>Level {progress.quizLevel}</h2>
                 <p>Complete {5 - (progress.quizzesCompleted % 5)} more quizzes to level up!</p>
                 <div className="progress-bar-container">
                    <div className="progress-bar">
                        <div className="progress" style={{width: `${levelProgress}%`}}></div>
                    </div>
                 </div>
            </div>
            <div className="stats-grid">
                <div className="card stat-card">
                    <StarIcon filled />
                    <h3>{progress.stars}</h3>
                    <p>Total Stars</p>
                </div>
                 <div className="card stat-card">
                    <QuizIcon />
                    <h3>{progress.quizzesCompleted}</h3>
                    <p>Quizzes Done</p>
                </div>
                 <div className="card stat-card">
                    <ObjectsIcon />
                    <h3>{progress.objectsDiscovered}</h3>
                    <p>Objects Found</p>
                </div>
                 <div className="card stat-card">
                   <RewardsIcon />
                    <h3>{progress.learningStreak}</h3>
                    <p>Day Streak</p>
                </div>
            </div>
        </div>
    );
};


// --- Initialize App ---
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
