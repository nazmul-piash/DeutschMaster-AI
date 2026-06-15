
import React, { useState, useEffect } from 'react';
import { Lesson, QuizQuestion } from '../types';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import Assistant from './Assistant';

interface LessonModalProps {
  lesson: Lesson;
  onClose: () => void;
  onComplete: () => void;
}

const LessonModal: React.FC<LessonModalProps> = ({ lesson, onClose, onComplete }) => {
  const [step, setStep] = useState<'reading' | 'quiz' | 'result'>('reading');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [assistantMessage, setAssistantMessage] = useState('Hallo! Bereit?');
  const [assistantMood, setAssistantMood] = useState<'neutral' | 'happy' | 'thinking' | 'excited'>('neutral');

  const [isSpeakingLine, setIsSpeakingLine] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});

  const loadLesson = async () => {
    setAssistantMood('thinking');
    setLoading(true);
    try {
      const text = await geminiService.generateLessonContent(lesson.level, lesson.topic);
      const quizData = await geminiService.generateQuiz(lesson.level, lesson.topic, difficulty);
      setContent(text || '');
      setQuiz(quizData);
      setAssistantMessage(`Let's explore ${lesson.topic} together! I've prepared a ${difficulty} quiz for later.`);
      setAssistantMood('happy');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLesson();
  }, [lesson, difficulty]);

  useEffect(() => {
    return () => {
      geminiService.stopSpeaking();
    };
  }, []);

  const handleSpeakLine = async (line: string, index: number) => {
    if (isSpeakingLine === index) {
      geminiService.stopSpeaking();
      setIsSpeakingLine(null);
      return;
    }
    await geminiService.speakText(
      line,
      () => {
        setIsSpeakingLine(index);
      },
      () => {
        setIsSpeakingLine(null);
      }
    );
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quiz.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });
    setQuizScore(score);
    setStep('result');
    if (score === quiz.length) {
      setAssistantMessage("Incredible! You're a natural at this! ⭐");
      setAssistantMood('excited');
    } else {
      setAssistantMessage("Great job! Every mistake is a chance to learn something new. ✍️");
      setAssistantMood('happy');
    }
  };

  const Notepad = ({ text }: { text: string }) => {
    return (
      <div className="relative card p-4 sm:p-8 md:p-12 overflow-hidden bg-white/40 dark:bg-black/25 backdrop-blur-md border-black/5 dark:border-white/5">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4a4a32]/25 dark:bg-white/25"></div>
        
        <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">Use controls to play/stop 🔊</span>
        </div>

        <div className="relative z-10 font-sans text-base leading-relaxed text-slate-700 dark:text-slate-300">
           {text.split('\n').filter(l => l.trim()).map((line, lineIdx) => {
             const isHeading = line.startsWith('#');
             const cleanLine = line.replace(/[#*]/g, '').trim();
             
             if (!cleanLine) return null;

             return (
               <div 
                key={lineIdx} 
                className={`flex gap-4 items-start mb-4 p-3 rounded-2xl transition-all hover:bg-black/5 dark:hover:bg-white/5 relative group ${isHeading ? 'text-2xl font-black text-slate-900 dark:text-white mt-10' : ''}`}
               >
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     handleSpeakLine(cleanLine, lineIdx);
                   }}
                   type="button"
                   className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border font-sans text-xs transition-all cursor-pointer shadow-sm ${
                     isSpeakingLine === lineIdx
                       ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse scale-105'
                       : 'bg-white/60 dark:bg-black/40 border-black/10 dark:border-white/5 hover:border-[#4a4a32] dark:hover:border-white text-slate-400 hover:text-[#4a4a32] dark:hover:text-white hover:scale-105'
                   }`}
                   title={isSpeakingLine === lineIdx ? "Stop audio" : "Play audio line"}
                 >
                   {isSpeakingLine === lineIdx ? '⏹️' : '▶️'}
                 </button>
                 
                 <div className="flex-1 select-text font-semibold">
                   {cleanLine.split(' ').map((word, wordIdx) => {
                     const isNoun = /^[A-Z]/.test(word) && word.length > 3;
                     if (isNoun) {
                       return (
                         <span key={wordIdx} className="inline-block relative px-1 mx-0.5 group/word">
                           <span className="relative z-10 text-[#4a4a32] dark:text-[#f5f5f0] font-black">{word} </span>
                           <div className="absolute -bottom-0.5 left-0 w-full h-1 bg-[#4a4a32]/20 dark:bg-white/20 rounded-full group-hover/word:h-full transition-all"></div>
                         </span>
                       );
                     }
                     return <span key={wordIdx}>{word} </span>;
                   })}
                 </div>
               </div>
             );
           })}
        </div>
        <div className="absolute bottom-6 left-8 opacity-40 text-[#4a4a32] dark:text-white font-black text-[9px] uppercase tracking-widest italic">Level {lesson.level} • {lesson.topic}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f4f4f0]/80 dark:bg-[#0e0e0b]/80 backdrop-blur-2xl">
        <div className="text-center">
           <div className="w-24 h-24 mb-8 mx-auto"><Assistant message="..." mood="thinking" /></div>
           <h3 className="text-[10px] font-black text-[#4a4a32] dark:text-[#f5f5f0] uppercase tracking-[0.4em] animate-pulse">Preparing your workspace...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 md:p-8 overflow-y-auto">
      <div className="bg-white/45 dark:bg-[#0e0e0b]/60 backdrop-blur-3xl rounded-[32px] shadow-2xl w-full max-w-7xl max-h-full overflow-hidden relative flex flex-col md:flex-row border border-white/20 dark:border-white/5">
        
        <div className="hidden md:flex w-72 bg-[#4a4a32]/5 dark:bg-white/5 border-r border-[#e5e5e0]/20 dark:border-white/5 items-center justify-center p-8 shrink-0">
          <Assistant message={assistantMessage} mood={assistantMood} isTalking={isSpeakingLine !== null} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all z-50 text-sm font-black shadow-sm cursor-pointer animate-in duration-300"
          >
            ✕
          </button>

          <div className="max-w-4xl mx-auto">
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                 <div className="px-3 py-1 bg-[#4a4a32]/10 dark:bg-white/10 text-[#4a4a32] dark:text-white text-[10px] font-black rounded-lg uppercase tracking-wider border border-[#4a4a32]/5 dark:border-white/5">Level {lesson.level}</div>
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{lesson.title}</h2>
              </div>
              <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden flex">
                 <div className={`h-full transition-all duration-700 rounded-full ${step === 'reading' ? 'w-1/3 bg-[#4a4a32] dark:bg-[#f5f5f0]' : step === 'quiz' ? 'w-2/3 bg-[#4a4a32] dark:bg-[#f5f5f0]' : 'w-full bg-[#4a4a32] dark:bg-[#f5f5f0]'}`}></div>
              </div>
            </header>

            {step === 'reading' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <Notepad text={content} />
                
                <div className="mt-12 card p-8 border-black/5 dark:border-white/5 bg-[#4a4a32]/5 dark:bg-white/5">
                   <h4 className="text-xs font-black text-[#4a4a32] dark:text-white uppercase tracking-widest mb-6">Ready for the Quiz?</h4>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5 flex-1 w-full gap-1">
                      {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${difficulty === d ? 'bg-[#4a4a32] text-white dark:bg-[#f5f5f0] dark:text-[#1a1a15] shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-[#4a4a32] dark:hover:text-white'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        setStep('quiz');
                        setAssistantMessage(`Let's go! This ${difficulty} quiz will test your knowledge of ${lesson.topic}. 📝`);
                      }}
                      className="btn-primary flex-[2] w-full py-4 text-xs shadow-lg uppercase tracking-wider"
                    >
                      Start {difficulty} Quiz
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'quiz' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Final Quiz</h3>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    difficulty === 'Easy' ? 'bg-green-100 text-green-600' :
                    difficulty === 'Medium' ? 'bg-orange-100 text-orange-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {difficulty} Difficulty
                  </div>
                </div>
                {quiz.map((q, idx) => (
                  <div key={idx} className="card p-4 sm:p-6 md:p-8 border-slate-100 relative">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-lg font-bold text-slate-800 flex gap-4">
                        <span className="text-brand/30 italic">#{idx + 1}</span>
                        {q.question}
                      </p>
                      <button 
                        onClick={() => setShowTranslation({...showTranslation, [idx]: !showTranslation[idx]})}
                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                        title="Show English Translation"
                      >
                        🌐
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {showTranslation[idx] && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mb-6 overflow-hidden"
                        >
                          <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-brand/30 text-sm text-slate-500 italic">
                            {q.questionEn}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAnswers({...answers, [idx]: opt})}
                          className={`p-4 rounded-2xl border text-left text-sm font-medium transition-all ${
                            answers[idx] === opt 
                              ? 'bg-brand/10 border-brand text-brand shadow-md shadow-brand/10' 
                              : 'bg-white border-slate-100 text-slate-500 hover:border-brand/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button 
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(answers).length < quiz.length}
                  className="btn-primary w-full py-5 text-lg shadow-xl shadow-brand/20"
                >
                  Check My Answers
                </button>
              </div>
            )}

            {step === 'result' && (
              <div className="text-center py-16 animate-in zoom-in duration-500">
                <div className="text-7xl mb-10">{quizScore >= 4 ? '🏅' : '🎉'}</div>
                <h3 className="text-4xl font-bold text-slate-800 mb-4">{quizScore === quiz.length ? 'Perfect Score!' : 'Well Done!'}</h3>
                <p className="text-lg text-slate-500 mb-12">You scored <span className="text-brand font-bold text-2xl">{quizScore} / {quiz.length}</span> in {lesson.topic}</p>
                <div className="card p-8 max-w-2xl mx-auto mb-12 bg-brand/5 border-brand/10">
                   <p className="text-brand font-bold mb-4 uppercase text-xs tracking-widest">Learning Progress:</p>
                   <p className="text-slate-600 leading-relaxed italic">
                     "This lesson is now part of your journey. Every small step brings you closer to your goal of speaking German fluently!"
                   </p>
                </div>
                <button onClick={onComplete} className="btn-primary w-full max-w-md py-5 text-lg shadow-xl shadow-brand/20">Continue Your Journey</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonModal;
