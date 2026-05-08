
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
  { id: 'a2-1', title: 'Das Perfekt', level: ProficiencyLevel.A2, topic: 'Conversational Past', description: 'Master the spoken past tense to share your experiences and stories.', status: 'locked', progress: 0 },
  { id: 'a2-2', title: 'Der Dativ-Fall', level: ProficiencyLevel.A2, topic: 'The Dative Case', description: 'Understand indirect objects and dative prepositions to add precision to your speech.', status: 'locked', progress: 0 },
  { id: 'a2-3', title: 'Adjektivdeklination', level: ProficiencyLevel.A2, topic: 'Adjective Endings', description: 'Decorate your nouns! Learn the rules for adjective endings in different cases.', status: 'locked', progress: 0 },
  { id: 'a2-4', title: 'Nebensätze', level: ProficiencyLevel.A2, topic: 'Subordinate Clauses', description: 'Use "weil", "dass", and "wenn" to build complex and logical sentences.', status: 'locked', progress: 0 },
  { id: 'a2-5', title: 'Formelles Schreiben', level: ProficiencyLevel.A2, topic: 'Formal Writing', description: 'Master the art of writing professional emails, letters, and applications.', status: 'locked', progress: 0 },
  { id: 'a2-6', title: 'Körper & Gesundheit', level: ProficiencyLevel.A2, topic: 'Health & Body', description: 'Learn to describe symptoms, visit the doctor, and talk about staying fit.', status: 'locked', progress: 0 },
  { id: 'a2-7', title: 'Beruf & Karriere', level: ProficiencyLevel.A2, topic: 'Work & Career', description: 'Vocabulary and phrases for the workplace, job interviews, and professional life.', status: 'locked', progress: 0 },
  { id: 'a2-8', title: 'Wohnen & Haushalt', level: ProficiencyLevel.A2, topic: 'Living & Housing', description: 'Discussing your home, finding an apartment, and describing your living space.', status: 'locked', progress: 0 },
];

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: '🏠', id: 'dashboard' },
  { label: 'Lessons', icon: '📚', id: 'lessons' },
  { label: 'Practice', icon: '💬', id: 'practice' },
  { label: 'Mock Exams', icon: '📝', id: 'exams' },
  { label: 'Achievements', icon: '🏆', id: 'achievements' },
  { label: 'Contribution', icon: '💝', id: 'contribution' },
];
