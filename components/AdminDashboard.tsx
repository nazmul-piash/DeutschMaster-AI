import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Key, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Clock, 
  Copy, 
  ExternalLink, 
  Search,
  BookOpen
} from 'lucide-react';

interface InvitationCodeData {
  id: string; // The code itself (uppercase)
  active: boolean;
  notes: string;
  created_at: string;
}

const PREDEFINED_CODES = [
  'DEUTSCH2026',
  'BERLIN99',
  'GOETHE_A1',
  'TELC_A2',
  'VIP_GERMAN',
  'ADMIN_PORTAL',
  'AI_STUDIO'
];

const AdminDashboard: React.FC = () => {
  const [codes, setCodes] = useState<InvitationCodeData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load codes dynamically from Firestore
  useEffect(() => {
    const codesRef = collection(db, 'invitation_codes');
    const unsubscribe = onSnapshot(codesRef, (snapshot) => {
      const fetchedCodes: InvitationCodeData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedCodes.push({
          id: docSnap.id,
          active: data.active !== false,
          notes: data.notes || '',
          created_at: data.created_at || new Date().toISOString()
        });
      });
      // Sort: recently created first
      fetchedCodes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCodes(fetchedCodes);
    }, (err) => {
      console.error("Error loading invitation codes:", err);
      setError("Unable to load live invitation codes. Ensure Firestore rules are deployed.");
    });

    return () => unsubscribe();
  }, []);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formattedCode = newCode.trim().toUpperCase();

    // Prevent overriding pre-defined system codes
    if (PREDEFINED_CODES.includes(formattedCode)) {
      setError(`Code "${formattedCode}" is a built-in system code and cannot be modified.`);
      setLoading(false);
      return;
    }

    try {
      const codeRef = doc(db, 'invitation_codes', formattedCode);
      await setDoc(codeRef, {
        active: true,
        notes: newNotes.trim() || 'Created by Administrator',
        created_at: new Date().toISOString()
      });

      setSuccess(`Code "${formattedCode}" successfully created and active!`);
      setNewCode('');
      setNewNotes('');
    } catch (err: any) {
      setError(err.message || "Failed to create invitation code.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCodeActive = async (codeId: string, currentStatus: boolean) => {
    try {
      const codeRef = doc(db, 'invitation_codes', codeId);
      await updateDoc(codeRef, {
        active: !currentStatus
      });
      setSuccess(`Code "${codeId}" is now ${!currentStatus ? 'Active' : 'Paused'}.`);
    } catch (err: any) {
      setError(`Failed to update status for ${codeId}`);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!window.confirm(`Are you sure you want to completely delete the invitation code "${codeId}"?`)) {
      return;
    }

    try {
      const codeRef = doc(db, 'invitation_codes', codeId);
      await deleteDoc(codeRef);
      setSuccess(`Code "${codeId}" deleted successfully.`);
    } catch (err: any) {
      setError(`Failed to delete code: ${codeId}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCodes = codes.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-700 font-sans text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
            <p className="text-slate-400 text-sm">Secure passwordless entry & invitation code controls</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand" /> Create Invitation Code
            </h3>
            
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 tracking-wider">
                  New Code Name
                </label>
                <input 
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. BERLIN2026"
                  className="input-field uppercase font-mono font-bold tracking-widest text-center"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Autoconverted to uppercase. Keep it simple and recognizable.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Student/Group Notes
                </label>
                <textarea 
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Munich language class, valid until July"
                  className="input-field py-2"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-start gap-2 border border-rose-100 dark:border-rose-900/10">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-start gap-2 border border-emerald-100 dark:border-emerald-900/10">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 font-bold tracking-wide text-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Creating...' : <>Generate Invitation Code</>}
              </button>
            </form>
          </div>

          {/* Quick Predefined Reference info card */}
          <div className="card p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-brand uppercase tracking-wider mb-3">Backup System Codes</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              These codes are hardcoded into the platform. They can always be used as immediate test logins and cannot be modified or deleted:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PREDEFINED_CODES.map(c => (
                <span 
                  key={c}
                  onClick={() => copyToClipboard(c)}
                  className="font-mono text-[10px] bg-white dark:bg-slate-800 text-slate-500 hover:text-brand hover:border-brand cursor-pointer px-2 py-1 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                  title="Click to Copy code"
                >
                  {c} {copiedCode === c ? '✓' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Dynamic Database list Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl">
            
            {/* Search filter in head */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-brand" /> Dynamic Invitation Codes ({filteredCodes.length})
              </h3>
              
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter active codes..."
                  className="input-field py-2 pl-9 pr-4 text-xs tracking-wide rounded-xl"
                />
              </div>
            </div>

            {/* List Table */}
            {filteredCodes.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Key className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No database codes found</p>
                <p className="text-xs text-slate-400 mt-1">Create your first custom login invitation code on the left!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 dark:border-slate-800/80">
                      <th className="py-3 text-xs font-bold uppercase text-slate-400 tracking-wider">Invitation Code</th>
                      <th className="py-3 text-xs font-bold uppercase text-slate-400 tracking-wider">Notes / Assignee</th>
                      <th className="py-3 text-xs font-bold uppercase text-slate-400 tracking-wider">Created</th>
                      <th className="py-3 text-xs font-bold uppercase text-slate-400 tracking-wide text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {filteredCodes.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold bg-slate-100 dark:bg-slate-800 text-brand px-2.5 py-1 rounded">
                              {item.id}
                            </span>
                            <button
                              onClick={() => copyToClipboard(item.id)}
                              className="w-7 h-7 text-slate-400 hover:text-brand bg-slate-50 dark:bg-slate-800 rounded flex items-center justify-center transition-colors border border-transparent hover:border-slate-200"
                              title="Copy Code"
                            >
                              {copiedCode === item.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        
                        <td className="py-4 text-xs text-slate-500 dark:text-slate-300 max-w-[180px] truncate" title={item.notes}>
                          {item.notes}
                        </td>

                        <td className="py-4 text-xs text-slate-400/80 font-mono">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            {new Date(item.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </div>
                        </td>

                        <td className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleCodeActive(item.id, item.active)}
                              className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                item.active 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                              }`}
                              title={item.active ? "Pause access" : "Activate access"}
                            >
                              {item.active ? '● Active' : '○ Paused'}
                            </button>

                            <button
                              onClick={() => handleDeleteCode(item.id)}
                              className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center transition-colors cursor-pointer"
                              title="Delete invitation code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
