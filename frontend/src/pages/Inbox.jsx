import { useState } from 'react';
import { Bell, Sparkles, BrainCircuit, CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { pluralize, timeAgo } from '../lib/format';

const KINDS = {
  tutor: { icon: <BrainCircuit className="w-4 h-4 text-zinc-300" />, bg: 'bg-white/5 border border-white/10' },
  system: { icon: <Sparkles className="w-4 h-4 text-[#EAB308]" />, bg: 'bg-[#EAB308]/10 border border-[#EAB308]/20' },
  alert: { icon: <Bell className="w-4 h-4 text-[#F43F5E]" />, bg: 'bg-[#F43F5E]/10 border border-[#F43F5E]/20' },
};

/** Notification centre backed by the shared store (quizzes, plans and doubts add to it). */
export default function Inbox({ navigateTo, goBack }) {
  const { state, dispatch } = useApp();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [openId, setOpenId] = useState(null);
  const unread = state.notifications.filter((n) => n.unread).length;
  const list = onlyUnread ? state.notifications.filter((n) => n.unread) : state.notifications;

  const open = (n) => {
    setOpenId(openId === n.id ? null : n.id);
    if (n.unread) dispatch({ type: 'notif/read', id: n.id });
  };

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col">
      <header className="min-h-[72px] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-3 shrink-0 bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => goBack?.()} 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-medium text-white tracking-tight">Inbox</h1>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[11px] font-medium" role="status">{unread} Unread</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setOnlyUnread((v) => !v)} aria-pressed={onlyUnread} className={`text-sm transition-colors ${onlyUnread ? 'text-white' : 'text-white/50 hover:text-white'}`}>Unread only</button>
          <button onClick={() => dispatch({ type: 'notif/readAll' })} disabled={!unread} className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-40 disabled:hover:text-white/50">
            <CheckCircle2 className="w-4 h-4" /> Mark all as read
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {list.length === 0 && <p className="text-center text-sm text-white/40 py-12">{onlyUnread ? "You're all caught up." : 'No notifications yet.'}</p>}
          {list.map((n) => {
            const k = KINDS[n.kind] ?? KINDS.system;
            const isOpen = openId === n.id;
            return (
              <div key={n.id} className={`rounded-xl border transition-all ${n.unread ? 'bg-[#141414] border-white/10 shadow-md' : 'bg-[#0A0A0A] border-white/5 hover:bg-[#121212] hover:border-white/10'}`}>
                <button onClick={() => open(n)} aria-expanded={isOpen} className="group w-full flex items-start gap-4 p-5 text-left">
                  <span className="mt-1 flex-shrink-0">{n.unread ? <Circle className="w-2.5 h-2.5 fill-blue-500 text-blue-500" aria-label="Unread" /> : <span className="block w-2.5 h-2.5" />}</span>
                  <span className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${k.bg}`}>{k.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between mb-1 gap-3">
                      <span className={`text-[13px] font-medium ${n.unread ? 'text-white' : 'text-white/60'}`}>{n.sender}</span>
                      <span className="text-[12px] text-white/40 shrink-0">{timeAgo(n.at)}</span>
                    </span>
                    <span className={`block text-base mb-1 ${isOpen ? '' : 'truncate'} ${n.unread ? 'text-white font-medium' : 'text-white/80'}`}>{n.title}</span>
                    <span className={`block text-[13px] text-white/50 leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>{n.preview}</span>
                  </span>
                </button>
                {isOpen && n.action && (
                  <div className="px-5 pb-5 pl-[88px]">
                    <button onClick={() => navigateTo(n.action.route)} className="px-4 py-2 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors">{n.action.label}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <span className="sr-only">{pluralize(list.length, 'notification')}</span>
    </div>
  );
}
