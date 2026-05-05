/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete, RotateCcw, CheckCircle2, XCircle, Trophy, Star, Share2, Maximize2 } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Constants ---
const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// --- Types ---
interface Question {
  f1: number;
  f2: number;
}

interface ScheduledQuestion extends Question {
  reaskCount: number;
  scheduledAt: number;
}

// --- Components ---
const RetroSwitch = ({ num, isActive, onToggle }: { num: number; isActive: boolean; onToggle: () => void }) => (
  <div className="flex flex-col items-center gap-1 shrink-0">
    <span className={`text-[10px] sm:text-xs font-black transition-colors duration-300 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
      {num}
    </span>
    <button 
      onClick={onToggle}
      className={`w-8 h-12 sm:w-10 sm:h-14 rounded-lg p-1 flex flex-col transition-all duration-500 relative border-2 ${
        isActive 
          ? 'bg-green-500 border-green-600 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]' 
          : 'bg-gray-300 border-gray-400 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]'
      }`}
    >
      <motion.div 
        animate={{ y: isActive ? 0 : 18 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="w-full h-5 sm:h-6 bg-gradient-to-b from-gray-50 to-gray-200 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.3)] border border-gray-300 flex flex-col items-center justify-center gap-0.5"
      >
        <div className="w-3 sm:w-4 h-[1px] sm:h-[1.5px] bg-gray-400 rounded-full" />
        <div className="w-3 sm:w-4 h-[1px] sm:h-[1.5px] bg-gray-400 rounded-full" />
      </motion.div>

      <div className={`absolute bottom-1 sm:bottom-1.5 left-1/2 -translate-x-1/2 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
        isActive ? 'bg-green-300 shadow-[0_0_8px_#4ade80]' : 'bg-gray-500/30'
      }`} />
    </button>
  </div>
);

const DigitBox = ({ value, index, feedback }: { value: string; index: number; feedback: 'correct' | 'incorrect' | null }) => (
  <div className={`w-12 h-14 sm:w-20 sm:h-24 bg-white rounded-2xl shadow-xl border-2 sm:border-4 flex items-center justify-center text-2xl sm:text-5xl font-bold relative overflow-hidden transition-colors ${
    feedback === 'correct' ? 'border-green-400 text-green-600' : 
    feedback === 'incorrect' ? 'border-red-400 text-red-600' : 
    'border-blue-200 text-blue-600'
  }`}>
    {value ? (
      <motion.span
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        key={value + index}
      >
        {value}
      </motion.span>
    ) : (
      <div className="w-5 h-1 bg-blue-100 rounded-full mt-5 sm:mt-8" />
    )}
  </div>
);

export default function App() {
  // --- State ---
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({ f1: 0, f2: 0 });
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [scheduledQueue, setScheduledQueue] = useState<ScheduledQuestion[]>([]);
  const [lastPointsAdded, setLastPointsAdded] = useState<number | null>(null);

  // --- Logic ---
  const generateQuestion = useCallback(() => {
    if (selectedTables.length === 0) return;

    setTurnCount(prev => prev + 1);
    const nextTurn = turnCount + 1;

    // Check if there's a scheduled question for this turn
    const scheduledIdx = scheduledQueue.findIndex(q => q.scheduledAt <= nextTurn);
    
    if (scheduledIdx !== -1) {
      const scheduled = scheduledQueue[scheduledIdx];
      setCurrentQuestion({ f1: scheduled.f1, f2: scheduled.f2 });
      // Remove from queue
      setScheduledQueue(prev => prev.filter((_, i) => i !== scheduledIdx));
    } else {
      // Pick random from selected tables
      const f1 = selectedTables[Math.floor(Math.random() * selectedTables.length)];
      const f2 = Math.floor(Math.random() * 10) + 1;
      setCurrentQuestion({ f1, f2 });
    }

    setUserInput('');
    setFeedback(null);
    setLastPointsAdded(null);
  }, [selectedTables, scheduledQueue, turnCount]);

  // Initial question
  useEffect(() => {
    if (currentQuestion.f1 === 0) {
      generateQuestion();
    }
  }, [generateQuestion, currentQuestion.f1]);

  const toggleTable = (num: number) => {
    setSelectedTables(prev => {
      if (prev.includes(num)) {
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== num);
      }
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const handleNumberClick = (num: string) => {
    if (userInput.length < 2 && feedback === null) {
      setUserInput(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    if (feedback === null) {
      setUserInput(prev => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setScore(0);
    setStreak(0);
    setScheduledQueue([]);
    setTurnCount(0);
    generateQuestion();
  };

  const handleShare = async () => {
    // Logic to fix the 403 error for others:
    // We convert the 'ais-dev' (private/preview) URL to the 'ais-pre' (public/shared) URL.
    let shareUrl = window.location.origin;
    if (shareUrl.includes('ais-dev-')) {
      shareUrl = shareUrl.replace('ais-dev-', 'ais-pre-');
    }

    const shareText = `Ho fatto ${score} punti alle Tabelline Magiche! Prova anche tu!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tabelline Magiche',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(`Link magico copiato!\n\n${shareUrl}\n\nIncollalo su WhatsApp per mandarlo a chi vuoi! ✨`);
        setFeedback('correct');
        setTimeout(() => setFeedback(null), 2000);
      } catch (err) {
        console.error('Clipboard error:', err);
      }
    }
  };

  const toggleFullscreen = () => {
    const docEl = document.documentElement as any;
    if (!document.fullscreenElement) {
      try {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        }
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      } catch (err) {
        console.error('Exit fullscreen error:', err);
      }
    }
  };

  const checkAnswer = () => {
    if (userInput === '' || feedback !== null) return;
    
    const { f1, f2 } = currentQuestion;
    const correctAnswer = f1 * f2;
    const userVal = parseInt(userInput);

    if (userVal === correctAnswer) {
      setFeedback('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      let pointsToAdd = 1;
      // Confetti only on milestones (5, 10, 15, 20...)
      if (newStreak % 5 === 0) {
        pointsToAdd = newStreak >= 15 ? 3 : 2;
        confetti({ 
          particleCount: newStreak >= 15 ? 150 : 80, 
          spread: 70, 
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b']
        });
      }
      
      setScore(prev => prev + pointsToAdd);
      setLastPointsAdded(pointsToAdd);

      setTimeout(() => {
        generateQuestion();
      }, 800);
    } else {
      setFeedback('incorrect');
      setStreak(0);
      setScore(prev => Math.max(0, prev - 1));
      setLastPointsAdded(-1);
      
      // Schedule reinforcement
      const firstReask: ScheduledQuestion = {
        f1, f2, reaskCount: 1, scheduledAt: turnCount + 3 // 2 questions in between
      };
      const secondReask: ScheduledQuestion = {
        f1, f2, reaskCount: 2, scheduledAt: turnCount + 3 + 5 // 4 questions in between after the first reask
      };
      
      setScheduledQueue(prev => [...prev, firstReask, secondReask]);

      // Move to next question after a short red flash
      setTimeout(() => {
        generateQuestion();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-gradient-to-b from-blue-50 to-purple-50 flex flex-col items-center font-sans select-none overflow-hidden touch-none">
      
      {/* Header Section (Top) */}
      <header className="w-full max-w-md flex flex-col items-center px-4 pt-3 pb-1 shrink-0">
        <div className="w-full flex justify-between items-center gap-2 mb-2 sm:mb-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-md border border-blue-100 relative">
            <Trophy className="text-yellow-500 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-base sm:text-lg font-black text-gray-700">{score}</span>
            
            <AnimatePresence>
              {lastPointsAdded !== null && (
                <motion.span
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -25, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute right-0 font-black text-xs sm:text-sm ${lastPointsAdded > 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {lastPointsAdded > 0 ? `+${lastPointsAdded}` : lastPointsAdded}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-md border border-blue-100">
            <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}`} />
            <span className="text-base sm:text-lg font-black text-gray-700">{streak}</span>
            {streak >= 5 && (
              <span className="text-[9px] sm:text-[10px] font-black text-orange-500 ml-1 animate-pulse">
                {streak >= 15 ? 'MAX!' : 'COMBO!'}
              </span>
            )}
          </div>

          <div className="flex gap-1.5">
            <button 
              onClick={handleReset}
              className="p-2 sm:p-2.5 bg-white rounded-xl sm:rounded-2xl shadow-md border border-blue-100 active:scale-90 transition-transform"
              title="Reset"
            >
              <RotateCcw className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button 
              onClick={toggleFullscreen}
              className="p-2 sm:p-2.5 bg-white rounded-xl sm:rounded-2xl shadow-md border border-blue-100 active:scale-90 transition-transform"
              title="Schermo Intero"
            >
              <Maximize2 className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button 
              onClick={handleShare}
              className="p-2 sm:p-2.5 bg-white rounded-xl sm:rounded-2xl shadow-md border border-blue-100 active:scale-90 transition-transform"
              title="Condividi"
            >
              <Share2 className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (Middle) */}
      <main className="flex-1 w-full max-w-md flex flex-col items-center justify-center min-h-0 px-4 py-1 gap-2">
        {/* Question Area */}
        <div className="flex flex-col items-center gap-1 mb-1 sm:mb-2 shrink-0">
          <div className="text-5xl sm:text-7xl font-black text-blue-900 tracking-tight leading-none">
            {currentQuestion.f1} <span className="text-blue-400">×</span> {currentQuestion.f2}
          </div>
          
          <div className="flex gap-3">
            <DigitBox 
              value={userInput.length === 2 ? userInput[0] : ''} 
              index={0} 
              feedback={feedback}
            />
            <DigitBox 
              value={userInput.length === 1 ? userInput[0] : (userInput.length === 2 ? userInput[1] : '')} 
              index={1} 
              feedback={feedback}
            />
          </div>

          <div className="h-5 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {feedback === 'correct' && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="flex items-center gap-2 text-green-500 font-black text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Bravissimo!
                </motion.div>
              )}
              {feedback === 'incorrect' && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="flex items-center gap-2 text-red-500 font-black text-xs"
                >
                  <XCircle className="w-4 h-4" /> Peccato! -1
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Number Pad Area */}
        <div className="w-full max-w-sm flex-1 flex flex-col justify-center min-h-0 max-h-[420px]">
          <div className="grid grid-cols-3 gap-2 p-2 bg-gray-200/40 rounded-[2rem] border border-white/60 shadow-inner">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-14 sm:h-18 bg-white rounded-xl shadow-[0_4px_0_#e5e7eb] text-3xl font-black text-gray-700 active:shadow-none active:translate-y-1 transition-all flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              className="h-14 sm:h-18 bg-orange-100 rounded-xl shadow-[0_4px_0_#fed7aa] flex items-center justify-center text-orange-600 active:shadow-none active:translate-y-1 transition-all"
            >
              <Delete className="w-7 h-7" />
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="h-14 sm:h-18 bg-white rounded-xl shadow-[0_4px_0_#e5e7eb] text-3xl font-black text-gray-700 active:shadow-none active:translate-y-1 transition-all flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={checkAnswer}
              disabled={userInput === '' || feedback !== null}
              className={`h-14 sm:h-18 rounded-xl flex items-center justify-center font-black text-lg transition-all ${
                userInput === '' || feedback !== null
                  ? 'bg-gray-100 text-gray-400 shadow-none'
                  : 'bg-green-500 text-white shadow-[0_4px_0_#16a34a] active:shadow-none active:translate-y-1'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </main>

      {/* Footer Section (Bottom) */}
      <footer className="w-full max-w-md bg-[#e5e7eb] p-2 pb-4 sm:p-3 sm:pb-6 rounded-t-[2rem] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] border-t-4 border-gray-300 relative shrink-0">
        <div className="absolute top-2 left-6 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner" />
        <div className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner" />
        
        <p className="text-center text-[7px] sm:text-[8px] font-black text-gray-500 uppercase tracking-[0.4em] mb-2 sm:mb-3">Controllo Tabelline</p>
        <div className="flex justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar px-2 sm:px-4">
          {TABLES.map(num => (
            <React.Fragment key={num}>
              <RetroSwitch 
                num={num} 
                isActive={selectedTables.includes(num)} 
                onToggle={() => toggleTable(num)} 
              />
            </React.Fragment>
          ))}
        </div>
      </footer>

    </div>
  );
}
