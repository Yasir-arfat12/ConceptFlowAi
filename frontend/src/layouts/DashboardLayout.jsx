import { useEffect, useMemo, useState } from 'react';
import { LineChart, LayoutGrid, Calendar, ChevronDown, Search, Bell, MessageCircle, Edit, Command, CheckSquare, TrendingUp, Menu, X, HelpCircle, ClipboardList, Inbox as InboxIcon, History, BarChart3 } from 'lucide-react';
import clsx from 'clsx';
import { useUnreadCount } from '../store/AppStore';

function NavItem({ icon, label, active, iconColor, onClick, badge }) {
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined}
      className={clsx('w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-sm my-0.5', active ? 'bg-white/10 text-white' : 'bg-transparent text-white/45 border border-transparent hover:text-white hover:bg-white/[0.04]')}>
      <span className={clsx('w-4 h-4 flex items-center justify-center', iconColor || (active ? 'text-white' : 'text-white/40'))} aria-hidden="true">{icon}</span>
      <span className={clsx('font-medium', active ? 'text-white' : 'text-white/60')}>{label}</span>
      {badge > 0 && <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-white text-black text-[10px] font-semibold flex items-center justify-center" aria-label={`${badge} unread`}>{badge}</span>}
    </button>
  );
}

const ic = 'w-4 h-4';
const MAIN = [
  { route: 'dashboard', label: 'Overview', icon: <LayoutGrid className={ic} /> },
  { route: 'dashboard/tutor', label: 'Tutor', icon: <MessageCircle className={ic} /> },
  { route: 'dashboard/assignments', label: 'Assignments', icon: <CheckSquare className={ic} /> },
  { route: 'dashboard/planner', label: 'Planner', icon: <Calendar className={ic} /> },
  { route: 'dashboard/quiz', label: 'Quiz', icon: <ClipboardList className={ic} /> },
  { route: 'dashboard/doubts', label: 'Doubts', icon: <HelpCircle className={ic} /> },
  { route: 'dashboard/career', label: 'Career', icon: <TrendingUp className={ic} /> },
];
const WORKSPACE = [
  { route: 'dashboard/inbox', label: 'Inbox', icon: <InboxIcon className={ic} />, badge: true },
  { route: 'dashboard/history', label: 'Session History', icon: <History className={ic} /> },
  { route: 'dashboard/insights', label: 'Insights', icon: <BarChart3 className={ic} /> },
];
const FAVORITES = [
  { route: 'dashboard/inbox', label: 'Daily briefing', iconColor: 'text-[#EAB308]', icon: <MessageCircle className={ic} /> },
  { route: 'dashboard/chat', label: 'Research topics', iconColor: 'text-[#06B6D4]', icon: <Search className={ic} /> },
  { route: 'dashboard/planner', label: 'Exam watch', iconColor: 'text-[#F43F5E]', icon: <LineChart className={ic} /> },
];

function SectionHeader({ label, open, onToggle }) {
  return (
    <button onClick={onToggle} aria-expanded={open} className="w-full pt-6 pb-2 px-3 flex items-center justify-between group cursor-pointer">
      <h3 className="text-[11px] text-white/40 font-semibold tracking-wide">{label}</h3>
      <ChevronDown className={clsx('w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-transform', !open && '-rotate-90')} aria-hidden="true" />
    </button>
  );
}

/** Responsive shell: fixed sidebar >= lg, slide-over menu with top bar below lg. */
export default function DashboardLayout({ children, navigateTo, currentRoute }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState('');
  const [sections, setSections] = useState({ workspace: true, favorites: true });
  const unread = useUnreadCount();

  useEffect(() => { setMenuOpen(false); }, [currentRoute]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? [...MAIN, ...WORKSPACE].filter((n) => n.label.toLowerCase().includes(t)) : [];
  }, [q]);

  const go = (route) => { navigateTo(route); setMenuOpen(false); setSearching(false); setQ(''); };
  const item = (n) => <NavItem key={n.label} onClick={() => go(n.route)} icon={n.icon} label={n.label} iconColor={n.iconColor} active={!n.iconColor && currentRoute === n.route} badge={n.badge ? unread : 0} />;

  const sidebar = (
    <>
      <div className="h-[60px] flex items-center justify-between pl-4 pr-3 shrink-0">
        <button className="flex items-center select-none bg-transparent border-none p-0" onClick={() => go('landing')} aria-label="ConceptFlow home">
          <span className="w-5 h-5 bg-white rounded-[4px] flex items-center justify-center shrink-0 mr-2.5" aria-hidden="true"><Command className="w-3.5 h-3.5 text-black" /></span>
          <span className="font-semibold text-[15px] tracking-wide text-white">ConceptFlow</span>
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSearching((s) => !s)} aria-label="Search navigation" aria-pressed={searching} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors bg-transparent border-none p-0"><Search className="w-4 h-4" aria-hidden="true" /></button>
          <button onClick={() => go('dashboard/chat')} aria-label="New learning session" className={clsx('w-8 h-8 rounded-full flex items-center justify-center transition-colors', currentRoute === 'dashboard/chat' ? 'bg-white/10 text-white' : 'bg-transparent border border-white/10 text-white/45 hover:text-white hover:bg-white/5')}><Edit className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      </div>
      {searching && (
        <div className="px-3 pb-2">
          <label htmlFor="nav-search" className="sr-only">Search pages</label>
          <input id="nav-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) go(matches[0].route); if (e.key === 'Escape') { setSearching(false); setQ(''); } }} placeholder="Jump to..." className="w-full bg-[#121212] border border-white/10 rounded-md px-3 py-1.5 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/20" />
          {q && (matches.length ? matches.map(item) : <p className="px-2 py-2 text-[12px] text-white/40">No pages found.</p>)}
        </div>
      )}
      <nav className="flex-1 px-3 py-2 space-y-1" aria-label="Main">
        {MAIN.map(item)}
        <SectionHeader label="Workspace" open={sections.workspace} onToggle={() => setSections((s) => ({ ...s, workspace: !s.workspace }))} />
        {sections.workspace && WORKSPACE.map(item)}
        <SectionHeader label="Favorites" open={sections.favorites} onToggle={() => setSections((s) => ({ ...s, favorites: !s.favorites }))} />
        {sections.favorites && FAVORITES.map(item)}
      </nav>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row h-dvh w-full bg-black text-white overflow-hidden font-sans antialiased">
      <aside className="hidden lg:flex w-[18%] min-w-[240px] border-r border-white/5 flex-col bg-black z-20 shrink-0 overflow-y-auto overflow-x-hidden scrollbar-hide">{sidebar}</aside>

      <div className="lg:hidden h-[52px] shrink-0 flex items-center justify-between px-3 border-b border-white/5 bg-black z-30">
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white"><Menu className="w-5 h-5" aria-hidden="true" /></button>
        <span className="font-semibold text-[15px] tracking-wide">ConceptFlow</span>
        <button onClick={() => go('dashboard/inbox')} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative w-9 h-9 flex items-center justify-center text-white/70 hover:text-white">
          <Bell className="w-5 h-5" aria-hidden="true" />
          {unread > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-white text-black text-[10px] font-semibold flex items-center justify-center">{unread}</span>}
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="w-[280px] max-w-[85%] bg-black border-r border-white/5 flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200">
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute top-3 right-[calc(15%+8px)] hidden"><X className="w-4 h-4" aria-hidden="true" /></button>
            {sidebar}
          </div>
          <button className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
        </div>
      )}

      <main className="flex-1 flex flex-col relative min-w-0 min-h-0 bg-[#000000]">
        <div className="flex-1 h-full w-full relative overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
