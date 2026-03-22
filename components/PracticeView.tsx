
import React, { useState } from 'react';
import { ProficiencyLevel } from '../types';
import { geminiService } from '../services/geminiService';

interface PracticeViewProps {
  level: ProficiencyLevel;
}

const PracticeView: React.FC<PracticeViewProps> = ({ level }) => {
  const [prompt] = useState('Write a short paragraph in German introducing yourself, your hobbies, and where you live.');
  const [inputText, setInputText] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await geminiService.evaluateWriting(level, prompt, inputText);
      setFeedback(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Writing Practice</h1>
        <p className="text-slate-500">Practice your German writing skills and get instant, friendly feedback!</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="bg-brand/5 border-l-4 border-brand p-6 rounded-r-2xl">
            <h4 className="text-xs font-bold text-brand uppercase tracking-widest mb-3">Today's Topic:</h4>
            <p className="text-slate-700 dark:text-slate-300 text-lg font-serif italic leading-relaxed">{prompt}</p>
          </div>

          <div className="card p-0 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Schreiben Sie hier... (Write here...)"
              className="w-full h-80 p-6 bg-transparent outline-none text-lg text-slate-700 dark:text-slate-300 resize-none placeholder:text-slate-300 font-serif"
            ></textarea>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                {inputText.split(/\s+/).filter(Boolean).length} words written
              </span>
              <button
                onClick={handleSubmit}
                disabled={loading || inputText.length < 10}
                className="btn-primary py-3 px-8 shadow-lg shadow-brand/20"
              >
                {loading ? 'Thinking...' : 'Get Feedback'}
              </button>
            </div>
          </div>
        </div>

        <div>
          {feedback ? (
            <div className="card p-8 space-y-8 animate-in slide-in-from-right duration-500 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-[var(--text-main)]">Your Feedback</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-brand text-4xl font-bold">{feedback.score}</span>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">/ 100</span>
                </div>
              </div>

              {feedback.mistakes && feedback.mistakes.length > 0 && (
                <div>
                  <h4 className="font-bold text-rose-500 mb-4 uppercase text-xs tracking-widest">Things to improve:</h4>
                  <ul className="space-y-3">
                    {feedback.mistakes?.map((m: string, i: number) => (
                      <li key={i} className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 text-sm flex gap-3">
                        <span className="text-rose-400 font-bold shrink-0">💡</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-brand/5 p-6 rounded-2xl border border-brand/10">
                <h4 className="font-bold text-brand mb-3 uppercase text-xs tracking-widest">A better way to say it:</h4>
                <p className="text-slate-700 dark:text-slate-300 text-base font-serif leading-relaxed italic">{feedback.corrections}</p>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                 <p className="text-slate-600 text-sm leading-relaxed italic">"{feedback.feedback}"</p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center p-12">
              <div className="text-5xl mb-6 grayscale opacity-40">✍️</div>
              <h3 className="text-xl font-bold text-slate-400 mb-3">Ready when you are!</h3>
              <p className="text-slate-400 max-w-xs text-sm leading-relaxed">Write your German sentences on the left and I'll help you perfect them.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeView;
