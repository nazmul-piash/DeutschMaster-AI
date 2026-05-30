
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    const localUserStr = localStorage.getItem('dm_local_user');
    if (localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        setUser(localUser);
        setAuthLoading(false);
      } catch (err) {
        console.error("Failed to parse local user session:", err);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.removeItem('dm_local_user');
      } else {
        if (!localStorage.getItem('dm_local_user')) {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Profile with Database (Firestore) or Safe Local Sandbox Storage
  useEffect(() => {
    if (!user) return;

    if (user.isLocalSession) {
      const key = `dm_profile_v2_${user.uid}`;
      const localProfileStr = localStorage.getItem(key);
      if (localProfileStr) {
        try {
          const data = JSON.parse(localProfileStr);
          setUserProgress({
            completedLessons: data.completed_lessons || [],
            examScores: data.exam_scores || {},
            totalProgress: data.total_progress || 0,
            level: (data.level as ProficiencyLevel) || ProficiencyLevel.A1,
            isAdmin: false
          });
        } catch (err) {
          console.error("Failed to parse local profile:", err);
        }
      } else {
        const initialProgress = {
          completed_lessons: [],
          exam_scores: {},
          total_progress: 0,
          level: ProficiencyLevel.A1,
          updated_at: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(initialProgress));
        setUserProgress({
          completedLessons: [],
          examScores: {},
          totalProgress: 0,
          level: ProficiencyLevel.A1,
          isAdmin: false
        });
      }
      return;
    }

    const profileRef = doc(db, 'profiles', user.uid);

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const progress: UserProgress = {
          completedLessons: data.completed_lessons || [],
          examScores: data.exam_scores || {},
          totalProgress: data.total_progress || 0,
          level: data.level as ProficiencyLevel || ProficiencyLevel.A1,
          isAdmin: data.isAdmin === true
        };
        setUserProgress(progress);
      } else {
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

  // Synchronize lessons list status with active userProgress reactive changes
  useEffect(() => {
    setLessons(prev => INITIAL_LESSONS.map((lesson, index, all) => {
      // 1. If explicitly completed, it stays completed
      if (userProgress.completedLessons.includes(lesson.id)) {
        return { ...lesson, status: 'completed' as const, progress: 100 };
      }

      // 2. If user has reached A2, all A1 lessons should be unlocked/available (not completed yet)
      if (lesson.level === ProficiencyLevel.A1 && userProgress.level === ProficiencyLevel.A2) {
        return { ...lesson, status: 'available' as const, progress: 0 };
      }

      // 3. Prevent accessing A2 if still in A1
      if (lesson.level === ProficiencyLevel.A2 && userProgress.level === ProficiencyLevel.A1) {
         return { ...lesson, status: 'locked' as const, progress: 0 };
      }

      // 4. Sequential unlocking for the current level
      const currentLevelLessons = all.filter(l => l.level === userProgress.level);
      const firstIncompleteInLevel = currentLevelLessons.find(l => !userProgress.completedLessons.includes(l.id));
      
      if (lesson.id === firstIncompleteInLevel?.id) {
        return { ...lesson, status: 'available' as const, progress: 0 };
      }

      const prevLesson = all[index - 1];
      if (prevLesson && 
          prevLesson.level === lesson.level && 
          userProgress.completedLessons.includes(prevLesson.id)) {
        return { ...lesson, status: 'available' as const, progress: 0 };
      }

      return { ...lesson, status: 'locked' as const, progress: 0 };
    }));
  }, [userProgress.completedLessons, userProgress.level]);

  // Calculate and sync progress of user levels
  useEffect(() => {
    const total = lessons.length;
    const completedCount = userProgress.completedLessons.length;
    const percentage = Math.round((completedCount / total) * 100);
    if (percentage !== userProgress.totalProgress) {
      setUserProgress(prev => ({ ...prev, totalProgress: percentage }));
    }
  }, [userProgress.completedLessons, lessons.length, userProgress.totalProgress]);

  const handleLevelUp = async (newLevel: ProficiencyLevel) => {
    if (user) {
      const updatedProgress = {
        ...userProgress,
        level: newLevel,
        updated_at: new Date().toISOString()
      };

      if (user.isLocalSession) {
        const key = `dm_profile_v2_${user.uid}`;
        localStorage.setItem(key, JSON.stringify({
          completed_lessons: userProgress.completedLessons,
          total_progress: userProgress.totalProgress,
          level: newLevel,
          exam_scores: userProgress.examScores,
          updated_at: new Date().toISOString()
        }));
        setUserProgress(updatedProgress);
        setLevelUpMessage(`Glückwunsch! You have officially reached level ${newLevel}!`);
        return;
      }

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
      const totalProgress = Math.round((nextCompleted.length / INITIAL_LESSONS.length) * 100);
      
      let nextLevel = userProgress.level;
      const a1Lessons = INITIAL_LESSONS.filter(l => l.level === ProficiencyLevel.A1);
      const completedA1 = nextCompleted.filter(id => a1Lessons.some(l => l.id === id));
      
      if (completedA1.length === a1Lessons.length && userProgress.level === ProficiencyLevel.A1) {
        nextLevel = ProficiencyLevel.A2;
        setLevelUpMessage("You've completed all A1 lessons! A2 is now unlocked.");
      }

      const updatedProgress: UserProgress = {
        ...userProgress,
        completedLessons: nextCompleted,
        totalProgress,
        level: nextLevel,
        updated_at: new Date().toISOString()
      };

      if (user) {
        if (user.isLocalSession) {
          const key = `dm_profile_v2_${user.uid}`;
          localStorage.setItem(key, JSON.stringify({
            completed_lessons: nextCompleted,
            total_progress: totalProgress,
            level: nextLevel,
            exam_scores: userProgress.examScores,
            updated_at: new Date().toISOString()
          }));
          setUserProgress(updatedProgress);
        } else {
          const profileRef = doc(db, 'profiles', user.uid);
          try {
            const updates: any = {
              completed_lessons: nextCompleted,
              total_progress: totalProgress,
              updated_at: new Date().toISOString()
            };
            if (nextLevel !== userProgress.level) {
              updates.level = nextLevel;
            }
            await updateDoc(profileRef, updates);
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `profiles/${user.uid}`);
          }
        }
      }
    }
    setSelectedLesson(null);
  };

  const handleCompleteExam = async (examLevel: ProficiencyLevel, module: string, score: number) => {
    const currentScores = userProgress.examScores[examLevel] || {};
    const nextScores = { 
      ...userProgress.examScores, 
      [examLevel]: { ...currentScores, [module]: score } 
    };

    // Standard passing requirement: Pass ALL 4 modules with 70%
    const levelScores = nextScores[examLevel];
    const allModules = ['Reading', 'Listening', 'Writing', 'Speaking'];
    const passedAllModules = allModules.every(m => levelScores[m] >= 70);

    let nextLevel = userProgress.level;
    if (examLevel === ProficiencyLevel.A1 && userProgress.level === ProficiencyLevel.A1 && passedAllModules) {
      nextLevel = ProficiencyLevel.A2;
      setLevelUpMessage(`Incredible! You passed all A1 exam modules with 70%+ scores. Level A2 is now officially unlocked!`);
    }

    const updatedProgress: UserProgress = {
      ...userProgress,
      examScores: nextScores,
      level: nextLevel,
      updated_at: new Date().toISOString()
    };

    if (user) {
      if (user.isLocalSession) {
        const key = `dm_profile_v2_${user.uid}`;
        localStorage.setItem(key, JSON.stringify({
          completed_lessons: userProgress.completedLessons,
          total_progress: userProgress.totalProgress,
          level: nextLevel,
          exam_scores: nextScores,
          updated_at: new Date().toISOString()
        }));
        setUserProgress(updatedProgress);
      } else {
        const profileRef = doc(db, 'profiles', user.uid);
        try {
          const updates: any = {
            exam_scores: nextScores,
            updated_at: new Date().toISOString()
          };
          if (nextLevel !== userProgress.level) {
            updates.level = nextLevel;
          }
          await updateDoc(profileRef, updates);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `profiles/${user.uid}`);
        }
      }
    }
  };

  const handleLogout = async () => {
    if (user && user.isLocalSession) {
      localStorage.removeItem('dm_local_user');
    } else {
      await signOut(auth);
    }
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
      return <AuthPage onBack={() => setShowAuth(false)} onLocalLogin={(localUser) => setUser(localUser)} />;
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
        return <ExamsView level={userProgress.level} examScores={userProgress.examScores} onCompleteExam={handleCompleteExam} />;
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
    <div className="flex min-h-screen bg-[var(--bg-app)] transition-colors duration-305">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-[var(--card-bg)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 md:px-8 py-3 md:py-4 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
              aria-label="Open Navigation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-md sm:text-xl text-[var(--text-main)] font-extrabold tracking-tight">Guten Tag, {user.email?.split('@')[0]}!</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Welcome back to your learning space.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="text-right">
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold">Current Level</div>
              <div className="text-brand font-black text-sm sm:text-base">{userProgress.level}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-brand transition-all uppercase tracking-widest"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
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
