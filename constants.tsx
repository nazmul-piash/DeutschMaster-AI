
import React from 'react';
import { ProficiencyLevel, Lesson } from './types';

export const INITIAL_LESSONS: Lesson[] = [
  // A1 FOUNDATIONS
  { id: 'a1-1', title: 'Begrüßungen', level: ProficiencyLevel.A1, topic: 'Greetings & Introductions', description: 'Essential social etiquette and basic self-introduction.', status: 'available', progress: 0 },
  { id: 'a1-2', title: 'Der Artikel: Der, Die, Das', level: ProficiencyLevel.A1, topic: 'Gender & Definite Articles', description: 'The foundation of German grammar: understanding noun genders.', status: 'locked', progress: 0 },
  { id: 'a1-3', title: 'Zahlen & Uhrzeit', level: ProficiencyLevel.A1, topic: 'Numbers and Time', description: 'Cardinal/ordinal numbers and formal/informal time telling.', status: 'locked', progress: 0 },
  { id: 'a1-4', title: 'Nominativ & Akkusativ', level: ProficiencyLevel.A1, topic: 'Basic Cases', description: 'Understanding the subject and direct object in a sentence.', status: 'locked', progress: 0 },
  { id: 'a1-5', title: 'Essen & Trinken', level: ProficiencyLevel.A1, topic: 'Food and Dining', description: 'Ordering in restaurants and grocery shopping vocabulary.', status: 'locked', progress: 0 },
  
  // A2 ACADEMIC LEVEL
  { id: 'a2-1', title: 'Das Perfekt', level: ProficiencyLevel.A2, topic: 'Conversational Past', description: 'Using "haben" and "sein" to describe completed actions.', status: 'locked', progress: 0 },
  { id: 'a2-2', title: 'Dativ-Ergänzung', level: ProficiencyLevel.A2, topic: 'The Dative Case', description: 'Mastering indirect objects and dative prepositions (aus, bei, mit, nach...).', status: 'locked', progress: 0 },
  { id: 'a2-3', title: 'Adjektivdeklination', level: ProficiencyLevel.A2, topic: 'Adjective Endings', description: 'The "Final Boss" of A2: changing endings based on gender and case.', status: 'locked', progress: 0 },
  { id: 'a2-4', title: 'Nebensätze (weil, dass)', level: ProficiencyLevel.A2, topic: 'Subordinate Clauses', description: 'Complex sentence structures and verb-at-the-end rules.', status: 'locked', progress: 0 },
  { id: 'a2-5', title: 'Briefe & E-Mails', level: ProficiencyLevel.A2, topic: 'Formal Writing', description: 'Writing official letters to authorities or landlords (Goethe Part 2).', status: 'locked', progress: 0 },
  { id: 'a2-6', title: 'Körper & Gesundheit', level: ProficiencyLevel.A2, topic: 'Medical Vocabulary', description: 'Discussing symptoms and navigating a visit to the Arzt.', status: 'locked', progress: 0 },
  { id: 'a2-7', title: 'Arbeitswelt', level: ProficiencyLevel.A2, topic: 'Professional Life', description: 'Job interviews, CV vocabulary, and office communication.', status: 'locked', progress: 0 },
];

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: '🏠', id: 'dashboard' },
  { label: 'Lessons', icon: '📚', id: 'lessons' },
  { label: 'Practice', icon: '💬', id: 'practice' },
  { label: 'Mock Exams', icon: '📝', id: 'exams' },
  { label: 'Achievements', icon: '🏆', id: 'achievements' },
  { label: 'Contribution', icon: '💝', id: 'contribution' },
];
