
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Playbook, PlaybookRule, PlaybookTag, Trade, TradeScreenshot, PlaybookTrap } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';

const EMOJIS = ['🚀', '🎯', '📊', '📈', '📉', '💰', '🛡️', '⚡', '💎', '🔥', '🌊', '🏹', '🧩', '⚖️', '🗝️', '💡'];
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#10b981', '#06b6d4', '#64748b'];
const TAG_COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#0ea5e9', // Sky
    '#6366f1', // Indigo
    '#94a3b8'  // Slate
];

const TIER_DEFINITIONS = [
    { tier: 1, name: "Macro Context", icon: "fa-arrows-to-dot", color: "text-blue-400", tags: ['#GAP', '#LARGEGAP', '#EXHAUSTION', '#MASSIVEGAP', '#INSIDERANGE', '#INBALANCE', '#TIGHTBALANCE', '#EXTREMESKEW', '#OUTSIDEVA', '#REJECTION', '#FAILEDBREAK'] },
    { tier: 2, name: "Opening Auction", icon: "fa-bolt", color: "text-orange-400", tags: ['#STRONGDRIVE', '#NOTAILS', '#TESTFIRST', '#TRAPPEDTRADERS', '#FAILEDPUSH', '#IB_STRUGGLE', '#FAKEOUT', '#NARROWIB'] },
    { tier: 3, name: "Intraday Regime", icon: "fa-gears", color: "text-emerald-400", tags: ['#IMBALANCE', '#SINGLEPRINTS', '#DOUBLEDIST', '#CASCADE', '#NEWS', '#MOMENTUM', '#REVERSION', '#OVEREXTENDED', '#ALGORITHMIC', '#SUPPORT/RES', '#STRUCTURE'] },
    { tier: 4, name: "Location & Targeting", icon: "fa-bullseye", color: "text-purple-400", tags: ['#POORSTRUCTURE', '#OLDBUSINESS', '#PIVOT', '#HVN', '#PSYCHOLOGY'] },
    { tier: 5, name: "Time Factor", icon: "fa-clock", color: "text-rose-400", tags: ['#AFTERNOON', '#LATEDAY', '#ENDOFWEEK', '#MULTIDAY'] }
];

const getTagTier = (text: string): number => {
    const normalized = text.toUpperCase().trim();
    const found = TIER_DEFINITIONS.find(d => d.tags.includes(normalized));
    return found ? found.tier : 0; 
};

