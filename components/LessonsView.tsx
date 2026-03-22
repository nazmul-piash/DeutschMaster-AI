
import React from 'react';
import { Lesson } from '../types';

interface LessonsViewProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
}

const LessonsView: React.FC<LessonsViewProps> = ({ lessons, onSelectLesson }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-main)] mb-2">Your Lessons</h1>
          <p className="text-lg text-slate-500">Explore the beauty of the German language, one step at a time.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-2 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand/20 transition-all">A1 Beginner</button>
           <button className="px-6 py-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">A2 Elementary</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lessons.map((lesson) => (
          <div 
            key={lesson.id}
            onClick={() => lesson.status !== 'locked' && onSelectLesson(lesson)}
            className={`group relative card p-8 transition-all duration-300 ${
              lesson.status === 'locked' 
                ? 'opacity-60 grayscale cursor-not-allowed bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800' 
                : 'cursor-pointer hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1'
            }`}
          >
            {lesson.status === 'locked' && (
              <div className="absolute top-6 right-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="text-lg">🔒</span> Locked
              </div>
            )}
            {lesson.status === 'completed' && (
              <div className="absolute top-6 right-6 text-brand font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                <span className="text-lg">✅</span> Done!
              </div>
            )}
            
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-brand/5 text-brand text-[10px] font-bold rounded-full uppercase tracking-widest mb-4">
                {lesson.level} • {lesson.topic}
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-brand transition-colors leading-tight">{lesson.title}</h3>
            </div>
            
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
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
