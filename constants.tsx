
import React from 'react';
import { ProficiencyLevel, Lesson } from './types';

export const INITIAL_LESSONS: Lesson[] = [
  // A1 BEGINNER
  { id: 'a1-1', title: 'Begrüßungen', level: ProficiencyLevel.A1, topic: 'Greetings & Introductions', description: 'Learn how to say hello and introduce yourself to new friends!', status: 'available', progress: 0 },
  { id: 'a1-2', title: 'Der Artikel: Der, Die, Das', level: ProficiencyLevel.A1, topic: 'Gender & Definite Articles', description: 'The heart of German grammar: getting to know noun genders.', status: 'locked', progress: 0 },
  { id: 'a1-3', title: 'Zahlen & Uhrzeit', level: ProficiencyLevel.A1, topic: 'Numbers and Time', description: 'Counting and telling time for your daily adventures.', status: 'locked', progress: 0 },
  { id: 'a1-4', title: 'Nominativ & Akkusativ', level: ProficiencyLevel.A1, topic: 'Basic Cases', description: 'Building your first complete sentences with confidence.', status: 'locked', progress: 0 },
  { id: 'a1-5', title: 'Essen & Trinken', level: ProficiencyLevel.A1, topic: 'Food and Dining', description: 'Ordering your favorite treats at a cozy German café.', status: 'locked', progress: 0 },
  
  // A2 ELEMENTARY
  { id: 'a2-1', title: 'Das Perfekt', level: ProficiencyLevel.A2, topic: 'Conversational Past', description: 'Sharing stories about your wonderful experiences.', status: 'locked', progress: 0 },
  { id: 'a2-2', title: 'Dativ-Ergänzung', level: ProficiencyLevel.A2, topic: 'The Dative Case', description: 'Adding more detail and color to your conversations.', status: 'locked', progress: 0 },
  { id: 'a2-3', title: 'Adjektivdeklination', level: ProficiencyLevel.A2, topic: 'Adjective Endings', description: 'Describing the world around you with beautiful adjectives.', status: 'locked', progress: 0 },
  { id: 'a2-4', title: 'Nebensätze (weil, dass)', level: ProficiencyLevel.A2, topic: 'Subordinate Clauses', description: 'Expressing your thoughts and reasons more clearly.', status: 'locked', progress: 0 },
  { id: 'a2-5', title: 'Briefe & E-Mails', level: ProficiencyLevel.A2, topic: 'Writing Skills', description: 'Writing heartfelt messages to friends and colleagues.', status: 'locked', progress: 0 },
  { id: 'a2-6', title: 'Körper & Gesundheit', level: ProficiencyLevel.A2, topic: 'Health & Wellness', description: 'Taking care of yourself and talking about well-being.', status: 'locked', progress: 0 },
  { id: 'a2-7', title: 'Arbeitswelt', level: ProficiencyLevel.A2, topic: 'Dream Jobs', description: 'Exploring career paths and professional dreams.', status: 'locked', progress: 0 },
];

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: '🏠', id: 'dashboard' },
  { label: 'Lessons', icon: '📚', id: 'lessons' },
  { label: 'Practice', icon: '💬', id: 'practice' },
  { label: 'Mock Exams', icon: '📝', id: 'exams' },
  { label: 'Achievements', icon: '🏆', id: 'achievements' },
  { label: 'Contribution', icon: '💝', id: 'contribution' },
];