const HoverDialog = ({ label, text, children, position = "top" }: { label?: string, text?: string, children?: React.ReactNode, position?: "top" | "bottom" }) => (
  <div className="relative group/dialog w-full">
    {children}
    {text && text.trim().length > 0 && (
      <div className={`absolute ${position === "top" ? "bottom-full mb-3" : "top-full mt-3"} left-0 hidden group-hover/dialog:block z-[110] animate-in fade-in zoom-in-95 duration-200 min-w-[280px] max-w-[450px] pointer-events-none`}>
        <div className="bg-slate-950 border border-slate-700 p-5 rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
          {label && <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">{label}</p>}
          <p className="text-xs text-slate-100 leading-relaxed font-semibold whitespace-pre-wrap">{text}</p>
          <div className={`absolute ${position === "top" ? "top-full -mt-1.5" : "bottom-full -mb-1.5"} left-8 w-3 h-3 bg-slate-950 border-r border-b border-slate-700 rotate-45`}></div>
        </div>
      </div>
    )}
  </div>
);

const compressImage = (base64Str: string, maxWidth = 1920, quality = 0.9): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

const RuleSection = ({ title, rules, onAdd, onRemove, onUpdate, max = 99 }: { title: string, rules: PlaybookRule[], onAdd: () => void, onRemove: (id: string) => void, onUpdate: (id: string, text: string) => void, max?: number }) => (
  <div className="bg-[#0f0f1b] border border-slate-800 rounded-2xl p-8">
    <div className="flex items-center space-x-3 mb-8"><i className="fas fa-grip-vertical text-slate-700"></i><h4 className="text-lg font-black text-white uppercase tracking-tight">{title}</h4></div>
    <div className="space-y-4 mb-8">
      {rules.map((rule, idx) => (
        <div key={rule.id} className="flex items-center space-x-4 group">
          <span className="text-[10px] font-black text-slate-600 w-5">{idx + 1}.</span>
          <HoverDialog label={`Criterion ${idx + 1}`} text={rule.text}>
            <input 
                type="text" 
                value={rule.text} 
                onChange={(e) => onUpdate(rule.id, e.target.value)} 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-200 transition-all hover:border-slate-600" 
                placeholder={`Introduceți criteriul ${idx + 1}...`} 
            />
          </HoverDialog>
          <button onClick={() => onRemove(rule.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-2"><i className="fas fa-trash-alt"></i></button>
        </div>
      ))}
    </div>
    {rules.length < max && (<button onClick={onAdd} className="text-blue-500 text-[11px] font-black uppercase tracking-widest flex items-center hover:text-blue-400 transition-colors"><i className="fas fa-plus mr-2"></i> Add criteria</button>)}
  </div>
);

interface PlaybookEditorProps {
  onSave: (playbook: Playbook) => void;
  onDelete?: (id: string) => void;
}

export default function PlaybookEditor({ onSave, onDelete }: PlaybookEditorProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // OPTIMIZED SELECTOR: Using useShallow to prevent re-renders
  const { playbooks, trades, loadPlaybooks } = useAppStore(useShallow(state => ({
    playbooks: state.playbooks,
    trades: state.trades,
    loadPlaybooks: state.loadPlaybooks
  })));

  const existingPlaybook = playbooks?.find(p => p.id === id);

  const [formData, setFormData] = useState<Partial<Playbook>>({
    name: '', description: '', icon: '📊', color: '#3b82f6', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: '', target: '', invalidation: '', isPrivate: true, screenshots: [], tags: [],
    traps: [
        { label: 'Trap 1: False Conviction', name: '', description: '' },
        { label: 'Trap 2: The Absorption', name: '', description: '' },
        { label: 'Trap 3: The Context Shift', name: '', description: '' }
    ]
  });

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [collapsedSuggestions, setCollapsedSuggestions] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true });
  const [collapsedActive, setCollapsedActive] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true });

  const iconPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const tieredSuggestions = useMemo(() => {
    const allTagsMap: Record<string, PlaybookTag> = {};
    
    TIER_DEFINITIONS.forEach(tierDef => {
        tierDef.tags.forEach(t => {
            allTagsMap[t] = { id: t, text: t, color: TAG_COLORS[tierDef.tier % TAG_COLORS.length] };
        });
    });

    playbooks.forEach(pb => {
      pb.tags?.forEach(tag => {
        if (!allTagsMap[tag.text.toUpperCase()]) {
          allTagsMap[tag.text.toUpperCase()] = tag;
        }
      });
    });
    
    const currentTagTexts = (formData.tags || []).map(t => t.text.toUpperCase());
    const filtered = Object.values(allTagsMap).filter(t => !currentTagTexts.includes(t.text.toUpperCase()));

    const grouped: Record<number, PlaybookTag[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };
    filtered.forEach(t => {
        const tier = getTagTier(t.text);
        grouped[tier].push(t);
    });

    return grouped;
  }, [playbooks, formData.tags]);

  const tieredActiveTags = useMemo(() => {
    const grouped: Record<number, PlaybookTag[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };
    (formData.tags || []).forEach(t => {
        const tier = getTagTier(t.text);
        grouped[tier].push(t);
    });
    return grouped;
  }, [formData.tags]);

  const relatedTrades = useMemo(() => {
    if (!formData.name) return [];
    return (trades || []).filter(t => t.setup?.toLowerCase() === formData.name?.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
  }, [formData.name, trades]);

  useEffect(() => {
    loadPlaybooks();
  }, [loadPlaybooks]);

  useEffect(() => {
    if (existingPlaybook) {
      setFormData({ 
        ...existingPlaybook, 
        screenshots: existingPlaybook.screenshots || [], 
        tags: existingPlaybook.tags || [],
        traps: existingPlaybook.traps || [
            { label: 'Trap 1: False Conviction', name: '', description: '' },
            { label: 'Trap 2: The Absorption', name: '', description: '' },
            { label: 'Trap 3: The Context Shift', name: '', description: '' }
        ]
      });
    } else {
        setFormData({
            name: '', description: '', icon: '📊', color: '#3b82f6', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: '', target: '', invalidation: '', isPrivate: true, screenshots: [], tags: [],
            traps: [
                { label: 'Trap 1: False Conviction', name: '', description: '' },
                { label: 'Trap 2: The Absorption', name: '', description: '' },
                { label: 'Trap 3: The Context Shift', name: '', description: '' }
            ]
        });
    }
  }, [existingPlaybook, id]); 


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) setShowIconPicker(false);
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) setShowColorPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addRule = (section: 'entryCriteria' | 'exitCriteria' | 'marketConditions') => {
    const newRule: PlaybookRule = { id: Math.random().toString(36).substr(2, 9), text: '' };
    setFormData(prev => ({ ...prev, [section]: [...(prev[section] || []), newRule] }));
  };

  const removeRule = (section: 'entryCriteria' | 'exitCriteria' | 'marketConditions', ruleId: string) => {
    setFormData(prev => ({ ...prev, [section]: (prev[section] || []).filter(r => r.id !== ruleId) }));
  };

  const updateRule = (section: 'entryCriteria' | 'exitCriteria' | 'marketConditions', ruleId: string, text: string) => {
    setFormData(prev => ({ ...prev, [section]: (prev[section] || []).map(r => r.id === ruleId ? { ...r, text } : r) }));
  };

  const addTag = () => {
    const newTag: PlaybookTag = { 
        id: Math.random().toString(36).substr(2, 9), 
        text: 'NEW ATTRIBUTE', 
        color: TAG_COLORS[0] 
    };
    setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
  };

  const pickSuggestedTag = (tag: PlaybookTag) => {
    const newTag: PlaybookTag = {
        ...tag,
        id: Math.random().toString(36).substr(2, 9)
    };
    setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
  };

  const removeTag = (tagId: string) => {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t.id !== tagId) }));
  };

  const updateTag = (tagId: string, updates: Partial<PlaybookTag>) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).map(t => t.id === tagId ? { ...t, ...updates } : t)
    }));
  };

  const updateTrap = (idx: number, updates: Partial<PlaybookTrap>) => {
      const newTraps = [...(formData.traps || [])];
      newTraps[idx] = { ...newTraps[idx], ...updates };
      setFormData(prev => ({ ...prev, traps: newTraps }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const currentCount = formData.screenshots?.length || 0;
    const filesToProcess = Array.from(files).slice(0, 10 - currentCount) as File[];
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setFormData(prev => ({
          ...prev,
          screenshots: [...(prev.screenshots || []), { url: compressed, caption: '' }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    if (!formData.name) return alert('Numele Playbook-ului este obligatoriu.');
    onSave({ ...formData, id: id || Math.random().toString(36).substr(2, 9), createdAt: existingPlaybook?.createdAt || new Date().toISOString() } as Playbook);
    navigate('/playbooks');
  };

  const toggleCollapseSuggestion = (tier: number) => {
    setCollapsedSuggestions(prev => ({ ...prev, [tier]: !prev[tier] }));
  };

  const toggleCollapseActive = (tier: number) => {
    setCollapsedActive(prev => ({ ...prev, [tier]: !prev[tier] }));
  };

  const collapseAll = () => {
    const allCollapsed: Record<number, boolean> = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true };
    setCollapsedSuggestions(allCollapsed);
    setCollapsedActive(allCollapsed);
  };

  const expandAll = () => {
    setCollapsedSuggestions({});
    setCollapsedActive({});
  };

  const inputClass = "w-full bg-[#0f0f1b] border border-slate-800 rounded-xl px-6 py-4 text-slate-100 font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-inner hover:border-slate-700";
  const labelClass = "text-white text-base font-black mb-3 block uppercase tracking-tight";

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white flex items-center text-xs font-black uppercase tracking-widest">
          <i className="fas fa-arrow-left mr-2"></i> Back to Vault
        </button>
        <div className="flex space-x-4">
          <button onClick={collapseAll} className="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/80 text-slate-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Collapse All</button>
          <button onClick={expandAll} className="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/80 text-slate-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Expand All</button>
          {existingPlaybook && onDelete && (
            <button onClick={() => { if(confirm('Delete this playbook?')) { onDelete(existingPlaybook.id); navigate('/playbooks'); } }} className="text-red-500 hover:text-red-400 p-2"><i className="fas fa-trash"></i></button>
          )}
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-xl font-black text-[11px] transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest">Save Strategy</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="flex space-x-6 relative">
            <div className="relative" ref={iconPickerRef}>
              <button onClick={() => setShowIconPicker(!showIconPicker)} className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-xl flex items-center space-x-4 text-slate-300 hover:text-white transition-all min-w-[160px] shadow-lg">
                <span className="text-2xl">{formData.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest">{showIconPicker ? 'Close' : 'Add Icon'}</span>
              </button>
              {showIconPicker && (
                <div className="absolute top-full mt-3 left-0 z-50 bg-[#0b1222] border border-slate-700 rounded-2xl p-5 shadow-2xl w-72 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-4 gap-3">
                    {EMOJIS.map(emoji => (
                      <button key={emoji} onClick={() => { setFormData({...formData, icon: emoji}); setShowIconPicker(false); }} className={`text-3xl p-3 rounded-xl hover:bg-slate-800 transition-all ${formData.icon === emoji ? 'bg-blue-600/20 ring-1 ring-blue-500' : ''}`}>{emoji}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={colorPickerRef}>
              <button onClick={() => setShowColorPicker(!showColorPicker)} className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-xl flex items-center space-x-4 text-slate-300 hover:text-white transition-all min-w-[180px] shadow-lg">
                <div className="w-5 h-5 rounded-lg shadow-inner" style={{ backgroundColor: formData.color }}></div>
                <span className="text-[11px] font-black uppercase tracking-widest">Accent Color</span>
              </button>
              {showColorPicker && (
                <div className="absolute top-full mt-3 left-0 z-50 bg-[#0b1222] border border-slate-700 rounded-2xl p-5 shadow-2xl w-72 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-5 gap-3">
                    {COLORS.map(color => (
                      <button key={color} onClick={() => { setFormData({...formData, color}); setShowColorPicker(false); }} className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${formData.color === color ? 'border-white shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-10">
            <div><label className={labelClass}>Strategy Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={inputClass} placeholder="Ex: The Open Drive" /></div>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <label className="text-white text-base font-black uppercase tracking-widest italic">Tiered Strategy Architecture (Funnel Steps)</label>
                  <button onClick={addTag} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20">
                    <i className="fas fa-plus mr-2"></i> Custom Tag
                  </button>
                </div>
                
                {/* Categorized Quick Add */}
                <div className="space-y-6 mb-10">
                   {TIER_DEFINITIONS.map(tierDef => {
                       const isCollapsed = collapsedSuggestions[tierDef.tier];
                       const count = tieredSuggestions[tierDef.tier].length;
                       
                       return (
                           <div key={tierDef.tier} className="space-y-3">
                               <button 
                                   onClick={() => toggleCollapseSuggestion(tierDef.tier)}
                                   className="flex items-center space-x-2 group/header w-full text-left"
                               >
                                   <i className={`fas ${tierDef.icon} text-[10px] ${tierDef.color}`}></i>
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex-1">Tier {tierDef.tier}: {tierDef.name}</p>
                                   <div className="flex items-center space-x-3">
                                        {isCollapsed && count > 0 && <span className="text-[8px] font-black text-blue-400 uppercase">+{count} Available</span>}
                                        <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'} text-[8px] text-slate-700 group-hover/header:text-slate-400 transition-all`}></i>
                                   </div>
                               </button>
                               
                               {!isCollapsed && (
                                   <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                       {tieredSuggestions[tierDef.tier].map(tag => (
                                           <button
                                               key={tag.id}
                                               onClick={() => pickSuggestedTag(tag)}
                                               className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-800 hover:border-blue-500/50 transition-all flex items-center space-x-2 bg-slate-900/30 group/tagbtn"
                                           >
                                               <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                               <span className="text-slate-400 group-hover/tagbtn:text-white">{tag.text}</span>
                                               <i className="fas fa-plus text-[7px] text-slate-700 group-hover/tagbtn:text-blue-400"></i>
                                           </button>
                                       ))}
                                       {tieredSuggestions[tierDef.tier].length === 0 && (
                                           <span className="text-[8px] text-slate-700 italic uppercase">All tier {tierDef.tier} attributes selected</span>
                                       )}
                                   </div>
                               )}
                           </div>
                       );
                   })}
                </div>

                <div className="bg-[#0f0f1b] border border-slate-800 rounded-[2rem] p-6 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-6">
                   {TIER_DEFINITIONS.map(tierDef => {
                       const isCollapsed = collapsedActive[tierDef.tier];
                       const activeCount = tieredActiveTags[tierDef.tier].length;

                       return (
                           <div key={tierDef.tier} className={`space-y-2 p-4 rounded-2xl border border-slate-800/50 bg-slate-900/20 transition-all duration-300 ${activeCount === 0 ? 'opacity-20' : 'opacity-100'} ${isCollapsed ? 'pb-2' : ''}`}>
                               <div 
                                    className="flex justify-between items-center border-b border-slate-800/40 pb-2 cursor-pointer group/cardh"
                                    onClick={() => toggleCollapseActive(tierDef.tier)}
                                >
                                   <div className="flex items-center space-x-2">
                                       <i className={`fas ${tierDef.icon} text-xs ${tierDef.color}`}></i>
                                       <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Tier {tierDef.tier}</h5>
                                   </div>
                                   <div className="flex items-center space-x-3">
                                        {isCollapsed && activeCount > 0 && <span className="text-[8px] font-black text-blue-500/80">{activeCount} Attributes Hidden</span>}
                                        <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'} text-[9px] text-slate-700 group-hover/cardh:text-white transition-all`}></i>
                                   </div>
                               </div>
                               
                               {!isCollapsed && (
                                   <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in duration-300">
                                       {tieredActiveTags[tierDef.tier].map(tag => (
                                           <div key={tag.id} className="flex flex-col space-y-2 bg-slate-900/80 border border-slate-800 p-3 rounded-xl group relative shadow-md hover:border-slate-600 transition-all w-full md:w-auto min-w-[120px]">
                                               <button onClick={(e) => { e.stopPropagation(); removeTag(tag.id); }} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-xl">
                                                   <i className="fas fa-times text-[8px]"></i>
                                               </button>
                                               <input 
                                                   type="text" 
                                                   value={tag.text} 
                                                   onChange={(e) => updateTag(tag.id, { text: e.target.value.toUpperCase() })} 
                                                   className="bg-transparent border-none p-0 text-[9px] font-black uppercase text-white outline-none w-full tracking-widest"
                                                   placeholder="TAG NAME"
                                                   onClick={(e) => e.stopPropagation()}
                                               />
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
                       );
                   })}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description / Context</label>
              <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  className={`${inputClass} min-h-[140px] resize-none leading-relaxed`} 
                  placeholder="Describe the core logic, market environment and why this setup exists..." 
              />
            </div>

            {/* TRAPS EDITOR SECTION */}
            <div className="space-y-6 bg-orange-600/5 p-8 rounded-[2rem] border border-orange-500/20">
                <label className="text-orange-500 text-base font-black uppercase tracking-widest italic flex items-center">
                    <i className="fas fa-skull-crossbones mr-3"></i> The Architect's Traps
                </label>
                <div className="space-y-6">
                    {(formData.traps || []).map((trap, idx) => (
                        <div key={idx} className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{trap.label}</span>
                            </div>
                            <input 
                                type="text"
                                value={trap.name}
                                onChange={(e) => updateTrap(idx, { name: e.target.value })}
                                className="w-full bg-[#16162a] border border-orange-500/30 rounded-xl px-5 py-3 text-xs font-black text-white outline-none focus:ring-1 focus:ring-orange-500/50"
                                placeholder="Trap Title (e.g. Low Vol Drive)"
                            />
                            <textarea 
                                value={trap.description}
                                onChange={(e) => updateTrap(idx, { description: e.target.value })}
                                className="w-full bg-[#16162a] border border-orange-500/30 rounded-xl px-5 py-3 text-xs text-slate-300 min-h-[80px] outline-none focus:ring-1 focus:ring-orange-500/50 resize-none italic"
                                placeholder="Describe how this setup fails..."
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div><label className={labelClass}>Entry At</label><input type="text" value={formData.entryAt} onChange={(e) => setFormData({...formData, entryAt: e.target.value})} className={inputClass} placeholder="Ex: Minimum Pullback" /></div>
              <div><label className={labelClass}>Target</label><input type="text" value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} className={inputClass} placeholder="Ex: HTF targets" /></div>
              <div><label className={labelClass}>Invalidation</label><input type="text" value={formData.invalidation} onChange={(e) => setFormData({...formData, invalidation: e.target.value})} className={inputClass} placeholder="Ex: Back in Opening Range" /></div>
            </div>
          </div>

          <RuleSection title="Success Criteria (Max 3 shown in summary)" rules={formData.entryCriteria || []} max={3} onAdd={() => addRule('entryCriteria')} onRemove={(rid) => removeRule('entryCriteria', rid)} onUpdate={(rid, txt) => updateRule('entryCriteria', rid, txt)} />

          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <h4 className="text-xl font-black text-white uppercase tracking-tighter">Reference Screenshots</h4>
              <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border border-blue-500/20 shadow-lg">
                <i className="fas fa-camera mr-2"></i> Add Images
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(formData.screenshots || []).map((shot, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl group relative transition-all hover:border-blue-500/30">
                  <div className="relative aspect-video bg-black flex items-center justify-center border-b border-slate-800 cursor-zoom-in" onClick={() => setLightboxImage(shot.url)}>
                    <img src={shot.url} className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-700" alt="Setup Reference" />
                    <button onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, screenshots: prev.screenshots?.filter((_, i) => i !== idx) })); }} className="absolute top-6 right-6 bg-red-600/90 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl"><i className="fas fa-times"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="bg-[#0b1222] border border-slate-800 p-10 rounded-[3rem] shadow-2xl h-fit sticky top-24">
            <div className="flex items-center space-x-4 mb-10 border-b border-slate-800/50 pb-6">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
                <i className="fas fa-history text-sm"></i>
              </div>
              <div><h4 className="text-sm font-black text-white uppercase tracking-tight">Trade History</h4><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recent Executions</p></div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {relatedTrades.map(trade => (
                  <Link to={`/trade/${trade.id}`} key={trade.id} className="group relative aspect-square bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all shadow-xl">
                    <div className={`absolute bottom-0 left-0 right-0 p-3 bg-black/70 backdrop-blur-md border-t border-white/5 flex flex-col items-center justify-center`}>
                      <span className={`text-[10px] font-black ${trade.pnlNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>${Math.abs(trade.pnlNet).toFixed(0)}</span>
                      <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">{trade.date.split('-').slice(1).join('/')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-6 animate-in fade-in duration-300 cursor-zoom-out" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-10 right-10 text-white/40 hover:text-white text-4xl transition-colors" onClick={() => setLightboxImage(null)}><i className="fas fa-times"></i></button>
          <div className="max-w-[98vw] max-h-[98vh] relative flex items-center justify-center">
            <img src={lightboxImage} className="max-w-full max-h-[92vh] object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-2xl select-none" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
}
