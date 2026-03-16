
import React, { useState } from 'react';
import { ProficiencyLevel } from '../types';

interface ExamsViewProps {
  level: ProficiencyLevel;
  onCompleteExam: (score: number) => void;
}

const ExamsView: React.FC<ExamsViewProps> = ({ level }) => {
  const [examStarted, setExamStarted] = useState(false);

  return (
    <div className="p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {!examStarted ? (
          <div className="tech-card p-0 overflow-hidden">
            <div className="h-32 bg-surface border-b border-border flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--neon)_0%,_transparent_70%)]"></div>
               <h1 className="text-sm font-bold text-white relative z-10 uppercase tracking-[0.4em] font-mono">Mock_Exam_{level}</h1>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
                    <span className="text-neon">{'>>'}</span>
                    Simulation_Structure
                  </h3>
                  <ul className="space-y-2 text-slate-500 text-[10px] font-mono uppercase">
                    <li className="flex justify-between border-b border-border/50 pb-1"><span>Lesen (Reading)</span> <span className="text-neon">25:00</span></li>
                    <li className="flex justify-between border-b border-border/50 pb-1"><span>Hören (Listening)</span> <span className="text-neon">20:00</span></li>
                    <li className="flex justify-between border-b border-border/50 pb-1"><span>Schreiben (Writing)</span> <span className="text-neon">20:00</span></li>
                    <li className="flex justify-between border-b border-border/50 pb-1"><span>Sprechen (Speaking)</span> <span className="text-neon">15:00</span></li>
                  </ul>
                </div>
                <div className="space-y-4">
                   <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
                    <span className="text-neon">{'>>'}</span>
                    Operational_Parameters
                  </h3>
                  <p className="text-slate-500 text-[9px] leading-relaxed font-mono uppercase">
                    Ensure acoustic isolation. Audio hardware required for listening modules. Session persistence is mandatory once initialized.
                  </p>
                  <div className="bg-neon/5 p-3 border border-neon/10">
                    <p className="text-[8px] text-neon font-bold uppercase mb-1 font-mono tracking-widest">Pass_Threshold</p>
                    <p className="text-lg font-black text-white font-mono">60 <span className="text-[10px] text-slate-500">/ 100 PTS</span></p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setExamStarted(true)}
                  className="btn-tech flex-1 py-3"
                >
                  Initialize_Simulation
                </button>
                <button className="btn-outline flex-1 py-3">
                  Historical_Data
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="tech-card p-12 text-center">
            <div className="w-16 h-16 bg-neon/5 border border-neon/20 flex items-center justify-center mx-auto mb-8">
               <div className="w-8 h-8 border-2 border-neon border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 font-mono">Simulation_Mode_Active</h2>
            <p className="text-slate-500 text-[10px] mb-8 font-mono uppercase">Synchronizing authentic assessment modules for proficiency level {level}.</p>
            <button 
              onClick={() => setExamStarted(false)}
              className="text-red-500 text-[9px] font-bold uppercase tracking-widest hover:underline font-mono"
            >
              Abort_Operation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamsView;
