import React, { useState, useEffect } from 'react';
import { UserProgress, ProficiencyLevel } from '../types';
import { FLASHCARD_ITEMS, FlashcardItem } from './flashcardData';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { 
  Sparkles, 
  Play, 
  Flame, 
  Trophy, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  Volume2, 
  Plus, 
  Search, 
  BookOpen,
  Eye,
  Award
} from 'lucide-react';

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
  // Stats pulled from UserProgress
  const points = progress.flashcardPoints ?? 0;
  const streak = progress.flashcardStreak ?? 0;
  const lastDate = progress.lastFlashcardDate ?? '';

  // Local component states
  const [activeTab, setActiveTab] = useState<'word' | 'sentence' | 'article'>('word');
  const [sessionLimit, setSessionLimit] = useState<number>(10);
  
  // Choose preferred topics / filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'work', 'personal', 'family', 'education', 'shopping', 'small_talk'
  ]);

  const [activePool, setActivePool] = useState<FlashcardItem[]>([]);
  const [learnedList, setLearnedList] = useState<FlashcardItem[]>([]);
  const [isStudyMode, setIsStudyMode] = useState<boolean>(false);
  const [cardsToStudy, setCardsToStudy] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [selectedGenderGuess, setSelectedGenderGuess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Storage keys helper
  const getStorageKeys = () => {
    const userId = auth.currentUser?.uid || 'anonymous';
    return {
      active: `dm_flashcards_active_v2_${userId}`,
      learned: `dm_flashcards_learned_v2_${userId}`
    };
  };

  // Synchronize load state with localStorage AND prop bindings
  useEffect(() => {
    const keys = getStorageKeys();
    const savedActiveStr = localStorage.getItem(keys.active);
    const savedLearnedStr = localStorage.getItem(keys.learned);

    let localActive: FlashcardItem[] = savedActiveStr ? JSON.parse(savedActiveStr) : [];
    let localLearned: FlashcardItem[] = savedLearnedStr ? JSON.parse(savedLearnedStr) : [];

    const propActive: FlashcardItem[] = (progress as any).flashcards_active || [];
    const propLearned: FlashcardItem[] = (progress as any).flashcards_learned || [];

    // Merge or pick whichever contains elements
    let finalActive = localActive.length >= propActive.length ? localActive : propActive;
    let finalLearned = localLearned.length >= propLearned.length ? localLearned : propLearned;

    if (finalActive.length === 0 && finalLearned.length === 0) {
      finalActive = [...FLASHCARD_ITEMS];
    }

    setActivePool(finalActive);
    setLearnedList(finalLearned);
  }, [progress, level]);

  // Saves current lists to the browser cache and syncs asynchronously to the cloud
  const saveDecks = async (newActive: FlashcardItem[], newLearned: FlashcardItem[]) => {
    setActivePool(newActive);
    setLearnedList(newLearned);

    const keys = getStorageKeys();
    localStorage.setItem(keys.active, JSON.stringify(newActive));
    localStorage.setItem(keys.learned, JSON.stringify(newLearned));

    const currentUser = auth.currentUser;
    if (currentUser && !progress.isAdmin) {
      try {
        const profileRef = doc(db, 'profiles', currentUser.uid);
        await updateDoc(profileRef, {
          flashcards_active: newActive,
          flashcards_learned: newLearned,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Could not sync flashcards deck updates to Firestore: ", err);
      }
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Triggers Gemini AI generation to append twelve new tailored flashcards
  const handleGenerateAICards = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      showToast("✨ Gemini AI is designing custom flashcards...");
      const excludeWords = activePool.concat(learnedList).map(item => item.german);
      
      const newItems = await geminiService.generateFlashcards(
        level,
        activeTab,
        selectedCategories,
        excludeWords
      );

      if (newItems && newItems.length > 0) {
        const mergedActive = [...activePool, ...newItems];
        await saveDecks(mergedActive, learnedList);
        showToast(`🎉 Generated ${newItems.length} brand-new German flashcards!`);
      } else {
        showToast("⚠️ Standard fallbacks generated. Try again shortly!");
      }
    } catch (err) {
      console.error("AI flashcard generation failed: ", err);
      showToast("❌ Unable to connect to Gemini API. Check your connection!");
    } finally {
      setIsGenerating(false);
    }
  };

  // Setup current study deck filtered by proficiency level, tab structure, topics
  const startStudySession = () => {
    const unlearnedFiltered = activePool.filter(item => {
      const matchesLevel = item.level === level;
      const matchesCategory = selectedCategories.includes(item.category);
      
      let matchesTab = false;
      if (activeTab === 'word') {
        matchesTab = item.type === 'word';
      } else if (activeTab === 'sentence') {
        matchesTab = item.type === 'sentence';
      } else if (activeTab === 'article') {
        matchesTab = item.type === 'word' && !!item.gender;
      }

      return matchesLevel && matchesCategory && matchesTab;
    });

    if (unlearnedFiltered.length === 0) {
      showToast("⚠️ No active unlearned cards in this category! Click Generate or check your topics.");
      return;
    }

    // Shuffle the cards to keep it fresh
    const shuffled = [...unlearnedFiltered].sort(() => 0.5 - Math.random());
    const sliced = shuffled.slice(0, sessionLimit);
    setCardsToStudy(sliced);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedGenderGuess(null);
    setIsStudyMode(true);
  };

  // Native iOS speech synthesis to read standard accent German
  const playGermanSpeech = (text: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Handle marked as learned (permanent removal from pool)
  const handleRemoveCard = async (item: FlashcardItem) => {
    // Remove from active pool, move to learned list
    const filteredActive = activePool.filter(x => x.id !== item.id);
    const updatedLearned = [item, ...learnedList.filter(x => x.id !== item.id)];
    
    await saveDecks(filteredActive, updatedLearned);

    // Reward points for mastering the card
    const pointsGained = 5;
    const currentToday = new Date().toISOString().split('T')[0];
    const newPoints = points + pointsGained;
    
    // Simple streak increment helper if done on a new day
    let nextStreak = streak;
    if (lastDate !== currentToday) {
      nextStreak = streak + 1;
    }

    await onUpdateFlashcardStats(newPoints, nextStreak, currentToday, 5);
    showToast(`🎓 Card Mastery unlocked! +${pointsGained} XP`);

    // Advance to next card or trigger success state if deck finishes
    if (currentIndex + 1 < cardsToStudy.length) {
      setIsFlipped(false);
      setSelectedGenderGuess(null);
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished all cards in active session!
      setIsStudyMode(false);
      showToast("🏆 Amazing! You completed this study round!");
    }
  };

  // Navigates to another card in active queue without removing it (keeping in rotation)
  const handleKeepPracticing = () => {
    if (currentIndex + 1 < cardsToStudy.length) {
      setIsFlipped(false);
      setSelectedGenderGuess(null);
      setCurrentIndex(prev => prev + 1);
    } else {
      // Circle back or exit
      setIsStudyMode(false);
      showToast("📝 Practice finished! Try generating more cards.");
    }
  };

  // Restore learned card back to active practice pool
  const restoreToPracticePool = async (item: FlashcardItem) => {
    const updatedLearned = learnedList.filter(x => x.id !== item.id);
    const updatedActive = [...activePool.filter(x => x.id !== item.id), item];
    
    await saveDecks(updatedActive, updatedLearned);
    showToast("⏪ Re-added card to active practice rotation!");
  };

  // Filter current active/learned cards count for displaying stats
  const activeCount = activePool.filter(item => {
    const matchesLevel = item.level === level;
    let matchesTab = false;
    if (activeTab === 'word') matchesTab = item.type === 'word';
    else if (activeTab === 'sentence') matchesTab = item.type === 'sentence';
    else if (activeTab === 'article') matchesTab = item.type === 'word' && !!item.gender;
    return matchesLevel && matchesTab;
  }).length;

  const learnedCount = learnedList.filter(item => {
    const matchesLevel = item.level === level;
    let matchesTab = false;
    if (activeTab === 'word') matchesTab = item.type === 'word';
    else if (activeTab === 'sentence') matchesTab = item.type === 'sentence';
    else if (activeTab === 'article') matchesTab = item.type === 'word' && !!item.gender;
    return matchesLevel && matchesTab;
  }).length;

  const CATEGORIES = [
    { id: 'work', label: 'Work', icon: '💼' },
    { id: 'personal', label: 'Personal', icon: '🏡' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'shopping', label: 'Shopping', icon: '🛒' },
    { id: 'small_talk', label: 'Small Talk', icon: '💬' }
  ];

  return (
    <div id="flashcards-ios-root" className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Toast Alert Indicator */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-805/30 shadow-xl flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white"
          >
            <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info Banner: Real-time status in beautiful translucent card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 dark:bg-[#1c1c1e]/50 backdrop-blur-md rounded-3xl p-6 border border-zinc-200/40 dark:border-white/5 shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-black tracking-widest text-brand bg-brand/10 px-2.5 py-1 rounded-full">
            German Smart Flashcards • Level {level}
          </span>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight pt-1">
            German Active Memory
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-450">
            Study unlimited vocabularies, conversational sentences, and genders dynamically created by Google Gemini.
          </p>
        </div>

        {/* Apple-style translucent stats boxes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-amber-50/50 dark:bg-amber-950/15 px-4 py-2 rounded-2xl border border-amber-100/55 dark:border-amber-900/20">
            <Flame className="h-5 w-5 text-amber-500" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-amber-500 font-black leading-none">Streak</div>
              <div className="text-sm font-black text-amber-700 dark:text-amber-400">{streak} {streak === 1 ? 'day' : 'days'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-emerald-50/50 dark:bg-emerald-950/15 px-4 py-2 rounded-2xl border border-emerald-100/55 dark:border-emerald-900/20">
            <Trophy className="h-5 w-5 text-emerald-500" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-emerald-500 font-black leading-none">Points</div>
              <div className="text-sm font-black text-emerald-700 dark:text-emerald-450">{points} XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* SETUP & CONTROL CONTAINER */}
      {!isStudyMode ? (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-400">
          
          {/* Main Action Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Topic Filter Sidebar */}
            <div className="lg:col-span-1 bg-white/40 dark:bg-[#1a1a1c]/40 backdrop-blur-lg rounded-3xl p-6 border border-zinc-200/50 dark:border-white/5 space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Category Filter
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Select topics you want to prioritize.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {CATEGORIES.map((cat) => {
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
                      className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand/40 bg-brand/5 text-brand font-extrabold'
                          : 'border-zinc-200/40 dark:border-white/5 text-zinc-450 hover:text-zinc-800 hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10'
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-zinc-200/50 dark:border-white/5 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-450">Active Deck:</span>
                  <span className="font-extrabold text-zinc-800 dark:text-white">{activeCount} cards</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-450">Learned Deck:</span>
                  <span className="font-extrabold text-emerald-650 dark:text-emerald-450">{learnedCount} mastered</span>
                </div>
              </div>
            </div>

            {/* Practical Practice Launcher Box */}
            <div className="lg:col-span-2 bg-gradient-to-tr from-white/70 to-zinc-50/50 dark:from-[#18181b]/70 dark:to-[#222225]/40 backdrop-blur-xl rounded-3xl p-8 border border-zinc-200/55 dark:border-white/5 flex flex-col justify-between space-y-6">
              
              {/* Type Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Practice Mode</h3>
                    <p className="text-xs text-zinc-500">Pick what aspect of German to train currently.</p>
                  </div>
                  
                  {/* Glass iOS Tab selector */}
                  <div className="flex bg-zinc-100/80 dark:bg-zinc-800/30 p-1 rounded-2xl border border-zinc-200/40 dark:border-white/5">
                    {(['word', 'sentence', 'article'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === tab
                            ? 'bg-white dark:bg-[#2e2e33] text-zinc-900 dark:text-white shadow-sm font-black'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100'
                        }`}
                      >
                        {tab === 'word' ? 'Words' : tab === 'sentence' ? 'Phrases' : 'Genders'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtitle description */}
                <div className="rounded-2xl bg-zinc-100/50 dark:bg-zinc-800/20 p-4 border border-zinc-200/30 dark:border-white/5 text-xs text-zinc-500 dark:text-zinc-400">
                  {activeTab === 'word' && (
                    <p>💡 <strong>Word mode</strong> exercises your memory on essential German articles, nouns, verbs, and pronouns customized for daily communication.</p>
                  )}
                  {activeTab === 'sentence' && (
                    <p>💬 <strong>Sentence mode</strong> highlights natural phrases commonly spoken in street conversation, formal settings, or workplace dialogues.</p>
                  )}
                  {activeTab === 'article' && (
                    <p>🇩🇪 <strong>Gender mode</strong> tackles the core challenge of learning German: identifying whether a noun is <em>der</em>, <em>die</em>, or <em>das</em> through instant visual exercises.</p>
                  )}
                </div>

                {/* Session Limit Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 block">
                    Session Card Limit
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[3, 5, 7, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSessionLimit(num)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          sessionLimit === num
                            ? 'bg-[#18181b] border-[#18181b] text-white dark:bg-white dark:border-white dark:text-zinc-900 font-extrabold shadow-sm'
                            : 'bg-white/40 dark:bg-zinc-800/10 border-zinc-200/40 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white hover:bg-zinc-100/30'
                        }`}
                      >
                        {num} Cards
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSessionLimit(9999)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        sessionLimit === 9999
                          ? 'bg-[#18181b] border-[#18181b] text-white dark:bg-white dark:border-white dark:text-zinc-900 font-extrabold shadow-sm'
                          : 'bg-white/40 dark:bg-zinc-800/10 border-zinc-200/40 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white hover:bg-zinc-100/30'
                      }`}
                    >
                      All ({activeCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-200/40 dark:border-white/5">
                
                {/* AI Generation button */}
                <button
                  type="button"
                  onClick={handleGenerateAICards}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-553 hover:to-indigo-553 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/10 active:scale-95 select-none"
                >
                  <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Generating...' : '✨ Generate 12 AI Cards'}</span>
                </button>

                {/* Launcher button */}
                <button
                  type="button"
                  onClick={startStudySession}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:brightness-110 text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-zinc-500/10 active:scale-95 select-none"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Learning ({activeCount})</span>
                </button>

              </div>
            </div>
            
          </div>

          {/* ACTIVE PRACTICE POOL (Preview unmastered cards list) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-white">
                  Active Practice Deck ({activeCount})
                </h3>
                <p className="text-xs text-zinc-400">Cards scheduled for review. Study and tap "Remove" as you memorize them!</p>
              </div>
            </div>

            {activeCount === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-white/10 p-12 text-center text-zinc-400 space-y-3">
                <p className="text-sm font-semibold">Active storage is clean or empty!</p>
                <button
                  onClick={handleGenerateAICards}
                  className="px-4 py-2 border border-brand text-brand hover:bg-brand/5 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer transition-all"
                >
                  ✨ Seed with 12 AI Flashcards
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activePool
                  .filter(item => {
                    const matchesLevel = item.level === level;
                    let matchesTab = false;
                    if (activeTab === 'word') matchesTab = item.type === 'word';
                    else if (activeTab === 'sentence') matchesTab = item.type === 'sentence';
                    else if (activeTab === 'article') matchesTab = item.type === 'word' && !!item.gender;
                    return matchesLevel && matchesTab;
                  })
                  .slice(0, 6)
                  .map(item => (
                    <div
                      key={item.id}
                      className="bg-white/45 dark:bg-zinc-900/40 rounded-2xl p-4 border border-zinc-200/50 dark:border-white/5 space-y-2 relative group hover:border-zinc-300 dark:hover:border-white/10 transition-all shadow-sm"
                    >
                      <span className="absolute top-3 right-3 text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-600">
                        {item.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                        {item.german}
                      </h4>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        {item.english}
                      </p>
                      <button
                        onClick={() => playGermanSpeech(item.german)}
                        className="text-[10px] text-zinc-400 hover:text-brand flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <Volume2 className="h-3 w-3" /> Listen
                      </button>
                    </div>
                  ))}
                {activeCount > 6 && (
                  <div className="sm:col-span-2 md:col-span-3 text-center text-xs text-zinc-400 font-medium py-2">
                    ...and {activeCount - 6} more cards waiting in search or practice loops!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MASTERED LEARNED CARDS LIST (Manage Mastered vocabulary) */}
          <div className="space-y-4 pt-4 border-t border-zinc-200/40 dark:border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-white">
                  Mastered Vocabulary ({learnedCount})
                </h3>
                <p className="text-xs text-zinc-450">Congratulations on mastering these! Click "Re-Practice" to add back anytime.</p>
              </div>

              {/* Fast filter */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter mastered words..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-100/80 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-white/5 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand focus:border-transparent transition-all"
                />
              </div>
            </div>

            {learnedCount === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-white/10 p-12 text-center text-zinc-400">
                <p className="text-xs">No learned words yet. Study cards and press the "Remove" button to master your first word!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {learnedList
                  .filter(item => {
                    const matchesLevel = item.level === level;
                    let matchesTab = false;
                    if (activeTab === 'word') matchesTab = item.type === 'word';
                    else if (activeTab === 'sentence') matchesTab = item.type === 'sentence';
                    else if (activeTab === 'article') matchesTab = item.type === 'word' && !!item.gender;

                    const matchesSearch = item.german.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          item.english.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchesLevel && matchesTab && matchesSearch;
                  })
                  .slice(0, 15)
                  .map(item => (
                    <div
                      key={item.id}
                      className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] hover:bg-emerald-500/[0.06] rounded-2xl p-4 border border-emerald-500/10 hover:border-emerald-500/20 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-505 dark:text-emerald-450 shrink-0" />
                          <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-250 leading-none">
                            {item.german}
                          </h4>
                        </div>
                        <p className="text-[11px] text-zinc-450 dark:text-zinc-500 italic pl-5">
                          {item.english}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => restoreToPracticePool(item)}
                        title="Re-add this item to active practice pool"
                        className="py-1.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-brand/10 hover:text-brand transition-all cursor-pointer text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 select-none shrink-0"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Re-Practice</span>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ACTIVE FLASHCARD STUDY ROUND (Apple-inspired translucent card interface) */
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* Active Navigation Header */}
          <div className="flex items-center justify-between bg-zinc-100/50 dark:bg-[#1a1a1c]/30 backdrop-blur-md px-4 py-3.5 rounded-2xl border border-zinc-200/40 dark:border-white/5">
            <button
              onClick={() => setIsStudyMode(false)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer select-none"
            >
              <X className="h-3.5 w-3.5" /> End Study Session
            </button>
            <span className="text-xs font-black text-brand uppercase tracking-wider bg-brand/5 px-2.5 py-1 rounded-full">
              Card {currentIndex + 1} of {cardsToStudy.length}
            </span>
          </div>

          {/* Mini Progression Indicator */}
          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cardsToStudy.length) * 100}%` }}
            ></div>
          </div>

          {/* Dual-sided visual touch card */}
          <div 
            onClick={() => {
              if (activeTab !== 'article') {
                setIsFlipped(!isFlipped);
              } else {
                if (selectedGenderGuess !== null) {
                  setIsFlipped(!isFlipped);
                }
              }
            }}
            className="group relative cursor-pointer w-full h-[26rem] [perspective:1000px] select-none"
          >
            <div
              className={`relative w-full h-full rounded-3xl duration-500 transition-all [transform-style:preserve-3d] ${
                isFlipped ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              
              {/* CARD FRONT BLOCK */}
              <div className="absolute inset-0 w-full h-full rounded-3xl bg-white dark:bg-[#18181b]/95 p-8 border border-zinc-200/60 dark:border-white/5 flex flex-col justify-between shadow-xl [backface-visibility:hidden]">
                
                {/* Upper parameters metadata */}
                <div className="flex justify-between items-center">
                  <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest">
                    🇩🇪 Deutsch • {activeTab === 'article' ? 'Guess the Article' : activeTab.toUpperCase()}
                  </span>
                  
                  {/* Speakers (reveal in article style only post-guess) */}
                  {(activeTab !== 'article' || selectedGenderGuess !== null) && (
                    <button
                      onClick={(e) => playGermanSpeech(cardsToStudy[currentIndex]?.german, e)}
                      className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-brand hover:bg-brand/10 transition-all cursor-pointer shadow-sm"
                      title="Learn German Pronunciation"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Core Focus Content */}
                <div className="text-center space-y-3 px-2">
                  {activeTab === 'article' ? (
                    <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">
                        Choose the correct definite article
                      </p>
                      <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        {cardsToStudy[currentIndex]?.nounWithoutArticle ?? cardsToStudy[currentIndex]?.german.replace(/^(der|die|das)\s+/i, '')}
                      </h2>
                      <p className="text-xs font-medium font-mono text-zinc-400">
                        {cardsToStudy[currentIndex]?.pronunciation}
                      </p>

                      {/* Interactive guess tiles */}
                      {selectedGenderGuess === null && (
                        <div className="flex justify-center gap-3 pt-4">
                          {['der', 'die', 'das'].map((option) => (
                            <button
                              key={option}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGenderGuess(option);
                                setIsFlipped(true);
                                playGermanSpeech(cardsToStudy[currentIndex]?.german);
                              }}
                              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer active:scale-95 text-center ${
                                option === 'der'
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400'
                                  : option === 'die'
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-relaxed">
                        {cardsToStudy[currentIndex]?.german}
                      </h2>
                      <p className="text-xs font-mono text-zinc-400">
                        {cardsToStudy[currentIndex]?.pronunciation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Tip */}
                <div className="text-center">
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest inline-flex items-center gap-1.5 opacity-60">
                    <RefreshCw className="h-3 w-3" />
                    {activeTab === 'article' && selectedGenderGuess === null
                      ? 'Submit a guess to unlock details/translation'
                      : 'Tap here anywhere to flip card translation'}
                  </span>
                </div>
              </div>

              {/* CARD BACK SIDE */}
              <div className="absolute inset-0 w-full h-full rounded-3xl bg-zinc-50/90 dark:bg-[#1a1a1f]/95 p-8 border border-zinc-250 dark:border-white/5 flex flex-col justify-between shadow-xl [transform:rotateY(180deg)] [backface-visibility:hidden]">
                
                {/* Gender validation review block */}
                <div className="space-y-4">
                  {activeTab === 'article' && selectedGenderGuess !== null && (
                    <div>
                      {selectedGenderGuess === cardsToStudy[currentIndex]?.gender ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-1.5">
                          <Check className="h-4 w-4 text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                            Richtig! Well done!
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-1.5">
                          <X className="h-4 w-4 text-rose-505" />
                          <span className="text-[10px] font-black text-rose-600 dark:text-rose-450 uppercase tracking-widest leading-none">
                            Incorrect. It is indeed <b className="font-extrabold underline uppercase ml-1 text-rose-700 dark:text-rose-350">{cardsToStudy[currentIndex]?.gender}</b>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">English Translation</span>
                    <h3 className="text-2xl font-black text-brand tracking-tight">
                      {cardsToStudy[currentIndex]?.english}
                    </h3>
                  </div>
                </div>

                {/* Didactic Hint */}
                <div className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-white/5 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold block">Didactic Hint</span>
                  <p className="text-zinc-650 dark:text-zinc-300 italic mt-1 leading-relaxed">
                    💡 {cardsToStudy[currentIndex]?.hint}
                  </p>
                </div>

                {/* Illustrative German sentences example context */}
                <div className="p-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-800/40 border border-zinc-200/40 dark:border-white/5 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] uppercase tracking-wider text-teal-605 font-bold">Example Dialogue</span>
                    <button
                      type="button"
                      onClick={(e) => playGermanSpeech(cardsToStudy[currentIndex]?.exampleGerman, e)}
                      className="text-[10px] text-zinc-450 hover:text-brand flex items-center gap-0.5 cursor-pointer select-none"
                    >
                      <Volume2 className="h-3 w-3" /> Speak
                    </button>
                  </div>
                  <p className="font-extrabold text-zinc-900 dark:text-white leading-relaxed">
                    {cardsToStudy[currentIndex]?.exampleGerman}
                  </p>
                  <p className="text-[11px] text-zinc-400 italic">
                    {cardsToStudy[currentIndex]?.exampleEnglish}
                  </p>
                </div>

              </div>

            </div>
          </div>

          {/* CARD ACTION CONTROLS FLOOR */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Action 1: KEEP PRACTICING (NEXT) */}
            <button
              onClick={handleKeepPracticing}
              disabled={activeTab === 'article' && selectedGenderGuess === null}
              className={`py-4 px-6 rounded-2xl border border-zinc-300 dark:border-zinc-800 font-extrabold text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 transition-all cursor-pointer shadow-sm text-center ${
                activeTab === 'article' && selectedGenderGuess === null ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              🔄 Keep Practicing
            </button>

            {/* Action 2: REMOVE (Learned permanent mastery) */}
            <button
              onClick={() => handleRemoveCard(cardsToStudy[currentIndex])}
              disabled={activeTab === 'article' && selectedGenderGuess === null}
              className={`py-4 px-6 rounded-2xl bg-brand text-white font-extrabold text-xs uppercase tracking-widest hover:brightness-105 transition-all cursor-pointer shadow-md shadow-brand/10 text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'article' && selectedGenderGuess === null ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Learn & Remove</span>
            </button>

          </div>

        </div>
      )}

    </div>
  );
};

export default FlashcardsView;
