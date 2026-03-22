
import React, { useState, useEffect } from 'react';
import { ProficiencyLevel } from '../types';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface ExamsViewProps {
  level: ProficiencyLevel;
  onCompleteExam: (score: number) => void;
}

type ExamModule = 'Reading' | 'Listening' | 'Writing' | 'Speaking';

const ExamsView: React.FC<ExamsViewProps> = ({ level, onCompleteExam }) => {
  const [selectedModule, setSelectedModule] = useState<ExamModule | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [examContent, setExamContent] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [writingInput, setWritingInput] = useState('');
  const [examFinished, setExamFinished] = useState(false);
  const [score, setScore] = useState(0);

  const startExam = async (module: ExamModule) => {
    setSelectedModule(module);
    setExamStarted(true);
    setLoading(true);
    try {
      const content = await geminiService.generateExamContent(level, module);
      setExamContent(content);
      if (module === 'Listening' && content.text) {
        geminiService.speakText(content.text);
      }
    } catch (error) {
      console.error("Failed to load exam:", error);
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
    if (currentQuestionIndex < examContent.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    let finalScore = 0;
    if (selectedModule === 'Reading' || selectedModule === 'Listening') {
      examContent.questions.forEach((q: any, i: number) => {
        if (userAnswers[i] === q.correctAnswer) finalScore += 20;
      });
    } else if (selectedModule === 'Writing') {
      setLoading(true);
      const evaluation = await geminiService.evaluateWriting(level, examContent.writingPrompt, writingInput);
      finalScore = evaluation.score;
      setLoading(false);
    } else {
      finalScore = 85; // Mock for speaking
    }
    
    setScore(finalScore);
    setExamFinished(true);
    onCompleteExam(finalScore);
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
          <p className="text-slate-500 mb-8">You've finished the {selectedModule} module for {level}.</p>
          
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
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setExamStarted(false)}
            className="text-slate-400 hover:text-brand transition-all flex items-center gap-2 font-medium"
          >
            ← Exit Exam
          </button>
          <div className="text-sm font-bold text-brand uppercase tracking-widest">
            {selectedModule} Module • {level}
          </div>
        </div>

        {loading ? (
          <div className="card p-20 text-center">
            <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold">Preparing your exam...</h3>
            <p className="text-slate-500">Generating authentic {level} content.</p>
          </div>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-8"
          >
            {(selectedModule === 'Reading' || selectedModule === 'Listening') && examContent && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card h-fit sticky top-24">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    {selectedModule === 'Reading' ? '📖 Reading Text' : '🎧 Listening Audio'}
                  </h3>
                  {selectedModule === 'Listening' && (
                    <button 
                      onClick={() => geminiService.speakText(examContent.text)}
                      className="btn-secondary w-full mb-4 flex items-center justify-center gap-2"
                    >
                      🔊 Play Audio Again
                    </button>
                  )}
                  <div className="text-slate-600 leading-relaxed text-lg italic">
                    {examContent.text}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="card">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold text-brand uppercase tracking-widest">Question {currentQuestionIndex + 1} of {examContent.questions.length}</span>
                      <div className="h-1 w-32 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand transition-all duration-500" 
                          style={{ width: `${((currentQuestionIndex + 1) / examContent.questions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-bold mb-8">{examContent.questions[currentQuestionIndex].question}</h4>
                    
                    <div className="space-y-3">
                      {examContent.questions[currentQuestionIndex].options.map((option: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(option)}
                          className={`w-full p-4 rounded-2xl text-left border-2 transition-all font-medium ${
                            userAnswers[currentQuestionIndex] === option 
                              ? 'border-brand bg-brand/5 text-brand' 
                              : 'border-slate-100 dark:border-slate-800 hover:border-brand/30'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={nextQuestion}
                      disabled={!userAnswers[currentQuestionIndex]}
                      className="btn-primary w-full mt-8"
                    >
                      {currentQuestionIndex === examContent.questions.length - 1 ? 'Finish Exam' : 'Next Question'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedModule === 'Writing' && examContent && (
              <div className="card max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">Writing Task</h3>
                <p className="text-slate-600 mb-8 p-6 bg-brand/5 rounded-2xl italic border border-brand/10">
                  {examContent.writingPrompt}
                </p>
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
                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-left border border-slate-100 dark:border-slate-700">
                      {point}
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
      <div className="max-w-4xl mx-auto">
        <div className="card p-0 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="h-48 bg-brand/5 border-b border-brand/10 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--color-brand)_0%,_transparent_70%)]"></div>
             <div className="text-4xl mb-4 relative z-10">🎓</div>
             <h1 className="text-3xl font-bold text-slate-800 dark:text-white relative z-10">Mock Exam: {level}</h1>
             <p className="text-brand font-medium uppercase tracking-widest text-xs mt-2 relative z-10">Choose your module to begin</p>
          </div>
          
          <div className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[
                { id: 'Reading', icon: '📖', title: 'Lesen', desc: 'Reading comprehension with 5 questions.' },
                { id: 'Listening', icon: '🎧', title: 'Hören', desc: 'Audio-based listening test with 5 questions.' },
                { id: 'Writing', icon: '✍️', title: 'Schreiben', desc: 'Writing task with AI evaluation.' },
                { id: 'Speaking', icon: '🗣️', title: 'Sprechen', desc: 'Speaking practice and discussion.' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => startExam(m.id as ExamModule)}
                  className="card p-6 text-left hover:border-brand transition-all group"
                >
                  <div className="text-3xl mb-4">{m.icon}</div>
                  <h3 className="text-xl font-bold mb-1 group-hover:text-brand transition-colors">{m.title}</h3>
                  <p className="text-sm text-slate-500">{m.desc}</p>
                </button>
              ))}
            </div>

            <div className="bg-brand/5 p-6 rounded-2xl border border-brand/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-brand font-bold uppercase mb-1 tracking-widest">Current Proficiency</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{level}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-brand font-bold uppercase mb-1 tracking-widest">Passing Score</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">60%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamsView;
