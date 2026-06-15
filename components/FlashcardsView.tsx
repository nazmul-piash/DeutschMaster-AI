import React, { useState, useEffect } from 'react';
import { UserProgress, ProficiencyLevel } from '../types';
import { FLASHCARD_ITEMS, FlashcardItem } from './flashcardData';
import { motion, AnimatePresence } from 'motion/react';

interface FlashcardsViewProps {
  level: ProficiencyLevel;
  progress: UserProgress;
  onUpdateFlashcardStats: (points: number, streak: number, lastDate: string, limit: number) => Promise<void>;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  level,
  progress,
  onUpdateFlashcardStats
}) => {
  // Stats pulled from UserProgress or defaulted
  const points = progress.flashcardPoints ?? 0;
  const streak = progress.flashcardStreak ?? 0;
  const lastDate = progress.lastFlashcardDate ?? '';
  const selectedLimit = progress.flashcardSelectedLimit ?? 5; // Default to 5

  // Local component states
  const [sessionLimit, setSessionLimit] = useState<number>(selectedLimit);
  const [activeTab, setActiveTab] = useState<'word' | 'sentence' | 'article'>('word');
  
  // Choose preferred field of interests / topics (multiple select list)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'work', 'personal', 'family', 'education', 'shopping', 'small_talk'
  ]);

  const [isStudyMode, setIsStudyMode] = useState<boolean>(false);
  const [cardsToStudy, setCardsToStudy] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [streakBrokenAnnouncement, setStreakBrokenAnnouncement] = useState<boolean>(false);
  const [deductions, setDeductions] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Brand-new state for Article practice guess tracking
  const [selectedGenderGuess, setSelectedGenderGuess] = useState<string | null>(null);

  // Get current date string in local timezone (YYYY-MM-DD)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();
  const challengeCompletedToday = lastDate === todayStr;

  // On Mount: Check if they missed a day to apply streak broken deduction penalties
  useEffect(() => {
    if (lastDate && lastDate !== todayStr) {
      const lastCompleted = new Date(lastDate);
      const today = new Date(todayStr);
      // Difference in days
      const diffTime = Math.abs(today.getTime() - lastCompleted.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // If they missed at least one full day in between (diffDays > 1)
      if (diffDays > 1 && streak > 0) {
        const pointsToLose = Math.min(points, 30);
        const newPoints = Math.max(0, points - pointsToLose);
        setDeductions(pointsToLose);
        setStreakBrokenAnnouncement(true);

        // Apply penalty updates to profile
        onUpdateFlashcardStats(newPoints, 0, lastDate, sessionLimit);
      }
    }
  }, [lastDate, streak, points]);

  // Setup the random filter of flashcards based on active level, preferred categories, and mode
  const handleStartStudy = (limit: number) => {
    // Filter matching active level, chosen categories, and format
    let filtered = FLASHCARD_ITEMS.filter((item) => {
      const matchesLevel = item.level === level;
      
      // Filter by practice mode block
      let matchesType = false;
      if (activeTab === 'word') {
        matchesType = item.type === 'word';
      } else if (activeTab === 'sentence') {
        matchesType = item.type === 'sentence';
      } else if (activeTab === 'article') {
        // Article practice is exclusively for words with specified genders
        matchesType = item.type === 'word' && !!item.gender;
      }

      const matchesCategory = selectedCategories.includes(item.category);
      return matchesLevel && matchesType && matchesCategory;
    });

    // Fallback: If no cards match their exact category selection, ignore categories so they still have items to learn!
    if (filtered.length === 0) {
      filtered = FLASHCARD_ITEMS.filter((item) => {
        const matchesLevel = item.level === level;
        let matchesType = false;
        if (activeTab === 'word') {
          matchesType = item.type === 'word';
        } else if (activeTab === 'sentence') {
          matchesType = item.type === 'sentence';
        } else if (activeTab === 'article') {
          matchesType = item.type === 'word' && !!item.gender;
        }
        return matchesLevel && matchesType;
      });
    }

    // Shuffle implementation
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const sliceCount = Math.min(shuffled.length, limit);
    const selectedCards = shuffled.slice(0, sliceCount);

    setCardsToStudy(selectedCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedGenderGuess(null); // Reset interactive guesses
    setIsStudyMode(true);
  };

  // Speaks the German word or sentence using SpeechSynthesis API (German voice)
  const speakGerman = (text: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Avoid triggering card flip
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop talking if already speaking
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Navigates and evaluates progress to complete challenge
  const handleNextCard = () => {
    if (currentIndex + 1 < cardsToStudy.length) {
      setIsFlipped(false);
      setSelectedGenderGuess(null); // Reset interactive guess for next card
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    } else {
      // Finished all cards in the session! 
      let pointsAwarded = sessionLimit * 5; 
      
      // Streak calculation multiplier
      let nextStreak = streak;
      if (lastDate !== todayStr) {
        const yesterdayStr = (() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })();

        if (lastDate === yesterdayStr || lastDate === '') {
          nextStreak += 1;
        } else {
          nextStreak = 1; 
        }
      }

      // Add streak bonus
      const streakBonus = Math.min(25, nextStreak * 2);
      const totalPoints = points + pointsAwarded + streakBonus;

      onUpdateFlashcardStats(totalPoints, nextStreak, todayStr, sessionLimit);
      setIsStudyMode(false);
    }
  };

  // Helper labels for our category metadata
  const CATEGORY_CHIPS = [
    { id: 'work', label: 'Work & Jobs', icon: '💼' },
    { id: 'personal', label: 'Personal Life', icon: '🏡' },
    { id: 'family', label: 'Family & Relations', icon: '👨‍👩‍👧' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'shopping', label: 'Shopping / Dining', icon: '🛒' },
    { id: 'small_talk', label: 'Small Talk', icon: '💬' }
  ];

  return (
    <div id="flashcards-main" className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Daily Flashcards</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build your active memory! Learn tailored words, sentences, and articles matching your{' '}
            <span className="font-extrabold text-brand">{level}</span> level.
          </p>
        </div>
        
        {/* Streak & Points Widgets */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <span className="text-xl">🔥</span>
            <div>
              <div className="text-[9px] text-amber-500 uppercase font-black tracking-widest leading-none">Daily Streak</div>
              <div className="text-base font-black text-amber-700 dark:text-amber-300">{streak} {streak === 1 ? 'Day' : 'Days'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <span className="text-xl">💎</span>
            <div>
              <div className="text-[9px] text-emerald-500 uppercase font-black tracking-widest leading-none">Coins / Pts</div>
              <div className="text-base font-black text-emerald-700 dark:text-emerald-300">{points} XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Modal / Alert Banner */}
      <AnimatePresence>
        {streakBrokenAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">💔</span>
              <div>
                <h4 className="font-extrabold text-rose-800 dark:text-rose-400">Oh nein! Streak broken</h4>
                <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed max-w-xl">
                  You missed your flashcard study challenge yesterday. Your streak was reset, and you lost{' '}
                  <span className="font-extrabold text-rose-700 dark:text-rose-400">{deductions} points</span>. Keep today's challenge alive to start earning them back!
                </p>
              </div>
            </div>
            <button
              onClick={() => setStreakBrokenAnnouncement(false)}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-widest shrink-0 cursor-pointer shadow-sm transition-all"
            >
              Verify & Accept
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Flashcards Setup View */}
      {!isStudyMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Daily Gate Setup (Left Column) */}
          <div className="lg:col-span-1 card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--text-main)] mb-1">Challenge Setup</h3>
                <p className="text-xs text-slate-400">Configure how much German you can take on today.</p>
              </div>

              {/* Limit Options */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                  Daily Limit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 7, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setSessionLimit(num);
                        onUpdateFlashcardStats(points, streak, lastDate, num);
                      }}
                      className={`py-3 px-1.5 rounded-xl border font-black text-center text-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        sessionLimit === num
                          ? 'border-brand bg-brand/5 text-brand shadow-sm shadow-brand/10'
                          : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                      }`}
                    >
                      <span className="text-base font-extrabold">{num}</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold">Cards</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection block (Word vs Sentence vs Article Practice) */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                  Practice Mode Block
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-[#1a1a16] p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('word')}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl cursor-pointer transition-all ${
                      activeTab === 'word'
                        ? 'bg-white dark:bg-[#252520] text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Words
                  </button>
                  <button
                    onClick={() => setActiveTab('sentence')}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl cursor-pointer transition-all ${
                      activeTab === 'sentence'
                        ? 'bg-white dark:bg-[#252520] text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Sentences
                  </button>
                  <button
                    onClick={() => setActiveTab('article')}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl cursor-pointer transition-all ${
                      activeTab === 'article'
                        ? 'bg-white dark:bg-[#252520] text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Articles
                  </button>
                </div>
              </div>

              {/* Topics of Interest (Multi-select) */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                  Fields of Interest (Topics)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {CATEGORY_CHIPS.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedCategories.length > 1) {
                              setSelectedCategories(selectedCategories.filter(x => x !== cat.id));
                            }
                          } else {
                            setSelectedCategories([...selectedCategories, cat.id]);
                          }
                        }}
                        className={`flex items-center gap-1.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand bg-brand/5 text-slate-800 dark:text-white font-extrabold'
                            : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4">
              {challengeCompletedToday ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center border border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-xl">🏆</span>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-extrabold mt-1.5 leading-none">
                    Daily Challenge Completed!
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Streak secure. Come back tomorrow!
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => handleStartStudy(sessionLimit)}
                  className="btn-primary w-full py-4 rounded-2xl shadow-lg shadow-brand/20 cursor-pointer font-extrabold tracking-widest text-xs uppercase"
                >
                  🚀 Learn Now (+{sessionLimit * 5} XP)
                </button>
              )}
            </div>
          </div>

          {/* Method presentation list (Right Column) */}
          <div className="lg:col-span-2 card p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <span className="px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-black rounded uppercase tracking-widest">
                  Modern Pedagogy
                </span>
                <h3 className="text-2xl font-extrabold text-[var(--text-main)] mt-2">Space-Based Vocabulary Learning</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  The vocabulary section generates high-frequency keywords tailored, categorized, and contextualized specifically to your German proficiency levels.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#1c1c18] border border-slate-100 dark:border-slate-800/80">
                  <span className="text-lg">📢</span>
                  <h4 className="font-bold text-sm text-[var(--text-main)] mt-2">Targeted Fields</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Select exactly what you want to study: Work/Jobs, Personal Life, Family, Shopping, etc. Flashcards automatically adjust to highlight your favorites.
                  </p>
                </div>
                
                <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#1c1c18] border border-slate-100 dark:border-slate-800/80">
                  <span className="text-lg">🇩🇪</span>
                  <h4 className="font-bold text-sm text-[var(--text-main)] mt-2">Der, Die, Das Practice</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Master tough German genders with the Article practice mode! Guess correct articles inside cards for immediate tactile learning.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
              <span>Total available database entries: <b className="text-slate-600 dark:text-slate-300">25+ items</b></span>
              <span>Matched level: <b className="text-brand font-extrabold">{level}</b></span>
            </div>
          </div>

        </div>
      ) : (
        /* Active Study Session View */
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* Top session parameters with cancel button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsStudyMode(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              ← End Study
            </button>
            <span className="text-xs font-black text-brand bg-brand/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Card {currentIndex + 1} of {cardsToStudy.length}
            </span>
          </div>

          {/* Real-time progression slider bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cardsToStudy.length) * 100}%` }}
            ></div>
          </div>

          {/* Flashcard Component */}
          <div 
            onClick={() => {
              // Standard toggle action for words & sentences.
              if (activeTab !== 'article') {
                setIsFlipped(!isFlipped);
              } else {
                // In article mode, only allow manual flip if they have already submitted a guess
                if (selectedGenderGuess !== null) {
                  setIsFlipped(!isFlipped);
                }
              }
            }}
            className="group relative cursor-pointer w-full h-96 [perspective:1000px]"
          >
            <div
              className={`relative w-full h-full rounded-3xl duration-500 transition-all [transform-style:preserve-3d] ${
                isFlipped ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              
              {/* CARD FRONT SIDE */}
              <div className="absolute inset-0 w-full h-full rounded-2xl bg-white dark:bg-[#1a1a16] p-8 border border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-lg [backface-visibility:hidden]">
                
                {/* Upper Metadata bar */}
                <div className="flex justify-between items-center">
                  <span className="bg-brand/10 text-brand text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    DEUTSCH - {activeTab === 'article' ? 'ARTICLE PRACTICE' : 'LEVEL ' + level}
                  </span>
                  
                  {/* Speaker audio (hidden during article guess to not spoil the answer, revealed after guess) */}
                  {(activeTab !== 'article' || selectedGenderGuess !== null) && (
                    <button
                      onClick={(e) => speakGerman(cardsToStudy[currentIndex]?.german, e)}
                      className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-sm shadow-sm hover:bg-brand/10 hover:text-brand transition-all cursor-pointer select-none"
                      title="Listen Standard German Pronunciation"
                    >
                      🔊
                    </button>
                  )}
                </div>

                {/* Core content focus */}
                <div className="text-center space-y-4">
                  {activeTab === 'article' ? (
                    /* ARTICLE GENDER GUESS LAYOUT */
                    <div className="space-y-6">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-widest">
                        What is the correct article?
                      </p>
                      <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        {cardsToStudy[currentIndex]?.nounWithoutArticle ?? cardsToStudy[currentIndex]?.german.replace(/^(der|die|das)\s+/i, '')}
                      </h2>
                      <p className="text-xs font-mono text-slate-400 mt-1">
                        {cardsToStudy[currentIndex]?.pronunciation}
                      </p>
                      
                      {/* Active Buttons Panel */}
                      {selectedGenderGuess === null && (
                        <div className="flex justify-center gap-2.5 pt-4">
                          {['der', 'die', 'das'].map((genderOption) => (
                            <button
                              key={genderOption}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGenderGuess(genderOption);
                                setIsFlipped(true); // Auto-flip to show result & detailed card back
                                speakGerman(cardsToStudy[currentIndex]?.german); // Audio helper pronounces with full article
                              }}
                              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm select-none border ${
                                genderOption === 'der'
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400'
                                  : genderOption === 'die'
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
                              }`}
                            >
                              {genderOption}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* REGULAR WORD OR SENTENCE STUDY FOCUS */
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-relaxed">
                        {cardsToStudy[currentIndex]?.german}
                      </h2>
                      <p className="text-xs font-mono text-slate-400 mt-2">
                        {cardsToStudy[currentIndex]?.pronunciation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footnote hints */}
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black opacity-60">
                    {activeTab === 'article' && selectedGenderGuess === null
                      ? '⚡ Choose a matching Gender to unlock'
                      : '💡 Tap Card over to flip translation'}
                  </p>
                </div>
              </div>

              {/* CARD BACK SIDE */}
              <div className="absolute inset-0 w-full h-full rounded-2xl bg-emerald-50/10 dark:bg-[#1e1e1a] border border-emerald-100/50 dark:border-slate-800 p-8 flex flex-col justify-between shadow-lg [transform:rotateY(180deg)] [backface-visibility:hidden]">
                
                {/* Score panel for article practice results */}
                <div className="space-y-4">
                  {activeTab === 'article' && selectedGenderGuess !== null && (
                    <div>
                      {selectedGenderGuess === cardsToStudy[currentIndex]?.gender ? (
                        <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-2">
                          <span className="text-lg">🎉</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Richtig! Well done!
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-rose-500/15 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-2">
                          <span className="text-lg">❌</span>
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                            Fast! It is indeed <b className="underline font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 px-1">{cardsToStudy[currentIndex]?.gender}</b>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* English statement */}
                  <div className="text-center pt-2">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block mb-1">English Translation</span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-brand tracking-tight">
                      {cardsToStudy[currentIndex]?.english}
                    </h3>
                  </div>
                </div>

                {/* Practical vocabulary hint */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Didactic Hint</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                    💡 {cardsToStudy[currentIndex]?.hint}
                  </p>
                </div>

                {/* Example sentence widget */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Example Phrase</span>
                    <button
                      onClick={(e) => speakGerman(cardsToStudy[currentIndex]?.exampleGerman, e)}
                      className="text-xs text-slate-400 hover:text-brand cursor-pointer select-none"
                    >
                      🗣️ Play Audio
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">
                    {cardsToStudy[currentIndex]?.exampleGerman}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    {cardsToStudy[currentIndex]?.exampleEnglish}
                  </p>
                </div>

              </div>
              
            </div>
          </div>

          {/* Practice card controls footer */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                if (activeTab !== 'article' || selectedGenderGuess !== null) {
                  setIsFlipped(!isFlipped);
                }
              }}
              disabled={activeTab === 'article' && selectedGenderGuess === null}
              className={`py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
                activeTab === 'article' && selectedGenderGuess === null ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              🔄 Flip Card
            </button>
            <button
              onClick={handleNextCard}
              disabled={activeTab === 'article' && selectedGenderGuess === null}
              className={`py-3 px-4 rounded-xl bg-brand font-bold text-xs uppercase tracking-widest text-white hover:bg-brand/90 shadow-sm cursor-pointer ${
                activeTab === 'article' && selectedGenderGuess === null ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {currentIndex + 1 === cardsToStudy.length ? '🏁 Finish challenge' : 'Next Card →'}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default FlashcardsView;
