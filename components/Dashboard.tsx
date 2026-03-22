
import React from 'react';
import { UserProgress, Lesson } from '../types';

interface DashboardProps {
  progress: UserProgress;
  lessons: Lesson[];
}

const Dashboard: React.FC<DashboardProps> = ({ progress, lessons }) => {
  const nextLesson = lessons.find(l => l.status === 'available');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-bold text-[var(--text-main)]">Your Progress</h3>
              <p className="text-sm text-slate-500 mt-1">You're doing great! Keep up the good work.</p>
            </div>
            <div className="text-right">
              <span className="text-brand text-4xl font-bold">{progress.totalProgress}%</span>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Completed</div>
            </div>
          </div>
          
          <div className="mb-10">
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand rounded-full transition-all duration-1000 shadow-lg shadow-brand/20" 
                style={{ width: `${progress.totalProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Lessons Done" value={progress.completedLessons.length.toString()} icon="📖" />
            <StatCard label="Study Time" value="12.6 hrs" icon="⏳" />
            <StatCard label="Accuracy" value="88%" icon="🎯" />
            <StatCard label="Words Learned" value="452" icon="🔤" />
          </div>
        </div>

        <div className="card border-brand/20 bg-brand/5 flex flex-col p-8">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-6">Ready for your next step?</h3>
          {nextLesson ? (
            <>
              <div className="bg-[var(--card-bg)] rounded-2xl p-6 mb-8 shadow-sm border border-brand/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded uppercase tracking-widest">
                    Level {nextLesson.level}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-[var(--text-main)] mb-2">{nextLesson.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{nextLesson.description}</p>
              </div>
              <button className="mt-auto btn-primary w-full py-4 shadow-lg shadow-brand/20">
                Start Lesson
              </button>
            </>
          ) : (
            <div className="mt-auto text-center py-8">
              <p className="text-slate-500 italic text-sm">You've completed all available lessons! 🎉</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-8">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-6">Recent Achievements</h3>
          <div className="space-y-6">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl shrink-0">✨</div>
                <div>
                  <p className="font-bold text-[var(--text-main)]">Writing Star</p>
                  <p className="text-sm text-slate-500">Your descriptive sentences are getting much better!</p>
                </div>
             </div>
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl shrink-0">🗣️</div>
                <div>
                  <p className="font-bold text-[var(--text-main)]">Pronunciation Focus</p>
                  <p className="text-sm text-slate-500">Let's practice those [ü] and [ö] sounds in the next session.</p>
                </div>
             </div>
          </div>
        </div>
        
        <div className="card p-8 flex flex-col justify-center items-center text-center bg-slate-50/50 dark:bg-slate-800/20">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-3xl mb-4">🏆</div>
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Upcoming Milestone</h3>
          <p className="text-sm text-slate-500 mb-6">You're only 3 lessons away from completing the A1 Basics!</p>
          <button className="text-brand font-bold text-sm hover:underline">View Learning Path</button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
    <div className="text-xl mb-2">{icon}</div>
    <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-bold">{label}</p>
    <p className="text-xl font-bold text-[var(--text-main)]">{value}</p>
  </div>
);

export default Dashboard;
