
import React, { useState, useEffect } from 'react';
import { ProficiencyLevel } from '../types';
import { geminiService } from '../services/geminiService';
import { getRandomOfflineExam } from '../services/examBank';
import { motion, AnimatePresence } from 'motion/react';

interface ExamsViewProps {
  level: ProficiencyLevel;
  examScores: Record<string, Record<string, number>>;
  onCompleteExam: (level: ProficiencyLevel, module: string, score: number) => void;
}

type ExamModule = 'Reading' | 'Listening' | 'Writing' | 'Speaking';

const ExamsView: React.FC<ExamsViewProps> = ({ level: currentLevel, examScores, onCompleteExam }) => {
  const [examLevel, setExamLevel] = useState<ProficiencyLevel>(currentLevel);
  const [selectedModule, setSelectedModule] = useState<ExamModule | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [examContent, setExamContent] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [writingInput, setWritingInput] = useState('');
  const [examFinished, setExamFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'official'>('interactive');
  const [showTranslation, setShowTranslation] = useState(false);
  const [remainingAudioPlays, setRemainingAudioPlays] = useState<number>(3);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const handlePlayExamAudio = async (text: string) => {
    if (isAudioPlaying) {
      geminiService.stopSpeaking();
      setIsAudioPlaying(false);
      return;
    }
    if (remainingAudioPlays <= 0) return;

    setRemainingAudioPlays(p => p - 1);
    await geminiService.speakText(
      text,
      () => {
        setIsAudioPlaying(true);
      },
      () => {
        setIsAudioPlaying(false);
      }
    );
  };

  const handleStopExamAudio = () => {
    geminiService.stopSpeaking();
    setIsAudioPlaying(false);
  };

  // Real-world language exam state flags
  const [showPreExamAlert, setShowPreExamAlert] = useState(false);
  const [prepModule, setPrepModule] = useState<ExamModule | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Cleanup speech resources on unmount
  useEffect(() => {
    return () => {
      geminiService.stopSpeaking();
    };
  }, []);

  // Countdown timer processing loop
  useEffect(() => {
    if (!examStarted || loading || examFinished || timeLeft <= 0) {
      if (timeLeft === 0 && examStarted && !examFinished && !loading) {
        finishExam();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, loading, examFinished, timeLeft]);

  const officialPapers = [
    {
      provider: 'Goethe-Institut',
      title: `${examLevel} Practice Materials`,
      desc: 'Official practice sets from Goethe-Institut including Reading, Writing, Listening, and Speaking modules.',
      link: examLevel === ProficiencyLevel.A1 
        ? 'https://www.goethe.de/en/spr/kup/prf/prf/sd1/ueb.html' 
        : 'https://www.goethe.de/en/spr/kup/prf/prf/gzad/ueb.html',
      badge: 'Highly Recommended'
    },
    {
      provider: 'Telc',
      title: `${examLevel} Mock Examination`,
      desc: 'Complete mock examination papers from Telc (The European Language Certificates).',
      link: examLevel === ProficiencyLevel.A1 
        ? 'https://www.telc.net/en/candidates/language-examinations/tests/detail/telc-deutsch-a1.html#t=2' 
        : 'https://www.telc.net/en/candidates/language-examinations/tests/detail/telc-deutsch-a2.html#t=2',
      badge: 'Standardized'
    },
    {
      provider: 'ÖSD',
      title: `ÖSD Zertifikat ${examLevel} Practice`,
      desc: 'Practice materials for the Austrian Language Diploma German.',
      link: 'https://www.osd.at/en/exams/osd-exams/',
      badge: 'Regional'
    }
  ];

  const validateExamContent = (content: any, module: ExamModule): boolean => {
    if (!content) return false;
    if (module === 'Reading' || module === 'Listening') {
      return !!(
        content.text &&
        Array.isArray(content.questions) &&
        content.questions.length > 0 &&
        content.questions.every((q: any) => q && q.question && Array.isArray(q.options) && q.options.length > 0 && q.correctAnswer)
      );
    }
    if (module === 'Writing') {
      return !!content.writingPrompt;
    }
    if (module === 'Speaking') {
      return Array.isArray(content.speakingPoints) && content.speakingPoints.length > 0;
    }
    return false;
  };

  const startExam = async (module: ExamModule, forceAI = false) => {
    // Stop any speaking audio from other activities
    geminiService.stopSpeaking();
    
    setSelectedModule(module);
    setExamStarted(true);
    setLoading(true);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setWritingInput("");
    setTimeLeft(600); // 10 minutes in seconds
    try {
      // Improved prompt for variety and structure with translations
      const prompt = `Generate a unique mock exam module for German ${examLevel} Level. Module: ${module}.
      
      Requirements:
      - Content must follow CEFR ${examLevel} standards.
      - Ensure the vocabulary and grammar vary from previous attempts.
      - Use different names, locations, and scenarios.
      - For Reading/Listening: Provide a coherent text and 5 varied multiple choice questions.
      - For Writing: Provide a formal or informal prompt (letter, email, or post).
      - For Speaking: Provide 3 discussion prompts and a short picture description task.
      - CRITICAL: Provide English translations for the main text, every question, the writing prompt, and all speaking points.
      
      Return a JSON object with fields like 'text', 'textTranslation', 'questions' (each with 'question', 'questionTranslation', 'options', 'correctAnswer'), 'writingPrompt', 'writingPromptTranslation', 'speakingPoints', 'speakingPointsTranslation'.`;
      
      let content;
      if (forceAI) {
        content = await geminiService.generateExamContent(examLevel, module, prompt);
      } else {
        // Race standard API request with a 5.0 second timeout for high reliability on slow internet
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ isTimeout: true }), 5000));
        const fetchPromise = geminiService.generateExamContent(examLevel, module, prompt);
        const result: any = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (result && result.isTimeout) {
          console.warn("Gemini API call timed out on slow internet. Reverting to local study bank exam.");
          content = getRandomOfflineExam(examLevel, module);
          content = { ...content, wasFastLoaded: true };
        } else {
          content = result;
        }
      }

      // Check if content structure fits standard requirements
      if (!validateExamContent(content, module)) {
        console.warn("Invalid structure parsed. Loading offline-first exam standard.");
        content = getRandomOfflineExam(examLevel, module);
        content = { ...content, wasFastLoaded: true };
      }

      setExamContent(content);
      setIsAudioPlaying(false);
      if (module === 'Listening' && content.text) {
        setRemainingAudioPlays(2); // First play is automatic on load, leaving 2 remaining of the 3 total attempts
        geminiService.speakText(
          content.text,
          () => {
            setIsAudioPlaying(true);
          },
          () => {
            setIsAudioPlaying(false);
          }
        );
      } else {
        setRemainingAudioPlays(3);
      }
    } catch (error) {
      console.error("Failed to load exam:", error);
      const fallback = getRandomOfflineExam(examLevel, module);
      setExamContent({ ...fallback, wasFastLoaded: true });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    const totalQs = examContent?.questions?.length || 0;
    if (currentQuestionIndex < totalQs - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    geminiService.stopSpeaking();
    setIsAudioPlaying(false);
    let finalScore = 0;
    if (selectedModule === 'Reading' || selectedModule === 'Listening') {
      const qs = examContent?.questions || [];
      qs.forEach((q: any, i: number) => {
        if (userAnswers[i] === q.correctAnswer) finalScore += 20;
      });
    } else if (selectedModule === 'Writing') {
      setLoading(true);
      const promptStr = examContent?.writingPrompt || '';
      const evaluation = await geminiService.evaluateWriting(examLevel, promptStr, writingInput);
      finalScore = evaluation.score;
      setLoading(false);
    } else {
      finalScore = 85; // Mock for speaking
    }
    
    setScore(finalScore);
    setExamFinished(true);
    if (selectedModule) {
      onCompleteExam(examLevel, selectedModule, finalScore);
    }
  };

  const handleExitExam = () => {
    geminiService.stopSpeaking();
    setIsAudioPlaying(false);
    setExamStarted(false);
    setSelectedModule(null);
    setExamContent(null);
    setShowExitConfirm(false);
  };

  if (examFinished) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card max-w-md w-full text-center"
        >
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold mb-2">Exam Complete!</h2>
          <p className="text-slate-500 mb-8">You've finished the {selectedModule} module for {examLevel}.</p>
          
          <div className="bg-brand/5 p-8 rounded-3xl mb-8">
            <div className="text-sm font-bold text-brand uppercase tracking-widest mb-2">Your Score</div>
            <div className="text-6xl font-bold text-slate-800">{score}%</div>
          </div>

          <button 
            onClick={() => {
              setExamFinished(false);
              setExamStarted(false);
              setSelectedModule(null);
              setExamContent(null);
              setCurrentQuestionIndex(0);
              setUserAnswers([]);
              setWritingInput('');
            }}
            className="btn-primary w-full"
          >
            Back to Exams
          </button>
        </motion.div>
      </div>
    );
  }

  if (examStarted) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700">
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="text-slate-500 hover:text-rose-600 active:scale-95 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl w-fit bg-transparent"
          >
            ← Exit Exam
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              {selectedModule} Module • {examLevel}
            </div>
            
            <div className="flex items-center gap-2 bg-amber-500/15 dark:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold font-mono text-[11px] sm:text-xs animate-pulse">
              ⏳ Timer: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Double-Confirmation Exit Modal */}
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-800 dark:text-white"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 max-w-sm w-full rounded-[30px] p-6 shadow-2xl border-4 border-rose-500/30 overflow-hidden relative"
              >
                <div className="text-3xl text-center mb-4">🚪</div>
                <h3 className="text-xl font-black text-center mb-2">Leave Exam?</h3>
                <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
                  Leaving now will stop the sound stream and void all your answers. Your progress so far will be lost.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-transparent"
                  >
                    Resume
                  </button>
                  <button
                    onClick={handleExitExam}
                    className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/15 active:scale-95 transition-all"
                  >
                    Exit & Void
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="card p-20 text-center">
            <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold">Preparing your exam...</h3>
            <p className="text-slate-500">Generating authentic {examLevel} content.</p>
          </div>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-8"
          >
            {examContent?.wasFastLoaded && (
              <div id="quick-studypack-indicator" className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/40 text-sm max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-500 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-pulse">⚡</span>
                  <div>
                    <h5 className="font-bold">Instant-Load Exam Active</h5>
                    <p className="text-xs text-sky-600/80 dark:text-sky-400/80">To bypass web bottlenecks, we pulled a high-quality CEFR exam from our study bank. It's completely authentic and offline-ready.</p>
                  </div>
                </div>
                <button
                  onClick={() => startExam(selectedModule!, true)}
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl font-bold transition-all text-xs shrink-0 self-end sm:self-auto shadow"
                >
                  {loading ? 'Generating...' : 'Regenerate via AI'}
                </button>
              </div>
            )}
            
            {(selectedModule === 'Reading' || selectedModule === 'Listening') && examContent && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="card h-fit lg:sticky lg:top-24">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    {selectedModule === 'Reading' ? '📖 Reading Passage' : '🎧 Audio Control Panel'}
                  </h3>
                  
                  {selectedModule === 'Listening' ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-brand/5 dark:bg-slate-800 rounded-3xl border-2 border-brand/10 hover:border-brand/20 transition-all min-h-[280px]">
                      {isAudioPlaying ? (
                        <div className="flex gap-1.5 items-end justify-center h-16 mb-6">
                          <div className="w-1.5 bg-brand rounded-full animate-[bounce_1s_infinite_100ms] h-10"></div>
                          <div className="w-1.5 bg-brand rounded-full animate-[bounce_1s_infinite_300ms] h-14"></div>
                          <div className="w-1.5 bg-brand rounded-full animate-[bounce_1s_infinite_150ms] h-12"></div>
                          <div className="w-1.5 bg-brand rounded-full animate-[bounce_1s_infinite_400ms] h-16"></div>
                          <div className="w-1.5 bg-brand rounded-full animate-[bounce_1s_infinite_200ms] h-8"></div>
                          <div className="w-1.5 bg-brand rounded-full animate-[bounce_1s_infinite_350ms] h-11"></div>
                          <div className="w-1.5 bg-brand rounded-full animate-[bounce_1s_infinite_500ms] h-15"></div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-3xl mb-6 shadow-inner">
                          🔇
                        </div>
                      )}
                      
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center uppercase tracking-wider">
                        {isAudioPlaying ? '🎧 Listening Audio is Playing' : '🎧 Audio Stream is Stopped'}
                      </p>
                      
                      <div className="mt-4 bg-white dark:bg-slate-900 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 font-extrabold uppercase tracking-widest text-center">
                        Playback Left: <span className="text-brand font-black text-xs">{remainingAudioPlays} / 3</span>
                      </div>

                      <div className="flex gap-3 w-full mt-6 max-w-xs">
                        {isAudioPlaying ? (
                          <button
                            onClick={handleStopExamAudio}
                            className="flex-grow py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-500/10 active:scale-95"
                          >
                            🛑 Stop Playback
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePlayExamAudio(examContent.text)}
                            disabled={remainingAudioPlays <= 0}
                            className={`flex-grow py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-md ${
                              remainingAudioPlays > 0
                                ? 'bg-brand hover:bg-brand-600 text-white shadow-brand/10 active:scale-95'
                                : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-250 dark:border-slate-800 cursor-not-allowed shadow-none'
                            }`}
                          >
                            ▶️ Play Recording
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 mt-4 text-center max-w-xs leading-relaxed italic">
                        Multiple viewing of all questions is enabled. Scroll through questions on the right. You can trigger play/stop up to 3 times.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-slate-600 leading-relaxed text-lg italic">
                        {examContent.text}
                      </div>
                      {examContent.textTranslation && (
                        <button 
                          onClick={() => setShowTranslation(!showTranslation)}
                          className="mt-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand transition-all"
                        >
                          {showTranslation ? "Hide English Translation" : "Show English Translation"}
                        </button>
                      )}
                      {showTranslation && examContent.textTranslation && (
                         <p className="mt-2 text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-200">
                            {examContent.textTranslation}
                         </p>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="card shadow-lg p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Exam Questions</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Answer all questions below to complete the assessment.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-brand uppercase tracking-widest font-mono">
                          {userAnswers.filter(Boolean).length} / {examContent?.questions?.length || 0} Complete
                        </span>
                      </div>
                    </div>

                    <div className="space-y-8 divide-y divide-slate-100 dark:divide-slate-800/60">
                      {(examContent?.questions || []).map((q: any, qIdx: number) => (
                        <div key={qIdx} className={qIdx > 0 ? "pt-6" : ""}>
                          <div className="flex items-start gap-3 mb-4">
                            <span className="bg-brand/10 text-brand text-[10px] font-extrabold px-2 py-1 rounded-md tracking-wider uppercase">Q {qIdx + 1}</span>
                            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug mt-0.5">{q.question}</h5>
                          </div>
                          
                          {showTranslation && q.questionTranslation && (
                            <p className="text-xs text-slate-400 italic mb-4 pl-12">
                              "{q.questionTranslation}"
                            </p>
                          )}
                          
                          <div className="grid grid-cols-1 gap-2 pl-0 sm:pl-12">
                            {(q.options || []).map((option: string, optIdx: number) => (
                              <button
                                key={optIdx}
                                onClick={() => {
                                  const newAnswers = [...userAnswers];
                                  newAnswers[qIdx] = option;
                                  setUserAnswers(newAnswers);
                                }}
                                className={`w-full p-3.5 rounded-xl text-left border-2 text-xs transition-all font-medium ${
                                  userAnswers[qIdx] === option 
                                    ? 'border-brand bg-brand/5 dark:bg-brand/10 text-brand font-bold' 
                                    : 'border-slate-100 dark:border-slate-800/40 hover:border-brand/20 dark:text-slate-300'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={finishExam}
                      disabled={userAnswers.filter(Boolean).length < (examContent?.questions?.length || 0)}
                      className={`w-full mt-8 py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                        userAnswers.filter(Boolean).length === (examContent?.questions?.length || 0)
                          ? 'bg-brand hover:bg-brand-600 text-white shadow-lg shadow-brand/15 active:scale-[0.98]'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      Finish and Submit Exam 🚀
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedModule === 'Writing' && examContent && (
              <div className="card max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">Writing Task</h3>
                <p className="text-slate-600 mb-4 p-6 bg-brand/5 rounded-2xl italic border border-brand/10">
                  {examContent.writingPrompt}
                </p>
                {examContent.writingPromptTranslation && (
                  <button 
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="mb-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand transition-all block mx-auto"
                  >
                    {showTranslation ? "Hide Translation" : "Need help? Show English version"}
                  </button>
                )}
                {showTranslation && examContent.writingPromptTranslation && (
                  <p className="mb-8 text-sm text-slate-400 italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 text-center">
                    {examContent.writingPromptTranslation}
                  </p>
                )}
                <textarea
                  value={writingInput}
                  onChange={(e) => setWritingInput(e.target.value)}
                  className="input-field min-h-[300px] mb-8 resize-none"
                  placeholder="Write your response in German here..."
                ></textarea>
                <button 
                  onClick={finishExam}
                  disabled={!writingInput || writingInput.length < 50}
                  className="btn-primary w-full"
                >
                  Submit for Evaluation
                </button>
              </div>
            )}

            {selectedModule === 'Speaking' && examContent && (
              <div className="card max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-bold mb-4">Speaking Practice</h3>
                <p className="text-slate-500 mb-8">Discuss the following points with the assistant. This is a practice module.</p>
                <div className="space-y-4 mb-8">
                  {examContent.speakingPoints.map((point: string, i: number) => (
                    <div key={i} className="group">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-left border border-slate-100 dark:border-slate-700">
                        {point}
                      </div>
                      {examContent.speakingPointsTranslation && (
                         <p className="mt-1 text-[10px] text-slate-400 italic px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {examContent.speakingPointsTranslation[i]}
                         </p>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={finishExam} className="btn-primary w-full">Complete Speaking Practice</button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Real-world Exam Timing Gatekeeper Alert Modal */}
      <AnimatePresence>
        {showPreExamAlert && prepModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-800 dark:text-white"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-[32px] p-8 shadow-2xl border-4 border-amber-500/30 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 animate-pulse"></div>
              <div className="text-3xl mb-4 text-center">⚠️</div>
              <h3 className="text-2xl font-black text-center mb-2">Achtung: Real Exam Mode</h3>
              <p className="text-xs uppercase font-mono text-center font-bold text-amber-600 dark:text-amber-400 tracking-widest mb-6">Standardized Language Testing Protocol</p>
              
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8 bg-amber-50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                <div className="flex gap-3">
                  <span className="text-lg">⏳</span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Strict Time Limit</p>
                    <p className="text-xs text-slate-500 font-medium">You have exactly <span className="font-extrabold text-amber-600">10:00 minutes</span> to finish. The platform will automatically evaluate and save your inputs if time runs out.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">🔒</span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">No Pausing Allowed</p>
                    <p className="text-xs text-slate-500 font-medium">Once initiated, the exam cannot be paused or stopped. Your options are to submit, or exit completely (which voids your current scoring).</p>
                  </div>
                </div>
                {prepModule === 'Listening' && (
                  <div className="flex gap-3">
                    <span className="text-lg">🎧</span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">Audio Replay & Multi-Question View</p>
                      <p className="text-xs text-slate-500 font-medium font-serif italic">The listening recording will start playing automatically and can be repeated up to 3 times total. All questions are fully visible simultaneously to help you answer easily.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowPreExamAlert(false);
                    setPrepModule(null);
                  }}
                  className="flex-1 py-3 px-5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const mod = prepModule;
                    setShowPreExamAlert(false);
                    setPrepModule(null);
                    startExam(mod);
                  }}
                  className="flex-1 py-3 px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-amber-500/15 active:scale-95 transition-all text-center"
                >
                  Start Exam Now ⚡
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <div className="card p-0 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="py-12 bg-brand/5 dark:bg-slate-800/25 border-b border-brand/10 flex flex-col items-center justify-center gap-4 relative overflow-hidden text-center px-4 min-h-[300px]">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--color-brand)_0%,_transparent_70%)]"></div>
             <div className="text-4xl relative z-10">🎓</div>
             <h1 className="text-3xl font-bold text-slate-800 dark:text-white relative z-10">Mock Exam: {examLevel}</h1>
             <div className="flex gap-3 relative z-10 flex-wrap justify-center">
                {(['A1', 'A2'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setExamLevel(l as ProficiencyLevel)}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${examLevel === l ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur text-slate-400 hover:text-brand border border-slate-100 dark:border-slate-800'}`}
                  >
                    {l} Level
                  </button>
                ))}
             </div>
             {examLevel === ProficiencyLevel.A1 && currentLevel === ProficiencyLevel.A1 && (
               <div className="mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur px-5 py-2 rounded-full border border-brand/20 shadow-sm z-20 relative max-w-sm">
                 <p className="text-[11px] text-brand-600 dark:text-brand-400 font-extrabold tracking-wide">✨ Pass all 4 modules with 70%+ to unlock A2!</p>
               </div>
             )}
          </div>
          
          <div className="p-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 w-fit">
                <button 
                  onClick={() => setViewMode('interactive')}
                  className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'interactive' ? 'bg-white dark:bg-slate-700 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Interactive Exam
                </button>
                <button 
                  onClick={() => setViewMode('official')}
                  className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'official' ? 'bg-white dark:bg-slate-700 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Official Past Papers
                </button>
              </div>

              {viewMode === 'interactive' && (
                <div className="flex gap-2">
                  <div className={`p-2 rounded-lg border-2 ${examScores[examLevel]?.Reading >= 70 ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Reading Passed">📖</div>
                  <div className={`p-2 rounded-lg border-2 ${examScores[examLevel]?.Listening >= 70 ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Listening Passed">🎧</div>
                  <div className={`p-2 rounded-lg border-2 ${examScores[examLevel]?.Writing >= 70 ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Writing Passed">✍️</div>
                  <div className={`p-2 rounded-lg border-2 ${examScores[examLevel]?.Speaking >= 70 ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Speaking Passed">🗣️</div>
                </div>
              )}
            </div>

            {viewMode === 'interactive' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {[
                  { id: 'Reading', icon: '📖', title: 'Lesen', desc: 'Reading comprehension with 5 questions.' },
                  { id: 'Listening', icon: '🎧', title: 'Hören', desc: 'Audio-based listening test with 5 questions.' },
                  { id: 'Writing', icon: '✍️', title: 'Schreiben', desc: 'Writing task with AI evaluation.' },
                  { id: 'Speaking', icon: '🗣️', title: 'Sprechen', desc: 'Speaking practice and discussion.' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPrepModule(m.id as ExamModule);
                      setShowPreExamAlert(true);
                    }}
                    className="card p-6 text-left hover:border-brand transition-all group"
                  >
                    <div className="text-3xl mb-4">{m.icon}</div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-brand transition-colors">{m.title}</h3>
                    <p className="text-sm text-slate-500">{m.desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6 mb-10">
                 {officialPapers.map((paper, idx) => (
                   <div key={idx} className="card p-8 border-slate-100 flex flex-col md:flex-row items-center gap-8 hover:border-brand transition-all group">
                      <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center shrink-0">
                         <span className="text-2xl">📄</span>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{paper.title}</h3>
                          <span className="px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded uppercase tracking-widest">{paper.badge}</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">{paper.provider}</p>
                        <p className="text-sm text-slate-600 leading-relaxed max-w-xl">{paper.desc}</p>
                      </div>
                      <a 
                        href={paper.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-primary py-3 px-8 text-sm group-hover:scale-105 transition-transform"
                      >
                        View Exercises
                      </a>
                   </div>
                 ))}
                 <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 italic">"Official materials are provided by external organizations and may open in a new window."</p>
                 </div>
              </div>
            )}

            <div className="bg-brand/5 p-6 rounded-2xl border border-brand/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-brand font-bold uppercase mb-1 tracking-widest">Selected Exam Level</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{examLevel}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-brand font-bold uppercase mb-1 tracking-widest">Passing Score</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">70%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamsView;
