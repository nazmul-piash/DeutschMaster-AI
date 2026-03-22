import React, { useState } from 'react';
import { supabase } from '../supabase';
import Assistant from './Assistant';

interface AuthPageProps {
  onBack: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const redirectTo = 'https://deutschmasterpro.netlify.app/';
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: redirectTo }
        });
        if (error) throw error;
        setSuccess("Check your email for the confirmation link! You must confirm your email before you can sign in.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAppleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMicrosoftAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 transition-colors duration-300">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 text-slate-400 hover:text-brand transition-all flex items-center gap-2 font-medium"
      >
        ← Back
      </button>

      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Assistant 
            message={isLogin ? "Willkommen zurück! Ready to continue your journey?" : "Hallo! Let's start your German adventure together!"} 
            mood="happy" 
          />
        </div>

        <div className="card">
          <h1 className="text-3xl text-center mb-8 text-[var(--text-main)]">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-widest">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl text-center">
                {success}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 text-base shadow-lg shadow-brand/20"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border dark:border-slate-800"></div>
              </div>
              <span className="relative px-4 bg-[var(--card-bg)] text-[10px] text-slate-400 uppercase tracking-widest font-medium">Or continue with</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={handleGoogleAuth}
                className="py-3 px-4 border border-border dark:border-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                title="Google"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              </button>
              <button 
                onClick={handleAppleAuth}
                className="py-3 px-4 border border-border dark:border-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                title="Apple"
              >
                <img src="https://www.apple.com/favicon.ico" alt="Apple" className="w-5 h-5 dark:invert" />
              </button>
              <button 
                onClick={handleMicrosoftAuth}
                className="py-3 px-4 border border-border dark:border-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                title="Microsoft"
              >
                <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-brand font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
