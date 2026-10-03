import { BrainCircuit, Code, Calculator, Sparkles, Send, Bot, User, ArrowLeft } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { askTutor } from '../lib/tutorClient';
import { matchTopic } from '../lib/curriculum';
import clsx from 'clsx';

const TUTORS = [
  { id: 1, name: "Socratic Guide", role: "Guides you to the answer", icon: BrainCircuit, color: "text-zinc-100", bg: "bg-white/10", greeting: "I won't give you the answer directly, but I'll help you find it. What's puzzling you?" },
  { id: 2, name: "Code Reviewer", role: "Analyzes and optimizes code", icon: Code, color: "text-zinc-300", bg: "bg-white/10", greeting: "Paste your code snippet and let's find some optimizations." },
  { id: 3, name: "Math Solver", role: "Step-by-step mathematical proofs", icon: Calculator, color: "text-zinc-400", bg: "bg-white/10", greeting: "Let's break down that equation step-by-step." }
];

export default function Tutor({ navigateTo, goBack }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTutor, setActiveTutor] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleTutorSelect = (tutor) => {
    if (activeTutor?.id === tutor.id) {
      setActiveTutor(null);
      return;
    }
    setActiveTutor(tutor);
    if (messages.length === 0 || messages[messages.length - 1]?.text !== tutor.greeting) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: tutor.greeting, tutor }]);
    }
    document.getElementById("tutor-query")?.focus();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    const text = query.trim();
    if (matchTopic(text)) {
      navigateTo?.(`dashboard/session?topic=${encodeURIComponent(text)}`);
      return;
    }
    setQuery('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }]);
    setLoading(true);

    try {
      const context = activeTutor ? { title: activeTutor.name } : {};
      const answer = await askTutor({ question: text, context });
      setMessages(prev => [...prev, { id: Date.now().toString() + '_resp', role: 'assistant', text: answer, tutor: activeTutor }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString() + '_err', role: 'assistant', text: "I'm sorry, I couldn't process that right now.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#09090c] font-sans">
      <header className="h-[60px] border-b border-[#37333b] flex items-center justify-between px-4 sm:px-8 bg-transparent z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack?.()}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <h1 className="text-sm font-semibold text-white flex items-center gap-2">
            {activeTutor ? (
              <>
                <activeTutor.icon className={clsx("w-4 h-4", activeTutor.color)} aria-hidden="true" />
                {activeTutor.name}
              </>
            ) : (
              'ConceptFlow Tutor'
            )}
          </h1>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setActiveTutor(null); setMessages([]); }} className="text-[12px] text-white/40 hover:text-white transition-colors">
            Clear Chat
          </button>
        )}
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto relative scrollbar-hide px-4 sm:px-8 py-6 pb-40">
        {messages.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center max-w-[640px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#0A0A0A] border border-white/10 mb-8 shadow-sm">
              <Bot className="w-5 h-5 text-zinc-300" aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-3 tracking-tight text-center">How can I help you today?</h1>
            <p className="text-[15px] text-white/40 mb-10 text-center">Select a specialized tutor or ask a question directly.</p>

            <div className="flex flex-wrap justify-center gap-2">
              {['Review my code snippet', 'Help me solve an equation', 'Explain this concept further', 'Explain Quantum Entanglement'].map(suggestion => (
                <button key={suggestion} onClick={() => setQuery(suggestion)} className="px-4 py-2 rounded-lg border border-white/5 bg-[#0A0A0A] hover:bg-[#111111] text-white/60 text-[13px] hover:text-white hover:border-white/10 transition-colors shadow-sm">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-8">
            {messages.map((m) => (
              <div key={m.id} className={clsx("flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && (
                  <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm", m.tutor ? m.tutor.bg : "bg-white/10")}>
                    {m.tutor ? <m.tutor.icon className={clsx("w-4 h-4", m.tutor.color)} aria-hidden="true" /> : <Bot className="w-4 h-4 text-white" aria-hidden="true" />}
                  </div>
                )}

                <div className={clsx(
                  "px-5 py-3.5 rounded-2xl text-[14.5px] leading-relaxed max-w-[85%]",
                  m.role === 'user'
                    ? "bg-[#1A1A1A] text-white border border-white/10 rounded-br-sm"
                    : "bg-transparent text-white/90 border border-white/5 rounded-bl-sm",
                  m.isError && "text-red-400 border-red-500/20"
                )}>
                  {m.text}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <User className="w-4 h-4 text-white/60" aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm", activeTutor ? activeTutor.bg : "bg-white/10")}>
                  {activeTutor ? <activeTutor.icon className={clsx("w-4 h-4", activeTutor.color)} aria-hidden="true" /> : <Bot className="w-4 h-4 text-white" aria-hidden="true" />}
                </div>
                <div className="px-5 py-4 rounded-2xl bg-transparent border border-white/5 rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input & Tutors Bar Fixed to Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#09090c] via-[#09090c] to-transparent pt-12">
        <div className="max-w-[700px] mx-auto w-full px-4 sm:px-8 flex flex-col gap-4 pb-6">
          <form onSubmit={handleSubmit} className="w-full relative">
            <div className="relative flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl hover:border-white/20 focus-within:border-white/30 transition-colors shadow-sm ring-4 ring-black/50">
              <div className="pl-4 pr-1 flex items-center justify-center shrink-0">
                <Sparkles className={clsx("w-5 h-5", activeTutor ? activeTutor.color : "text-zinc-500")} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <input
                id="tutor-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={activeTutor ? `Ask ${activeTutor.name}...` : "Message the tutor..."}
                autoComplete="off"
                className="flex-1 bg-transparent border-none text-zinc-200 py-3.5 px-2 focus:outline-none focus:ring-0 placeholder:text-zinc-600 text-[15px]"
              />
              <div className="pr-2 pl-1 shrink-0">
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 ml-0.5" strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>

          {/* Specialized Tutors Horizontally Scrollable Bar (Compact) */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {TUTORS.map(tutor => {
              const isActive = activeTutor?.id === tutor.id;
              return (
                <button
                  type="button"
                  key={tutor.id}
                  onClick={() => handleTutorSelect(tutor)}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 group",
                    isActive ? "bg-white/10 border-white/20" : "bg-transparent border-white/5 hover:bg-white/5"
                  )}
                >
                  <div className={clsx("w-5 h-5 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform", isActive ? tutor.bg : "bg-transparent")}>
                    <tutor.icon className={clsx("w-3 h-3", tutor.color)} aria-hidden="true" />
                  </div>
                  <span className={clsx("text-[12px] font-medium tracking-wide", isActive ? "text-white" : "text-white/60")}>{tutor.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
