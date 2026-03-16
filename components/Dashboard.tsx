
import React from 'react';
import { UserProgress, Lesson } from '../types';

interface DashboardProps {
  progress: UserProgress;
  lessons: Lesson[];
}

const Dashboard: React.FC<DashboardProps> = ({ progress, lessons }) => {
  const nextLesson = lessons.find(l => l.status === 'available');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 tech-card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">Course_Analytics</h3>
              <p className="text-[10px] text-slate-500 uppercase mt-1">Real-time performance tracking</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-neon text-2xl font-bold">{progress.totalProgress}%</span>
              <div className="text-[9px] text-slate-500 uppercase">Completion_Rate</div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="w-full h-1 bg-border overflow-hidden">
              <div 
                className="h-full bg-neon shadow-[0_0_10px_rgba(0,255,102,0.5)] transition-all duration-1000" 
                style={{ width: `${progress.totalProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Units_Done" value={progress.completedLessons.length.toString()} />
            <StatCard label="Session_Time" value="12.6H" />
            <StatCard label="Accuracy_Index" value="0.88" />
            <StatCard label="Lexicon_Size" value="452" />
          </div>
        </div>

        <div className="tech-card border-neon/30 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Next_Operation</h3>
          {nextLesson ? (
            <>
              <div className="bg-neon/5 border border-neon/20 p-4 mb-6">
                <p className="text-[9px] uppercase tracking-widest text-neon font-bold mb-1 font-mono">
                  ID: {nextLesson.id} // LVL: {nextLesson.level}
                </p>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight mb-2">{nextLesson.title}</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed font-mono">{nextLesson.description}</p>
              </div>
              <button className="mt-auto btn-tech w-full">
                Initialize_Lesson
              </button>
            </>
          ) : (
            <p className="mt-auto text-slate-500 italic text-[10px] uppercase font-mono">All_Tasks_Complete</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="tech-card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Skill_Telemetry</h3>
          <div className="space-y-4">
             <div className="flex items-center gap-4 border-l-2 border-neon pl-4 py-1">
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-white uppercase tracking-tight">Writing_Efficiency_Up</p>
                  <p className="text-[10px] text-slate-500 font-mono">+15% improvement in descriptive syntax.</p>
                </div>
             </div>
             <div className="flex items-center gap-4 border-l-2 border-slate-700 pl-4 py-1">
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-white uppercase tracking-tight">Phonetic_Calibration</p>
                  <p className="text-[10px] text-slate-500 font-mono">Focus required on [ü] and [ö] frequencies.</p>
                </div>
             </div>
          </div>
        </div>
        
        <div className="tech-card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Scheduled_Simulations</h3>
          <div className="border border-border p-4 text-center bg-dark/30">
            <p className="text-[11px] font-bold text-white uppercase tracking-widest mb-1">A1_Full_Simulation</p>
            <p className="text-[10px] text-slate-500 font-mono mb-4 uppercase">T-Minus: 48:12:00</p>
            <button className="text-neon text-[10px] font-bold uppercase tracking-widest hover:underline">Reschedule_Task</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 border border-border bg-dark/50 font-mono">
    <p className="text-[9px] text-slate-500 mb-1 uppercase tracking-widest">{label}</p>
    <p className="text-base font-bold text-white">{value}</p>
  </div>
);

export default Dashboard;
