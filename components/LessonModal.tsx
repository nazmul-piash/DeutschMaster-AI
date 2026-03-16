
import React, { useState, useEffect } from 'react';
import { Lesson, QuizQuestion } from '../types';
import { geminiService } from '../services/geminiService';
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [assistantMessage, setAssistantMessage] = useState('Hallo! Bereit?');
  const [assistantMood, setAssistantMood] = useState<'neutral' | 'happy' | 'thinking' | 'excited'>('neutral');

  useEffect(() => {
    const loadLesson = async () => {
      setAssistantMood('thinking');
      try {
        const text = await geminiService.generateLessonContent(lesson.level, lesson.topic);
        const quizData = await geminiService.generateQuiz(lesson.level, lesson.topic);
        setContent(text || '');
        setQuiz(quizData);
        setAssistantMessage(`This is an academic deep-dive into ${lesson.topic}. Let's master it!`);
        setAssistantMood('happy');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLesson();
  }, [lesson]);

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    setAssistantMessage("Listening is key to passing the exam! 🎧");
    // We send a cleaned version of the text to TTS
    const cleanText = content.replace(/[#*]/g, '');
    await geminiService.speakText(cleanText);
    setIsSpeaking(false);
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quiz.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });
    setQuizScore(score);
    setStep('result');
    if (score === quiz.length) {
      setAssistantMessage("Excellent! You've met the academic requirements for this module! ⭐");
      setAssistantMood('excited');
    } else {
      setAssistantMessage("Good effort. Let's review the mistakes for academic precision. ✍️");
      setAssistantMood('happy');
    }
  };

  const Notepad = ({ text }: { text: string }) => {
    return (
      <div className="relative tech-card p-8 md:p-12 overflow-hidden">
        <button 
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="absolute top-4 right-4 btn-outline py-1 px-4 text-[9px] z-20 flex items-center gap-2"
        >
          {isSpeaking ? '🔊 REPRODUCING...' : '🔊 REPRODUCE_AUDIO'}
        </button>

        <div className="relative z-10 font-mono text-[11px] leading-relaxed text-slate-300 uppercase">
           {text.split('\n').map((line, lineIdx) => (
             <p key={lineIdx} className="mb-4">
                {line.split(' ').map((word, wordIdx) => {
                  const isNoun = /^[A-Z]/.test(word) && word.length > 3;
                  if (isNoun) {
                    return (
                      <span key={wordIdx} className="inline-block relative px-1 mx-0.5 group">
                        <span className="relative z-10 text-neon font-bold">{word} </span>
                        <div className="absolute -bottom-0.5 left-0 w-full h-px bg-neon/30"></div>
                      </span>
                    );
                  }
                  return <span key={wordIdx}>{word} </span>;
                })}
             </p>
           ))}
        </div>
        <div className="absolute bottom-4 left-4 opacity-20 text-neon font-mono text-[8px] uppercase tracking-[0.3em]">Protocol_CEFR_{lesson.level}_Verified</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/90 backdrop-blur-md">
        <div className="text-center">
           <div className="w-16 h-16 mb-8 mx-auto grayscale opacity-50"><Assistant message="..." mood="thinking" /></div>
           <h3 className="text-[10px] font-mono text-neon uppercase tracking-[0.4em] animate-pulse">Synchronizing_Academic_Data...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm p-4 md:p-12 overflow-y-auto">
      <div className="bg-dark border border-border w-full max-w-7xl max-h-full overflow-hidden relative flex flex-col md:flex-row">
        
        <div className="hidden md:flex w-64 bg-surface border-r border-border items-center justify-center p-6 shrink-0">
           <div className="grayscale opacity-70">
            <Assistant message={assistantMessage} mood={assistantMood} />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 relative">
          <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center border border-border text-slate-500 hover:text-white hover:border-neon transition-all z-50 text-xs font-mono">✕</button>

          <div className="max-w-4xl mx-auto">
            <header className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                 <div className="px-3 py-1 bg-neon/10 border border-neon/20 text-neon text-[9px] font-mono uppercase tracking-widest">LVL_{lesson.level}</div>
                 <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono">{lesson.title}</h2>
              </div>
              <div className="h-1 w-full bg-border overflow-hidden flex">
                 <div className={`h-full transition-all duration-700 ${step === 'reading' ? 'w-1/3 bg-neon' : step === 'quiz' ? 'w-2/3 bg-neon' : 'w-full bg-neon'}`}></div>
              </div>
            </header>

            {step === 'reading' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <Notepad text={content} />
                <button 
                  onClick={() => {
                    setStep('quiz');
                    setAssistantMessage("Ready for the academic checkup? Viel Erfolg! 📝");
                  }}
                  className="mt-8 btn-tech w-full py-4 text-xs tracking-[0.2em]"
                >
                  INITIALIZE_PROFICIENCY_TEST
                </button>
              </div>
            )}

            {step === 'quiz' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {quiz.map((q, idx) => (
                  <div key={idx} className="tech-card p-6 border-border/50">
                    <p className="text-[11px] font-bold text-white mb-6 flex gap-4 font-mono uppercase">
                       <span className="text-neon/30 italic">#{idx + 1}</span>
                       {q.question}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAnswers({...answers, [idx]: opt})}
                          className={`p-3 border text-left text-[10px] font-mono transition-all uppercase tracking-widest ${
                            answers[idx] === opt 
                              ? 'bg-neon/10 border-neon text-neon' 
                              : 'bg-surface/50 border-border text-slate-500 hover:border-neon/50'
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
                  className="btn-tech w-full py-4 text-xs tracking-[0.2em]"
                >
                  VERIFY_RESULTS
                </button>
              </div>
            )}

            {step === 'result' && (
              <div className="text-center py-12 animate-in zoom-in duration-500">
                <div className="text-6xl mb-8 grayscale opacity-50">{quizScore >= 4 ? '🏅' : '🧗'}</div>
                <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-[0.3em] font-mono">{quizScore === quiz.length ? 'PERFEKT!' : 'GUT_GEMACHT!'}</h3>
                <p className="text-xs text-slate-500 mb-12 font-mono uppercase">SCORE_DETECTED: <span className="text-neon font-black">{quizScore} / {quiz.length}</span> IN {lesson.topic}</p>
                <div className="tech-card p-8 max-w-2xl mx-auto mb-12 border-neon/20">
                   <p className="text-neon text-[10px] font-bold mb-4 uppercase tracking-[0.2em] font-mono">PROGRESS_LOG:</p>
                   <p className="text-[10px] text-slate-400 leading-relaxed font-mono uppercase">
                     This module is now part of your academic portfolio. Every step gets you closer to Goethe A2 certification!
                   </p>
                </div>
                <button onClick={onComplete} className="btn-tech w-full max-w-md py-4 text-xs tracking-[0.2em]">RETURN_TO_DASHBOARD</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonModal;
