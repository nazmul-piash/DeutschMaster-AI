
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { ProficiencyLevel, Lesson, UserProgress } from './types';
import { INITIAL_LESSONS } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LessonsView from './components/LessonsView';
import PracticeView from './components/PracticeView';
import ExamsView from './components/ExamsView';
import LessonModal from './components/LessonModal';
import ContributionView from './components/ContributionView';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedLessons: [],
    examScores: {},
    totalProgress: 0,
    level: ProficiencyLevel.A1
  });
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync with Supabase
  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create initial profile if it doesn't exist
        const initialProgress = {
          id: user.id,
          completed_lessons: [],
          exam_scores: {},
          total_progress: 0,
          level: ProficiencyLevel.A1,
          updated_at: new Date().toISOString()
        };
        await supabase.from('profiles').insert([initialProgress]);
        setUserProgress({
          completedLessons: [],
          examScores: {},
          totalProgress: 0,
          level: ProficiencyLevel.A1
        });
      } else if (data) {
        const progress: UserProgress = {
          completedLessons: data.completed_lessons || [],
          examScores: data.exam_scores || {},
          totalProgress: data.total_progress || 0,
          level: data.level as ProficiencyLevel || ProficiencyLevel.A1
        };
        setUserProgress(progress);
        
        // Update lessons status based on fetched progress
        setLessons(prev => prev.map(lesson => {
          if (progress.completedLessons.includes(lesson.id)) {
            return { ...lesson, status: 'completed', progress: 100 };
          }
          const index = prev.findIndex(l => l.id === lesson.id);
          if (index > 0 && progress.completedLessons.includes(prev[index-1].id)) {
            return { ...lesson, status: 'available' };
          }
          return lesson;
        }));
      }
    };

    fetchProgress();

    // Real-time listener for profiles
    const channel = supabase
      .channel('profile_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        const data = payload.new;
        setUserProgress({
          completedLessons: data.completed_lessons || [],
          examScores: data.exam_scores || {},
          totalProgress: data.total_progress || 0,
          level: data.level as ProficiencyLevel || ProficiencyLevel.A1
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Calculate progress whenever completedLessons changes
  useEffect(() => {
    const total = lessons.length;
    const completedCount = userProgress.completedLessons.length;
    const percentage = Math.round((completedCount / total) * 100);
    setUserProgress(prev => ({ ...prev, totalProgress: percentage }));
  }, [userProgress.completedLessons, lessons.length]);

  const handleCompleteLesson = async (lessonId: string) => {
    if (!userProgress.completedLessons.includes(lessonId)) {
      const nextCompleted = [...userProgress.completedLessons, lessonId];
      
      // Update local state
      setUserProgress(prev => ({ ...prev, completedLessons: nextCompleted }));
      
      // Update Supabase
      if (user) {
        await supabase
          .from('profiles')
          .update({
            completed_lessons: nextCompleted,
            total_progress: Math.round((nextCompleted.length / lessons.length) * 100),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      // Unlock next lesson logic
      setLessons(prev => {
        const index = prev.findIndex(l => l.id === lessonId);
        const updated = [...prev];
        updated[index] = { ...updated[index], status: 'completed', progress: 100 };
        if (updated[index + 1]) {
          updated[index + 1] = { ...updated[index + 1], status: 'available' };
        }
        return updated;
      });
    }
    setSelectedLesson(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowAuth(false);
    setActiveTab('dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <AuthPage onBack={() => setShowAuth(false)} />;
    }
    return <LandingPage onStart={() => setShowAuth(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard progress={userProgress} lessons={lessons} />;
      case 'lessons':
        return <LessonsView lessons={lessons} onSelectLesson={setSelectedLesson} />;
      case 'practice':
        return <PracticeView level={userProgress.level} />;
      case 'exams':
        return <ExamsView level={userProgress.level} onCompleteExam={(score) => console.log('Exam Score:', score)} />;
      case 'contribution':
        return <ContributionView />;
      case 'achievements':
        return (
          <div className="animate-in fade-in duration-700">
            <div className="mb-10">
              <h1 className="text-4xl mb-2">Your Achievements</h1>
              <p className="text-slate-500">Celebrate your milestones on the journey to German fluency.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {['Early Bird', 'Vocab Master', 'Perfect Score', 'German Native'].map(a => (
                <div key={a} className="card flex flex-col items-center text-center">
                   <div className="w-16 h-16 bg-brand/5 rounded-full flex items-center justify-center text-3xl mb-4">🏅</div>
                   <h3 className="text-xl mb-1">{a}</h3>
                   <p className="text-sm text-slate-400">Keep learning to unlock this badge!</p>
                   <div className="mt-4 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-medium uppercase tracking-wider text-slate-500">Locked</div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <Dashboard progress={userProgress} lessons={lessons} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] transition-colors duration-300">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-[var(--card-bg)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-8 py-4 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
          <div>
            <h2 className="text-xl text-[var(--text-main)]">Guten Tag, {user.email?.split('@')[0]}!</h2>
            <p className="text-xs text-slate-500">Welcome back to your learning space.</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Current Level</div>
              <div className="text-brand font-bold">{userProgress.level}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs font-medium text-slate-400 hover:text-brand transition-all uppercase tracking-widest"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-8">
          {renderContent()}
        </div>
      </main>

      {selectedLesson && (
        <LessonModal 
          lesson={selectedLesson} 
          onClose={() => setSelectedLesson(null)} 
          onComplete={() => handleCompleteLesson(selectedLesson.id)} 
        />
      )}
    </div>
  );
};

export default App;
