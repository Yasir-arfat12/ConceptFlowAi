import { Sparkles, BookOpen, Calculator, Globe, Code2, ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';

export default function NewChat({ navigateTo, goBack }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigateTo(`dashboard/session?topic=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="w-full h-full bg-[#000000] flex flex-col relative overflow-hidden font-sans">
      {/* Subtle ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.02] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.015] blur-[100px] pointer-events-none" />
      <header className="h-[60px] flex items-center px-4 sm:px-8 shrink-0 absolute top-0 left-0 w-full z-20">
        <button 
          onClick={() => goBack?.()} 
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 sm:px-8 py-20 z-10">
        <div className="w-full max-w-[640px] flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#050505] border border-white/10 mb-8 shadow-[0_0_30px_rgba(255,255,255,0.03)] ring-1 ring-white/5">
            <Sparkles className="w-5 h-5 text-white/70" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-3 tracking-tight">Research Topic</h1>
          <p className="text-[15px] text-white/40 mb-10 text-center max-w-md font-medium">Enter a topic or ask a question to begin a personalized deep dive.</p>

          <form onSubmit={handleSubmit} className="w-full relative mb-12">
            <div className="relative flex items-center bg-[#050505] border border-white/10 rounded-2xl hover:border-white/20 focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10 transition-all duration-200 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. How does photosynthesis work?"
                className="flex-1 bg-transparent border-none text-white/90 py-4 pl-5 pr-12 focus:outline-none focus:ring-0 placeholder:text-white/30 text-[15px] font-medium"
                autoFocus
              />
              <button
                type="submit"
                disabled={!query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 ml-0.5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </form>

          <div className="w-full">
            <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.2em] mb-4 pl-1">Suggested Topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Binary Search', desc: 'Divide and conquer algorithm', icon: Code2, prompt: 'Teach me Binary Search' },
                { title: 'Photosynthesis', desc: 'Cellular energy processes', icon: Globe, prompt: 'How does Photosynthesis work?' },
                { title: 'Quantum Mechanics', desc: 'Quantum entanglement explained', icon: BookOpen, prompt: 'Explain Quantum Entanglement' },
                { title: 'Linear Algebra', desc: 'Vectors, matrices, and spaces', icon: Calculator, prompt: 'Introduction to Linear Algebra' }
              ].map((item) => (
                <button
                  key={item.title}
                  onClick={() => setQuery(item.prompt)}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/5 bg-[#050505] hover:bg-[#0A0A0A] hover:border-white/10 transition-all duration-200 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#111111] transition-colors">
                    <item.icon className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white/70 group-hover:text-white transition-colors truncate">{item.title}</div>
                    <div className="text-[12px] text-white/40 truncate font-medium">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
