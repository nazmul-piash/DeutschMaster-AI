
import React, { useState } from 'react';
import { Lesson, ProficiencyLevel } from '../types';

interface LessonsViewProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
  userLevel: ProficiencyLevel;
}

const LessonsView: React.FC<LessonsViewProps> = ({ lessons, onSelectLesson, userLevel }) => {
  const [activeFilter, setActiveFilter] = useState<ProficiencyLevel>(userLevel);

  const filteredLessons = lessons.filter(l => l.level === activeFilter);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-main)] mb-2">Your Lessons</h1>
          <p className="text-lg text-slate-500">Explore the beauty of the German language, one step at a time.</p>
        </div>
        <div className="flex gap-3">
           <button 
            onClick={() => setActiveFilter(ProficiencyLevel.A1)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeFilter === ProficiencyLevel.A1 ? 'bg-[#4a4a32] text-white dark:bg-[#f5f5f0] dark:text-[#1a1a15] shadow-md' : 'bg-[#4a4a32]/10 text-[#4a4a32] dark:bg-white/10 dark:text-white hover:bg-[#4a4a32]/20 dark:hover:bg-white/15'}`}
           >
             A1 Beginner
           </button>
           <button 
            onClick={() => setActiveFilter(ProficiencyLevel.A2)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeFilter === ProficiencyLevel.A2 ? 'bg-[#4a4a32] text-white dark:bg-[#f5f5f0] dark:text-[#1a1a15] shadow-md' : 'bg-[#4a4a32]/10 text-[#4a4a32] dark:bg-white/10 dark:text-white hover:bg-[#4a4a32]/20 dark:hover:bg-white/15'}`}
           >
             A2 Elementary
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLessons.map((lesson) => (
          <div 
            key={lesson.id}
            onClick={() => lesson.status !== 'locked' && onSelectLesson(lesson)}
            className={`group relative card p-8 transition-all duration-300 ${
              lesson.status === 'locked' 
                ? 'opacity-40 grayscale-[40%] cursor-not-allowed bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5' 
                : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {lesson.status === 'locked' && (
              <div className="absolute top-6 right-6 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <span className="text-sm">🔒</span> Locked
              </div>
            )}
            {lesson.status === 'completed' && (
              <div className="absolute top-6 right-6 text-[#4a4a32] dark:text-emerald-400 font-extrabold text-[9px] uppercase tracking-widest flex items-center gap-1.5">
                <span className="text-sm">👑</span> Done
              </div>
            )}
            
            <div className="mb-6">
              <span className="inline-block px-3 py-1.5 bg-[#4a4a32]/10 dark:bg-white/10 text-[#4a4a32] dark:text-[#f5f5f0] text-[9px] font-black rounded-lg uppercase tracking-wider mb-4 border border-[#4a4a32]/5 dark:border-white/5">
                {lesson.level} • {lesson.topic}
              </span>
              <h3 className="text-xl font-extrabold text-[var(--text-main)] group-hover:text-[#4a4a32] dark:group-hover:text-white transition-colors leading-tight">{lesson.title}</h3>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-8 leading-relaxed font-semibold">
              {lesson.description}
            </p>

            <div className="mt-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Progress</span>
                <span className="text-sm font-bold text-brand">{lesson.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div 
                  className={`h-full transition-all duration-700 rounded-full ${lesson.status === 'completed' ? 'bg-brand shadow-sm shadow-brand/20' : 'bg-brand/40'}`}
                  style={{ width: `${lesson.progress}%` }}
                 ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonsView;
