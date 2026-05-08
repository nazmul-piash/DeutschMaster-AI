
import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ProficiencyLevel, Lesson, UserProgress } from './types';
import { INITIAL_LESSONS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
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
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync with Firestore
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'profiles', user.uid);

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const progress: UserProgress = {
          completedLessons: data.completed_lessons || [],
          examScores: data.exam_scores || {},
          totalProgress: data.total_progress || 0,
          level: data.level as ProficiencyLevel || ProficiencyLevel.A1
        };
        setUserProgress(progress);
        
        // Update lessons status based on fetched progress and level
        setLessons(prev => INITIAL_LESSONS.map((lesson, index, all) => {
          // If completed
          if (progress.completedLessons.includes(lesson.id)) {
            return { ...lesson, status: 'completed' as const, progress: 100 };
          }

          // Check if lesson level is higher than user level
          if (lesson.level === ProficiencyLevel.A2 && progress.level === ProficiencyLevel.A1) {
             return { ...lesson, status: 'locked' as const, progress: 0 };
          }

          // If the level is lower than current level but not completed (shouldn't happen with strict flow, but safe)
          // it stays available or behaves naturally.

          // First incomplete lesson of the current level should be available
          const currentLevelLessons = all.filter(l => l.level === progress.level);
          const firstIncompleteInLevel = currentLevelLessons.find(l => !progress.completedLessons.includes(l.id));
          
          if (lesson.id === firstIncompleteInLevel?.id) {
            return { ...lesson, status: 'available' as const, progress: 0 };
          }

          // Unlock next lesson logic within the same level
          // A lesson is available if the previous one in the SAME LEVEL is completed
          const prevLesson = all[index - 1];
          if (prevLesson && 
              prevLesson.level === lesson.level && 
              progress.completedLessons.includes(prevLesson.id) && 
              lesson.level === progress.level) {
            return { ...lesson, status: 'available' as const, progress: 0 };
          }

          return { ...lesson, status: 'locked' as const, progress: 0 };
        }));
      } else {
        // Create initial profile if it doesn't exist
        const initialProgress = {
          completed_lessons: [],
          exam_scores: {},
          total_progress: 0,
          level: ProficiencyLevel.A1,
          updated_at: new Date().toISOString()
        };
        try {
          await setDoc(profileRef, initialProgress);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `profiles/${user.uid}`);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}`);
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

  const handleLevelUp = async (newLevel: ProficiencyLevel) => {
    if (user) {
      const profileRef = doc(db, 'profiles', user.uid);
      try {
        await updateDoc(profileRef, {
          level: newLevel,
          updated_at: new Date().toISOString()
        });
        setLevelUpMessage(`Glückwunsch! You have officially reached level ${newLevel}!`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `profiles/${user.uid}`);
      }
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!userProgress.completedLessons.includes(lessonId)) {
      const nextCompleted = [...userProgress.completedLessons, lessonId];
      
      // Update Firestore
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        try {
          const updates: any = {
            completed_lessons: nextCompleted,
            total_progress: Math.round((nextCompleted.length / INITIAL_LESSONS.length) * 100),
            updated_at: new Date().toISOString()
          };

          // Check if all A1 lessons are done to suggest leveling up
          const a1Lessons = INITIAL_LESSONS.filter(l => l.level === ProficiencyLevel.A1);
          const completedA1 = nextCompleted.filter(id => a1Lessons.some(l => l.id === id));
          
          if (completedA1.length === a1Lessons.length && userProgress.level === ProficiencyLevel.A1) {
            updates.level = ProficiencyLevel.A2;
            setLevelUpMessage("You've completed all A1 lessons! A2 is now unlocked.");
          }

          await updateDoc(profileRef, updates);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `profiles/${user.uid}`);
        }
      }
    }
    setSelectedLesson(null);
  };

  const handleCompleteExam = async (module: string, score: number) => {
    const nextScores = { ...userProgress.examScores, [module]: score };
    
    if (user) {
      const profileRef = doc(db, 'profiles', user.uid);
      try {
        const updates: any = {
          exam_scores: nextScores,
          updated_at: new Date().toISOString()
        };

        // If user passes A1 exam with high score, unlock A2
        if (userProgress.level === ProficiencyLevel.A1 && score >= 70) {
          updates.level = ProficiencyLevel.A2;
          setLevelUpMessage(`Incredible! Your exam score of ${score}% has unlocked Level A2 directly!`);
        }

        await updateDoc(profileRef, updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `profiles/${user.uid}`);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
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
        return <LessonsView lessons={lessons} onSelectLesson={setSelectedLesson} userLevel={userProgress.level} />;
      case 'practice':
        return <PracticeView level={userProgress.level} />;
      case 'exams':
        return <ExamsView level={userProgress.level} onCompleteExam={handleCompleteExam} />;
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
          <AnimatePresence>
            {levelUpMessage && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-8"
              >
                <div className="bg-brand text-white p-6 rounded-3xl shadow-xl shadow-brand/20 flex justify-between items-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                   <div className="relative z-10 flex items-center gap-4">
                     <span className="text-3xl">🎉</span>
                     <div>
                       <h4 className="font-bold text-lg">Level Up!</h4>
                       <p className="text-white/90 text-sm">{levelUpMessage}</p>
                     </div>
                   </div>
                   <button 
                    onClick={() => setLevelUpMessage(null)}
                    className="relative z-10 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                   >
                     Awesome!
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
