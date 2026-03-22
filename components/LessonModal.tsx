
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
        setAssistantMessage(`Let's explore ${lesson.topic} together! It's going to be fun!`);
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
    setAssistantMessage("Listen closely to the pronunciation! 🎧");
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
      setAssistantMessage("Incredible! You're a natural at this! ⭐");
      setAssistantMood('excited');
    } else {
      setAssistantMessage("Great job! Every mistake is a chance to learn something new. ✍️");
      setAssistantMood('happy');
    }
  };

  const Notepad = ({ text }: { text: string }) => {
    return (
      <div className="relative card p-8 md:p-12 overflow-hidden bg-white shadow-xl shadow-slate-200/50 border-brand/10">
        <div className="absolute top-0 left-0 w-full h-2 bg-brand/10"></div>
        
        <button 
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="absolute top-6 right-6 btn-secondary py-2 px-4 text-xs z-20 flex items-center gap-2"
        >
          {isSpeaking ? '🔊 Playing...' : '🔊 Listen'}
        </button>

        <div className="relative z-10 font-serif text-lg leading-relaxed text-slate-700">
           {text.split('\n').map((line, lineIdx) => (
             <p key={lineIdx} className="mb-6">
                {line.split(' ').map((word, wordIdx) => {
                  const isNoun = /^[A-Z]/.test(word) && word.length > 3;
                  if (isNoun) {
                    return (
                      <span key={wordIdx} className="inline-block relative px-1 mx-0.5 group">
                        <span className="relative z-10 text-brand font-bold">{word} </span>
                        <div className="absolute -bottom-0.5 left-0 w-full h-1 bg-brand/10 rounded-full"></div>
                      </span>
                    );
                  }
                  return <span key={wordIdx}>{word} </span>;
                })}
             </p>
           ))}
        </div>
        <div className="absolute bottom-6 left-8 opacity-40 text-brand font-medium text-[10px] uppercase tracking-widest italic">Level {lesson.level} • {lesson.topic}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/90 backdrop-blur-md">
        <div className="text-center">
           <div className="w-24 h-24 mb-8 mx-auto"><Assistant message="..." mood="thinking" /></div>
           <h3 className="text-sm font-medium text-brand uppercase tracking-[0.4em] animate-pulse">Preparing your lesson...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="bg-paper rounded-[40px] shadow-2xl w-full max-w-7xl max-h-full overflow-hidden relative flex flex-col md:flex-row border border-white/50">
        
        <div className="hidden md:flex w-72 bg-brand/5 border-r border-brand/10 items-center justify-center p-8 shrink-0">
          <Assistant message={assistantMessage} mood={assistantMood} />
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 relative">
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-brand hover:border-brand transition-all z-50"
          >
            ✕
          </button>

          <div className="max-w-4xl mx-auto">
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                 <div className="px-3 py-1 bg-brand/10 text-brand text-[10px] font-bold rounded-full uppercase tracking-widest">Level {lesson.level}</div>
                 <h2 className="text-2xl font-bold text-slate-800">{lesson.title}</h2>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                 <div className={`h-full transition-all duration-700 rounded-full ${step === 'reading' ? 'w-1/3 bg-brand' : step === 'quiz' ? 'w-2/3 bg-brand' : 'w-full bg-brand'}`}></div>
              </div>
            </header>

            {step === 'reading' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <Notepad text={content} />
                <button 
                  onClick={() => {
                    setStep('quiz');
                    setAssistantMessage("Ready for a quick checkup? You've got this! 📝");
                  }}
                  className="mt-10 btn-primary w-full py-5 text-lg shadow-xl shadow-brand/20"
                >
                  Start Quiz
                </button>
              </div>
            )}

            {step === 'quiz' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {quiz.map((q, idx) => (
                  <div key={idx} className="card p-8 border-slate-100">
                    <p className="text-lg font-bold text-slate-800 mb-8 flex gap-4">
                       <span className="text-brand/30 italic">#{idx + 1}</span>
                       {q.question}
                    </p>
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
