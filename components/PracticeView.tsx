
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
    <div className="p-6 font-sans">
      <div className="mb-8">
        <h1 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Writing_Lab</h1>
        <p className="text-[10px] text-slate-500 font-mono uppercase">Neural phonetic calibration and syntax analysis.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-neon/5 border-l-2 border-neon p-4">
            <h4 className="text-[9px] font-bold text-neon uppercase tracking-widest mb-2 font-mono">Input_Prompt:</h4>
            <p className="text-slate-300 text-xs font-mono leading-relaxed">{prompt}</p>
          </div>

          <div className="tech-card p-0 overflow-hidden">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="SCHREIBEN SIE HIER..."
              className="w-full h-64 p-4 bg-transparent outline-none text-xs text-white resize-none font-mono placeholder:text-slate-700"
            ></textarea>
            <div className="bg-surface/50 px-4 py-3 flex justify-between items-center border-t border-border">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                {inputText.split(/\s+/).filter(Boolean).length} WORDS_DETECTED
              </span>
              <button
                onClick={handleSubmit}
                disabled={loading || inputText.length < 10}
                className="btn-tech py-1.5 px-6"
              >
                {loading ? 'ANALYZING...' : 'EXECUTE_ANALYSIS'}
              </button>
            </div>
          </div>
        </div>

        <div>
          {feedback ? (
            <div className="tech-card p-6 space-y-6 animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Analysis_Report</h3>
                <div className="text-neon font-mono text-xl font-black">
                  {feedback.score}<span className="text-[10px] text-slate-500 ml-1">/100</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-red-500 mb-3 uppercase text-[9px] tracking-widest font-mono">Syntax_Errors_Detected</h4>
                <ul className="space-y-2">
                  {feedback.mistakes?.map((m: string, i: number) => (
                    <li key={i} className="bg-red-500/5 text-red-400 p-2 border border-red-500/10 text-[10px] font-mono flex gap-2">
                      <span className="text-red-500">{'>>'}</span> {m}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-neon/5 p-4 border border-neon/10">
                <h4 className="font-bold text-neon mb-2 uppercase text-[9px] tracking-widest font-mono">Optimized_Version</h4>
                <p className="text-slate-300 text-[10px] font-mono leading-relaxed italic">{feedback.corrections}</p>
              </div>

              <div className="pt-4 border-t border-border">
                 <p className="text-slate-500 text-[10px] font-mono leading-relaxed uppercase">"{feedback.feedback}"</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-surface/30 border border-dashed border-border text-center p-8">
              <div className="text-3xl mb-4 opacity-20">🕵️‍♂️</div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Awaiting_Input</h3>
              <p className="text-[9px] text-slate-600 max-w-xs mt-2 font-mono uppercase">Submit text for neural syntax verification and proficiency scoring.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeView;
