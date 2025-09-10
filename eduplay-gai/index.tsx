import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, Chat } from '@google/genai';

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

type Screen = 'welcome' | 'camera' | 'loading' | 'result' | 'chat' | 'quiz' | 'rewards';
type ActiveTab = 'Home' | 'Objects' | 'Chat' | 'Quiz' | 'Rewards';

// --- SVG Icons ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const ObjectsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const QuizIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path fill="currentColor" d="M15.07,13.45C14.71,14.2,14,15,12,15a3,3,0,0,1-3-3c0-2,3-3,3-3A3,3,0,0,1,14.2,9.92"></path><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"></path><rect x="11" y="17" width="2" height="2"></rect></svg>;
const RewardsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V-2"></path><path d="M12 22v-6"></path><path d="M20 12h-6"></path><path d="M4 12H2"></path><path d="m18.36 5.64-.86.86"></path><path d="m7.36 16.64-.86.86"></path><path d="M18.36 18.36-.86-.86"></path><path d="m7.36 7.36-.86-.86"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
// FIX: Update StarIcon to accept props, allowing className to be passed for dynamic styling.
const StarIcon = (props: React.HTMLAttributes<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" {...props}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>;
const StreakIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 0 0-5.3"></path><path d="M12.1 12.1a2.5 2.5 0 1 0 0-5.3"></path><path d="M6.5 16.5a2.5 2.5 0 1 0 0-5.3"></path><path d="M16 12.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0v-1z"></path><path d="m15.5 13-1.4-1.4"></path><path d="M10.5 7.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0v-1z"></path><path d="m10 8-1.4-1.4"></path></svg>;

// --- Main App Component ---
const App = () => {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [activeTab, setActiveTab] = useState<ActiveTab>('Objects');
  const [error, setError] = useState<string | null>(null);
  
  // Object detection state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [response, setResponse] = useState<LearningBuddyResponse | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);

  // Chat state
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([{ sender: 'buddy', text: "Hi there! I'm your Learning Buddy! Tell me what you'd like to learn about today! 😄" }]);
  const [isListening, setIsListening] = useState(false);

  // Quiz page state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState<number | null>(null);
  const [quizAnswerStatus, setQuizAnswerStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [quizState, setQuizState] = useState<'gate' | 'loading' | 'playing' | 'finished'>('gate');
  const [userAgeRange, setUserAgeRange] = useState<string | null>(null);


  // User Progress state
  const [progress, setProgress] = useState<UserProgress>({ stars: 0, quizzesCompleted: 0, objectsDiscovered: 0, learningStreak: 7, quizLevel: 1 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
  // --- Local Storage for Progress ---
  useEffect(() => {
    const savedProgress = localStorage.getItem('learningBuddyProgress');
    if (savedProgress) {
      const loadedProgress = JSON.parse(savedProgress);
      // Merge with default state to ensure all keys exist, like quizLevel.
      // This makes the loading more robust against older data formats.
      setProgress(prev => ({ ...prev, ...loadedProgress }));
    }
  }, []);

  const updateProgress = (newProgress: Partial<UserProgress>) => {
    setProgress(prev => {
        const updated = {...prev, ...newProgress};
        localStorage.setItem('learningBuddyProgress', JSON.stringify(updated));
        return updated;
    });
  };

  // --- Camera & Image Handling ---
  const startCamera = async () => { /* ... (no changes) ... */ };
  const stopCamera = () => { /* ... (no changes) ... */ };
  
  useEffect(() => {
    if (screen === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [screen]);

  const takePhoto = () => { /* ... (no changes) ... */ };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... (no changes) ... */ };
  
  // --- Gemini API Calls ---
  const getLearningBuddyResponse = async (imageBase64: string) => {
    setScreen('loading');
    setError(null);
    setResponse(null);
    const base64Data = imageBase64.split(',')[1];
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are "Learning Buddy", a friendly AI tutor for children aged 4-10. You always speak in simple, cheerful, and encouraging language. Your goal is to be fun, safe, and educational. When given an image, identify the main object, provide 1-3 simple fun facts, optionally suggest a sound for animals/vehicles/instruments, and create a simple multiple-choice quiz question with 2-3 options. Always end with an encouraging message. Avoid scary or negative responses.`;
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{text: "Analyze this image as Learning Buddy."}, { inlineData: { mimeType: 'image/jpeg', data: base64Data } }] },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              identification: { type: Type.STRING, description: "A cheerful identification of the object, e.g., 'Wow, that's a bright red apple! 🍎'" },
              funFacts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 1 to 3 simple, kid-friendly fun facts." },
              soundSuggestion: { type: Type.STRING, description: "Optional: 'Want to hear a lion roar? 🦁 ROAR!' for animals, vehicles, instruments." },
              quiz: {
                type: Type.OBJECT,
                required: ['question', 'options', 'correctAnswerIndex'],
                properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswerIndex: { type: Type.INTEGER } }
              },
              encouragement: { type: Type.STRING, description: "A final, positive message, e.g., 'You're a super learner! ⭐'" },
            },
            required: ['identification', 'funFacts', 'quiz', 'encouragement'],
          },
        },
      });
      const parsedResponse: LearningBuddyResponse = JSON.parse(result.text);
      setResponse(parsedResponse);
      updateProgress({ objectsDiscovered: progress.objectsDiscovered + 1 });
      setScreen('result');
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      setError("Oh no! My thinking cap isn't working right now. Let's try again in a little bit!");
      setScreen('camera');
    }
  };

  // --- Chat ---
  useEffect(() => {
    if (screen === 'chat' && !chat) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chatSession = ai.chats.create({ 
            model: 'gemini-2.5-flash',
            config: { systemInstruction: "You are Learning Buddy, a cheerful and encouraging AI friend for kids aged 4-10. Keep your answers short, simple, and fun. Use lots of emojis! You are curious and love to learn new things with the user." }
        });
        setChat(chatSession);
    }
  }, [screen, chat]);

  useEffect(() => {
    if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleVoiceInput = () => {
    const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'network') {
            setMessages(prev => [...prev, { sender: 'buddy', text: "I'm having a little trouble hearing you right now. Could you please check your internet connection and try again? 📡" }]);
        } else {
            setMessages(prev => [...prev, { sender: 'buddy', text: "Oops! My ears got tangled. Please try talking to me again! 🎤" }]);
        }
    };
    recognition.onresult = async (event: any) => {
        const userMessage = event.results[0][0].transcript;
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        
        if (chat) {
            try {
                const response = await chat.sendMessage({ message: userMessage });
                const buddyMessage = response.text;
                setMessages(prev => [...prev, { sender: 'buddy', text: buddyMessage }]);
                const utterance = new SpeechSynthesisUtterance(buddyMessage);
                speechSynthesis.speak(utterance);
            } catch (error) {
                console.error("Gemini chat error:", error);
                setMessages(prev => [...prev, { sender: 'buddy', text: "Oops, I got a little tongue-tied. Can you ask me again?" }]);
            }
        }
    };

    recognition.start();
  };

  // --- Quiz ---
  const generateQuiz = async (age: string, level: number) => {
    setQuizState('loading');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const difficulty = level < 3 ? 'easy' : level < 6 ? 'medium' : 'hard';
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a fun 3-question multiple-choice quiz for a ${age} year old child. The topic should be general knowledge for kids (animals, colors, shapes, space, etc.). The difficulty should be ${difficulty} (level ${level}). Provide 4 options for each question. Include a relevant emoji at the start of each option string.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        quiz: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswerIndex: { type: Type.INTEGER }
                                },
                                required: ['question', 'options', 'correctAnswerIndex']
                            }
                        }
                    },
                    required: ['quiz']
                }
            }
        });
        const parsed = JSON.parse(result.text);
        setQuizQuestions(parsed.quiz);
        setQuizState('playing');
    } catch (err) {
        console.error("Quiz generation error:", err);
        // Fallback quiz
        setQuizQuestions([
          { question: "Which animal says 'Moo'?", options: ["🐶 Dog", "🐮 Cow", "🐱 Cat", "🐦 Bird"], correctAnswerIndex: 1 }
        ]);
        setQuizState('playing');
    }
  };

  const handleAgeSelect = (age: string) => {
    setUserAgeRange(age);
    generateQuiz(age, progress.quizLevel);
  };
  
  const handleQuizPageAnswer = (selectedIndex: number) => {
      if (quizAnswerStatus) return;
      setQuizSelectedAnswer(selectedIndex);
      if (selectedIndex === quizQuestions[currentQuestionIndex].correctAnswerIndex) {
          setQuizAnswerStatus('correct');
          setQuizScore(s => s + 1);
          updateProgress({ stars: progress.stars + 1 });
      } else {
          setQuizAnswerStatus('incorrect');
      }
  };

  const handleNextQuestion = () => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
          setCurrentQuestionIndex(i => i + 1);
          setQuizSelectedAnswer(null);
          setQuizAnswerStatus(null);
      } else {
          setQuizState('finished');
          const passed = quizScore === quizQuestions.length;
          const newProgress: Partial<UserProgress> = { quizzesCompleted: progress.quizzesCompleted + 1 };
          if (passed) {
            newProgress.quizLevel = progress.quizLevel + 1;
          }
          updateProgress(newProgress);
      }
  };
  
  const startNewQuizRound = (nextLevel: boolean) => {
    if (!userAgeRange) return; // Should not happen

    // Reset game state
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizSelectedAnswer(null);
    setQuizAnswerStatus(null);
    setQuizQuestions([]);

    // Generate next quiz
    const level = nextLevel ? progress.quizLevel : progress.quizLevel;
    generateQuiz(userAgeRange, level);
  }
  
  // --- UI Event Handlers ---
  const handleQuizAnswer = (selectedIndex: number) => {
    if (!response || quizResult) return;
    setSelectedAnswer(selectedIndex);
    if (selectedIndex === response.quiz.correctAnswerIndex) {
      setQuizResult('correct');
      updateProgress({ stars: progress.stars + 1 });
    } else {
      setQuizResult('incorrect');
    }
  };
  
  const handleStartOver = (goToWelcome = false) => {
    setCapturedImage(null);
    setResponse(null);
    setQuizResult(null);
    setSelectedAnswer(null);
    setError(null);
    setScreen(goToWelcome ? 'welcome' : 'camera');
    setActiveTab(goToWelcome ? 'Home' : 'Objects');
  };
  
  const handleNav = (tab: ActiveTab) => {
    setActiveTab(tab);
    switch (tab) {
        case 'Home': setScreen('welcome'); break;
        case 'Objects': setScreen('camera'); break;
        case 'Chat': setScreen('chat'); break;
        case 'Quiz': 
            setQuizState('gate');
            setScreen('quiz');
            break;
        case 'Rewards': setScreen('rewards'); break;
    }
  };
  
  // --- Dynamic Background Effect ---
  useEffect(() => {
    document.body.className = ''; // Clear classes
    if (screen === 'quiz' && quizState === 'finished') {
        document.body.classList.add('quiz-results-bg');
    } else {
        switch(screen) {
          case 'welcome': document.body.classList.add('welcome-bg'); break;
          case 'camera':
          case 'loading': document.body.classList.add('camera-bg'); break;
          case 'result': document.body.classList.add('result-bg'); break;
          case 'chat': document.body.classList.add('chat-bg'); break;
          case 'quiz': document.body.classList.add('quiz-bg'); break;
          case 'rewards': document.body.classList.add('rewards-bg'); break;
        }
    }
  }, [screen, quizState]);

  // --- Screen & Component Rendering ---
  const renderContent = () => {
    switch(screen) {
        case 'camera':
          return (
              <div className="camera-view">
                  <div className="camera-container">
                    {cameraAvailable ? (
                      <video ref={videoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }}></video>
                    ) : (
                      <div className="upload-placeholder">
                        <ObjectsIcon/>
                        <p>Point at an object or upload a picture!</p>
                      </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                  </div>
                  {error && <p className="error-message">{error}</p>}
                   <div className="controls-container">
                      <button className="btn" onClick={cameraAvailable ? takePhoto : ()=> document.getElementById('image-upload')?.click()}>Scan Object</button>
                      <input type="file" id="image-upload" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </div>
              </div>
          );
        case 'loading':
            return (
              <div className="loading-overlay">
                <div className="loader">
                  <div className="loader-spinner"></div>
                  <p>Thinking about what this could be... 🤔</p>
                </div>
              </div>
            );
        case 'result':
          return response && capturedImage && (
            <div className="result-view">
              <div className="response-card">
                <h2>{response.identification}</h2>
                <img src={capturedImage} alt="Captured item" className="result-image"/>
                <div className="section"><h3>Fun Facts!</h3><ul>{response.funFacts.map((fact, index) => <li key={index}>{fact}</li>)}</ul></div>
                {response.soundSuggestion && <p className="sound-suggestion">{response.soundSuggestion}</p>}
                <div className="section">
                    <h3>Quiz Time!</h3><p className="quiz-question">{response.quiz.question}</p>
                    <div className="quiz-options">
                    {response.quiz.options.map((option, index) => (
                        <button key={index} className={`quiz-option ${selectedAnswer !== null && (index === response.quiz.correctAnswerIndex ? 'correct' : (index === selectedAnswer ? 'incorrect' : ''))}`} onClick={() => handleQuizAnswer(index)} disabled={!!quizResult}>{option}</button>
                    ))}
                    </div>
                </div>
                {quizResult && (<div className="section quiz-feedback"><h3>{quizResult === 'correct' ? 'Awesome! You got it right!' : 'Good try!'}</h3><p>{response.encouragement}</p></div>)}
                <button className="btn btn-secondary" onClick={() => handleStartOver()}>Scan another object!</button>
              </div>
            </div>
          );
        case 'chat':
            return (
                <div className="chat-view" ref={chatMessagesRef}>
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-bubble ${msg.sender}`}>
                                {msg.sender === 'buddy' && <span className="avatar">🤖</span>}
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <div className="chat-input-area">
                        <button onClick={handleVoiceInput} className={`mic-button ${isListening ? 'listening' : ''}`} aria-label="Start talking">
                            <ChatIcon/>
                        </button>
                        <p>Tap to start talking</p>
                    </div>
                </div>
            );
        case 'quiz':
            if (quizState === 'gate') {
                return (
                    <div className="quiz-gate-view">
                        <div className="card">
                            <img src="https://raw.githubusercontent.com/masumhasan/eduplay/refs/heads/main/images/chatbot.gif" alt="Thinking face emoji" className="results-icon" />
                            <h2>Let's Play a Quiz!</h2>
                            <p>To make it super fun, first tell me how old you are!</p>
                            <div className="age-options">
                                <button className="btn" onClick={() => handleAgeSelect('4-5')}>4-5</button>
                                <button className="btn" onClick={() => handleAgeSelect('6-7')}>6-7</button>
                                <button className="btn" onClick={() => handleAgeSelect('8-10')}>8-10</button>
                            </div>
                        </div>
                    </div>
                );
            }
            if (quizState === 'loading') {
                return <div className="loading-overlay"><div className="loader-spinner"></div><p>Creating a fun quiz for you...</p></div>;
            }
            if (quizState === 'finished') {
                const passed = quizScore === quizQuestions.length;
                return (
                    <div className="quiz-results-view">
                        <div className="card">
                            <img src={passed ? "https://googlefonts.github.io/noto-emoji-animation/assets/svg/emoji_u1f3c6.svg" : "https://googlefonts.github.io/noto-emoji-animation/assets/svg/emoji_u1f60a.svg"} alt="Trophy or smiling face emoji" className="results-icon"/>
                            <h2>{passed ? "Great Job!" : "Good Try!"}</h2>
                            <p>You got {quizScore} out of {quizQuestions.length} questions right!</p>
                            <div className="stars-container">
                                {[...Array(quizQuestions.length)].map((_, i) => <StarIcon key={i} className={i < quizScore ? 'gold' : ''}/>)}
                            </div>
                            <button className="btn" onClick={() => startNewQuizRound(passed)}>
                                {passed ? 'Next Level!' : 'Try Again'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => handleNav('Objects')}>Back To Menu</button>
                        </div>
                    </div>
                );
            }
            const currentQuestion = quizQuestions[currentQuestionIndex];
            return currentQuestion && (
                <div className="quiz-view">
                    <div className="quiz-header">
                        <span>Level {progress.quizLevel}</span>
                        <span>{currentQuestionIndex + 1} of {quizQuestions.length}</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress" style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}></div>
                    </div>
                    <div className="quiz-card">
                        <h2 className="quiz-question-text">{currentQuestion.question}</h2>
                        <div className="quiz-options-grid">
                            {currentQuestion.options.map((option, index) => {
                                let buttonClass = 'quiz-option-btn';
                                if (quizAnswerStatus && index === quizSelectedAnswer) {
                                    buttonClass += quizAnswerStatus === 'correct' ? ' correct' : ' incorrect';
                                } else if (quizAnswerStatus && index === currentQuestion.correctAnswerIndex) {
                                    buttonClass += ' correct';
                                }
                                return (<button key={index} className={buttonClass} onClick={() => handleQuizPageAnswer(index)} disabled={!!quizAnswerStatus}>{option}</button>);
                            })}
                        </div>
                         {quizAnswerStatus && (
                            <div className="quiz-page-feedback">
                                <p>{quizAnswerStatus === 'correct' ? "Awesome! You got it right!" : "Good try!"}</p>
                                <button className="btn" onClick={handleNextQuestion}>
                                    {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        case 'rewards':
            return (
                <div className="rewards-view">
                    <div className="card main-progress-card">
                        <img src="https://raw.githubusercontent.com/masumhasan/eduplay/refs/heads/main/images/rewards.gif" alt="Animated rewards celebration" className="results-icon" />
                        <h2>Great Progress!</h2>
                        <p>You're doing amazing! Keep learning!</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar">
                                <div className="progress" style={{width: '57%'}}></div>
                            </div>
                            <span>57% Complete</span>
                        </div>
                    </div>
                    <div className="stats-grid">
                        <div className="card stat-card">
                           <StarIcon/> <h3>{progress.stars}</h3> <p>Total Stars</p>
                        </div>
                        <div className="card stat-card">
                           <TrophyIcon/> <h3>{progress.quizzesCompleted}</h3> <p>Quizzes Completed</p>
                        </div>
                        <div className="card stat-card">
                           <ObjectsIcon/> <h3>{progress.objectsDiscovered}</h3> <p>Objects Discovered</p>
                        </div>
                        <div className="card stat-card">
                           <StreakIcon/> <h3>{progress.learningStreak}</h3> <p>Learning Streak</p>
                        </div>
                    </div>
                    <h2 className="badges-title">My Badges (2/6)</h2>
                    <div className="badges-grid">
                         <div className="badge earned"><img src="https://googlefonts.github.io/noto-emoji-animation/assets/svg/emoji_u1f9d1_u200d_u1f393.svg" alt="Student emoji badge"/><span>First Steps</span></div>
                         <div className="badge earned"><img src="https://googlefonts.github.io/noto-emoji-animation/assets/svg/emoji_u1f50d.svg" alt="Magnifying glass emoji badge"/><span>Object Finder</span></div>
                         <div className="badge locked"><span>?</span><span>Quiz Whiz</span></div>
                    </div>
                </div>
            )
        default: return null;
    }
  };

  if (screen === 'welcome') {
    return (
        <div className="welcome-screen">
          <div className="star"></div><div className="star"></div><div className="star"></div><div className="star"></div>
          <img src="https://raw.githubusercontent.com/masumhasan/eduplay/refs/heads/main/images/edubot.gif" alt="Waving robot emoji" className="robot-illustration" />
          <h1>Learning Buddy</h1>
          <p className="tagline">Your fun learning companion!</p>
          <button className="btn" onClick={() => handleNav('Objects')}>Start Learning!</button>
          <p className="subtitle">Let's explore and learn together! ✨</p>
        </div>
    );
  }

  const getHeaderTitle = () => {
    if (screen === 'camera') return 'Object Detective';
    if (screen === 'result') return 'Fun Facts';
    if (screen === 'chat') return 'Voice Chat';
    if (screen === 'quiz') return 'Fun Quiz';
    if (screen === 'rewards') return 'My Rewards';
    return '';
  }

  return (
    <div className="app-layout">
        <header className="app-header">
            {screen !== 'camera' && <button onClick={() => handleNav('Objects')} className="back-button"><BackIcon/></button>}
            <h2>{getHeaderTitle()}</h2>
        </header>
        <main>
            {renderContent()}
        </main>
        <nav className="bottom-nav">
          <div className={`nav-item ${activeTab === 'Home' ? 'active' : ''}`} onClick={() => handleNav('Home')}><HomeIcon/><span>Home</span></div>
          <div className={`nav-item ${activeTab === 'Objects' ? 'active' : ''}`} onClick={() => handleNav('Objects')}><div className="nav-icon-wrapper"><ObjectsIcon/></div><span>Objects</span></div>
          <div className={`nav-item ${activeTab === 'Chat' ? 'active' : ''}`} onClick={() => handleNav('Chat')}><div className="nav-icon-wrapper"><ChatIcon/></div><span>Chat</span></div>
          <div className={`nav-item ${activeTab === 'Quiz' ? 'active' : ''}`} onClick={() => handleNav('Quiz')}><div className="nav-icon-wrapper"><QuizIcon/></div><span>Quiz</span></div>
          <div className={`nav-item ${activeTab === 'Rewards' ? 'active' : ''}`} onClick={() => handleNav('Rewards')}><div className="nav-icon-wrapper"><RewardsIcon/></div><span>Rewards</span></div>
        </nav>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);