import { useEffect, useRef, useState } from 'react';
import { BrainCircuit, Send, User, Loader2, Play, Sparkles } from 'lucide-react';
import Drawer from './Drawer';
import { askTutor } from '../lib/tutorClient';
import { makeId } from '../lib/format';
import { useApp } from '../store/AppStore';

/**
 * Doubt resolution drawer. Every question is sent to the tutor and saved as a
 * thread in the shared Doubts store, so it shows up on the Doubts page.
 * "Resume lesson" closes the drawer and leaves the learner exactly where they were.
 */
export default function DoubtDrawer({ open, onClose, subtitle, greeting, context = {}, resumeLabel = 'Resume lesson', onSaveToDoubts = true }) {
  const { state, dispatch } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const doubtId = useRef(null);
  const abort = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) { setMessages([]); setInput(''); setBusy(false); doubtId.current = null; }
    else abort.current?.abort();
  }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: 'smooth' }); }, [messages, busy]);

  const send = async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput(''); setBusy(true);
    setMessages((m) => [...m, { role: 'user', text: q }]);
    if (onSaveToDoubts && !doubtId.current) {
      doubtId.current = makeId('d');
      dispatch({ type: 'doubt/add', doubt: { id: doubtId.current, title: q, details: context.title ? `Asked while studying: ${context.title}` : '', author: state?.user?.name || 'Learner', at: new Date().toISOString(), resolved: false, likes: 0, liked: false, replies: [] } });
    }
    abort.current = new AbortController();
    try {
      const answer = await askTutor({ question: q, context, signal: abort.current.signal });
      setMessages((m) => [...m, { role: 'tutor', text: answer }]);
      if (doubtId.current) dispatch({ type: 'doubt/reply', id: doubtId.current, reply: { id: makeId('r'), author: 'ConceptFlow Tutor', tutor: true, at: new Date().toISOString(), body: answer } });
    } catch (err) {
      if (err?.name !== 'AbortError') setMessages((m) => [...m, { role: 'tutor', text: 'Sorry, I could not answer that right now. Please try again.', error: true }]);
    } finally { setBusy(false); }
  };

  return (
    <Drawer open={open} onClose={onClose} title="ConceptFlow Tutor" subtitle={subtitle}
      icon={<div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/5 shadow-sm"><Sparkles className="w-4 h-4 text-white" aria-hidden="true" /></div>}
      footer={
        <div className="p-5 border-t border-white/5 bg-[#050505]">
          <form onSubmit={send} className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-2xl focus-within:border-white/20 focus-within:bg-white/[0.05] transition-all p-1">
            <label htmlFor="doubt-input" className="sr-only">Ask your doubt</label>
            <input id="doubt-input" aria-label="Ask your doubt" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your doubt here..." autoComplete="off"
              className="w-full bg-transparent border-none pl-4 pr-12 py-3 text-[14px] text-white placeholder-white/30 focus:outline-none transition-all" />
            <button type="submit" disabled={!input.trim() || busy} aria-label="Send"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-white/10 disabled:hover:text-white/70">
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
          <button type="button" onClick={onClose} className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-transparent hover:border-white/10 text-[13px] font-medium text-white/50 hover:text-white hover:bg-white/[0.02] transition-colors">
            <Play className="w-3.5 h-3.5 fill-current opacity-70" aria-hidden="true" /> {resumeLabel}
          </button>
        </div>
      }>
      <div className="flex-1 overflow-y-auto p-6 space-y-8" aria-live="polite">
        <Bubble role="tutor">{greeting ?? <>Do you have a question about <strong className="text-white font-medium">{context.title || 'this lesson'}</strong>? I have the context of the current explanation.</>}</Bubble>
        {messages.map((m, i) => <Bubble key={i} role={m.role}>{m.text}</Bubble>)}
        {busy && (
          <Bubble role="tutor">
            <span className="flex items-center gap-3 text-white/40 text-[13px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Thinking...
            </span>
          </Bubble>
        )}
        <div ref={endRef} />
      </div>
    </Drawer>
  );
}

function Bubble({ role, children }) {
  const user = role === 'user';
  return (
    <div className={`flex gap-3 max-w-[90%] ${user ? 'ml-auto flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${user ? 'bg-[#1A1A1A] border border-white/10' : 'bg-white/10 border border-white/5'}`}>
        {user ? <User className="w-3.5 h-3.5 text-white/60" aria-hidden="true" /> : <BrainCircuit className="w-3.5 h-3.5 text-white/90" aria-hidden="true" />}
      </div>
      <div className={`rounded-2xl px-5 py-3.5 text-[14px] leading-relaxed shadow-sm whitespace-pre-line ${user ? 'bg-[#1A1A1A] text-white/90 border border-white/5 rounded-tr-sm' : 'bg-transparent text-zinc-300 border border-white/5 rounded-tl-sm'}`}>
        {children}
      </div>
    </div>
  );
}
