
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    
    // Initial fetch
    const fetchProgress = async () => {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProgress;
        setUserProgress(data);
        
        // Update lessons status based on fetched progress
        setLessons(prev => prev.map(lesson => {
          if (data.completedLessons.includes(lesson.id)) {
            return { ...lesson, status: 'completed', progress: 100 };
          }
          // Unlock logic: if previous is completed, this one is available
          const index = prev.findIndex(l => l.id === lesson.id);
          if (index > 0 && data.completedLessons.includes(prev[index-1].id)) {
            return { ...lesson, status: 'available' };
          }
          return lesson;
        }));
      } else {
        // Create initial doc if it doesn't exist
        await setDoc(userDocRef, {
          uid: user.uid,
          completedLessons: [],
          examScores: {},
          totalProgress: 0,
          level: ProficiencyLevel.A1,
          updatedAt: new Date().toISOString()
        });
      }
    };

    fetchProgress();

    // Real-time listener
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserProgress(doc.data() as UserProgress);
      }
    });

    return () => unsubscribe();
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
      
      // Update Firestore
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          ...userProgress,
          completedLessons: nextCompleted,
          updatedAt: new Date().toISOString()
        }, { merge: true });
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
    await signOut(auth);
    setUser(null);
    setShowAuth(false);
    setActiveTab('dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="animate-spin h-6 w-6 border-2 border-neon border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <AuthPage />;
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
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Achievement_Database</h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Verified proficiency milestones and neural badges.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Early_Bird', 'Vocab_Master', 'Perfect_Score', 'German_Native'].map(a => (
                <div key={a} className="tech-card p-6 flex flex-col items-center border-border/50">
                   <div className="w-12 h-12 bg-neon/5 border border-neon/20 flex items-center justify-center text-2xl mb-4 grayscale">🏅</div>
                   <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">{a}</span>
                   <div className="mt-2 text-[8px] text-neon font-mono uppercase">Status: Locked</div>
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
    <div className="flex min-h-screen bg-dark font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-surface border-b border-border px-6 py-3 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">System.Status: <span className="text-neon">Active</span></h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase">User_Session: {user.email?.split('@')[0]}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase">Proficiency_Level</div>
              <div className="text-xs text-neon font-bold">{userProgress.level}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 border border-border text-[10px] font-mono text-slate-400 hover:border-neon hover:text-neon transition-all uppercase"
              title="Terminate Session"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-6">
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
