/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  FolderPlus, 
  ExternalLink, 
  Trash2, 
  Edit2, 
  X, 
  ChevronRight,
  Settings,
  Grid,
  Layout,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dial, Group } from './types';

const FAVICON_SERVICE = "https://www.google.com/s2/favicons?domain=";

export default function App() {
  const [dials, setDials] = useState<Dial[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingDial, setEditingDial] = useState<Dial | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form states
  const [newDialUrl, setNewDialUrl] = useState('');
  const [newDialTitle, setNewDialTitle] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    fetchState();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setDials(data.dials);
      setGroups(data.groups);
    } catch (err) {
      console.error("Failed to fetch state", err);
    }
  };

  const handleAddDial = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = newDialUrl.startsWith('http') ? newDialUrl : `https://${newDialUrl}`;
    const title = newDialTitle || new URL(url).hostname;
    
    try {
      const res = await fetch('/api/dials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title,
          groupId: selectedGroupId || null,
          order: dials.length
        })
      });
      if (res.ok) {
        fetchState();
        setIsAddModalOpen(false);
        setNewDialUrl('');
        setNewDialTitle('');
        setSelectedGroupId('');
      }
    } catch (err) {
      console.error("Failed to add dial", err);
    }
  };

  const handleDeleteDial = async (id: string) => {
    try {
      await fetch(`/api/dials/${id}`, { method: 'DELETE' });
      fetchState();
    } catch (err) {
      console.error("Failed to delete dial", err);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          order: groups.length
        })
      });
      if (res.ok) {
        fetchState();
        setIsGroupModalOpen(false);
        setNewGroupName('');
      }
    } catch (err) {
      console.error("Failed to add group", err);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      fetchState();
    } catch (err) {
      console.error("Failed to delete group", err);
    }
  };

  const filteredDials = useMemo(() => {
    return dials.filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dials, searchQuery]);

  const groupedDials = useMemo(() => {
    const map: Record<string, Dial[]> = { 'ungrouped': [] };
    groups.forEach(g => map[g.id] = []);
    filteredDials.forEach(d => {
      const key = d.groupId || 'ungrouped';
      if (map[key]) map[key].push(d);
      else map['ungrouped'].push(d);
    });
    return map;
  }, [groups, filteredDials]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        {/* Header / Clock */}
        <header className="flex flex-col items-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-light tracking-tighter text-zinc-400"
          >
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm uppercase tracking-[0.3em] text-zinc-600 font-medium"
          >
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </motion.div>
        </header>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-20">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search or enter address"
              className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all backdrop-blur-xl text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Speed Dials Grid */}
        <div className="space-y-16">
          {groups.map(group => (
            <section key={group.id} className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-medium text-zinc-300">{group.name}</h2>
                  <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                    {groupedDials[group.id]?.length || 0}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {groupedDials[group.id]?.map(dial => (
                  <DialCard key={dial.id} dial={dial} onDelete={() => handleDeleteDial(dial.id)} />
                ))}
                <AddButton onClick={() => { setSelectedGroupId(group.id); setIsAddModalOpen(true); }} />
              </div>
            </section>
          ))}

          {/* Ungrouped Dials */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
              <h2 className="text-xl font-medium text-zinc-300">Favorites</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsGroupModalOpen(true)}
                  className="flex items-center space-x-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/50"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>New Group</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {groupedDials['ungrouped']?.map(dial => (
                <DialCard key={dial.id} dial={dial} onDelete={() => handleDeleteDial(dial.id)} />
              ))}
              <AddButton onClick={() => { setSelectedGroupId(''); setIsAddModalOpen(true); }} />
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <Modal title="Settings" onClose={() => setIsSettingsModalOpen(false)}>
            <div className="space-y-6">
              <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Appearance</h4>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">Show Clock</span>
                  <div className="w-10 h-5 bg-emerald-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Data Management</h4>
                <button 
                  onClick={() => {
                    if (confirm("Clear all data? This cannot be undone.")) {
                      // Implementation for clear all could go here
                      alert("Feature coming soon!");
                    }
                  }}
                  className="w-full text-left text-red-400 hover:text-red-300 transition-colors"
                >
                  Reset Aura Dial
                </button>
              </div>

              <div className="text-center text-xs text-zinc-600 pt-4">
                Aura Dial v1.0.0 • Built for Firefox & Ubuntu
              </div>
            </div>
          </Modal>
        )}

        {isAddModalOpen && (
          <Modal title="Add Speed Dial" onClose={() => setIsAddModalOpen(false)}>
            <form onSubmit={handleAddDial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">URL</label>
                <input
                  autoFocus
                  type="text"
                  required
                  placeholder="google.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  value={newDialUrl}
                  onChange={(e) => setNewDialUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Title (Optional)</label>
                <input
                  type="text"
                  placeholder="My Favorite Site"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  value={newDialTitle}
                  onChange={(e) => setNewDialTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Group</label>
                <select
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">None</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
              >
                Add to Aura
              </button>
            </form>
          </Modal>
        )}

        {isGroupModalOpen && (
          <Modal title="Create Group" onClose={() => setIsGroupModalOpen(false)}>
            <form onSubmit={handleAddGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Group Name</label>
                <input
                  autoFocus
                  type="text"
                  required
                  placeholder="Work, Social, Entertainment..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
              >
                Create Group
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Footer / Settings Trigger */}
      <footer className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all shadow-2xl"
        >
          <Settings className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
}

const DialCard: React.FC<{ dial: Dial, onDelete: () => void | Promise<void> }> = ({ dial, onDelete }) => {
  const domain = new URL(dial.url).hostname;
  
  return (
    <motion.a
      href={dial.url}
      target="_blank"
      rel="noopener noreferrer"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col items-center p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:bg-zinc-800/50 hover:border-zinc-700/50 transition-all backdrop-blur-sm cursor-pointer"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 z-20">
        <button 
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            onDelete(); 
          }}
          className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors bg-zinc-950/50 rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-16 h-16 mb-4 flex items-center justify-center bg-zinc-950/50 rounded-2xl p-3 shadow-inner">
        <img 
          src={`${FAVICON_SERVICE}${domain}&sz=128`} 
          alt={dial.title}
          className="w-10 h-10 object-contain drop-shadow-lg"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${dial.title}&background=random&color=fff`;
          }}
        />
      </div>
      
      <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-100 transition-colors text-center line-clamp-1 w-full px-2">
        {dial.title}
      </span>
      <span className="text-[10px] text-zinc-600 mt-0.5 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {domain}
      </span>
    </motion.a>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl hover:bg-zinc-900/40 hover:border-emerald-500/30 hover:text-emerald-500 transition-all group min-h-[140px]"
    >
      <div className="w-12 h-12 mb-3 flex items-center justify-center bg-zinc-900/50 rounded-full group-hover:bg-emerald-500/10 transition-colors">
        <Plus className="w-6 h-6 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
      </div>
      <span className="text-xs font-semibold text-zinc-600 group-hover:text-emerald-500 uppercase tracking-widest">Add Dial</span>
    </button>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
