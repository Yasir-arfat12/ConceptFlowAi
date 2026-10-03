import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, Play, MessageSquare, ClipboardList, CalendarCheck, ArrowLeft } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { buildPlanBundle } from '../lib/planner';
import { formatShortDate } from '../lib/format';
import DoubtDrawer from '../components/DoubtDrawer';

const GENERATE_MS = 1800;
const TABS = [
  { id: 'quiz', label: 'Quiz generation', icon: ClipboardList, dot: 'bg-[#10B981] shadow-[0_0_6px_#10B981]' },
  { id: 'plan', label: 'Study plan', icon: CalendarCheck, dot: 'bg-[#EAB308] shadow-[0_0_6px_#EAB308]' },
  { id: 'doubts', label: 'Doubt resolution', icon: MessageSquare, dot: 'bg-[#EAB308] shadow-[0_0_6px_#EAB308]' },
];

/**
 * Planner: Student Query -> Shared Context -> AI Planner -> (Quiz | Study plan | Doubts).
 * Generate runs the pipeline (stop cancels it) and each output node opens its
 * real result below. Results persist in the shared store.
 */
export default function Planner({ navigateTo, goBack }) {
  const { state, dispatch } = useApp();
  const plan = state.plan;
  const [topic, setTopic] = useState(plan?.topic ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dots, setDots] = useState(0);
  const [tab, setTab] = useState('plan');
  const [doubtOpen, setDoubtOpen] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!isGenerating) { setDots(0); return undefined; }
    const i = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(i);
  }, [isGenerating]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const toggle = () => {
    if (isGenerating) { clearTimeout(timer.current); setIsGenerating(false); return; }
    if (!topic.trim()) return;
    setIsGenerating(true);
    timer.current = setTimeout(() => {
      dispatch({ type: 'plan/set', plan: buildPlanBundle(topic) });
      setIsGenerating(false);
      setTab('plan');
    }, GENERATE_MS);
  };

  const ready = !!plan && !isGenerating;
  const doneCount = plan ? plan.items.filter((i) => i.done).length : 0;
  const arrow = (
    <div className="flex-1 flex items-center relative px-2 min-w-[40px]">
      <div className="w-full border-t border-dashed border-[#444450]" />
      <div className="absolute right-2 w-2 h-2 border-t border-r border-[#444450] transform rotate-45 -translate-y-[5px]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[6px] h-[6px] bg-[#666670] rounded-full" />
    </div>
  );
  const node = (label, title, sub) => (
    <div className="flex flex-col items-center shrink-0">
      <div className="w-[140px] h-[72px] rounded-xl bg-[#121215] border border-[#2A2A30] flex flex-col items-center justify-center relative shadow-lg">
        <div className="text-[10px] text-[#666670] uppercase tracking-wider font-semibold mb-1">{label}</div>
        <div className="text-[14px] text-white font-medium">{title}</div>
      </div>
      <div className="mt-3 text-[10px] text-[#666670] font-mono tracking-widest uppercase">{sub}</div>
    </div>
  );

  return (
    <div className="w-full h-full bg-transparent flex flex-col relative overflow-hidden font-mono tracking-tight">
      <header className="h-[60px] border-b border-[#37333b] flex items-center justify-between px-4 sm:px-8 bg-transparent z-20 shrink-0 font-sans">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => goBack?.()} 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">Study Planner</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto relative scrollbar-hide py-8 sm:py-12 px-4 sm:px-8">
        <div className="max-w-[1000px] mx-auto bg-[#0A0A0C] border border-[#2A2A30] rounded-xl overflow-hidden shadow-2xl relative shadow-black/50">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="overflow-x-auto scrollbar-hide">
            <div className="py-16 sm:py-24 px-8 sm:px-12 relative flex items-center justify-center min-w-[860px]">
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div className="flex items-center relative z-10 w-full justify-between max-w-[800px]">
                {node('Trigger', 'Student Query', 'concept · doubt')}
                {arrow}
                {node('Shared Context', 'Memory loaded', 'books + history')}
                {arrow}

                <div className="flex flex-col items-center relative z-20 shrink-0">
                  <div className={`w-[160px] h-[84px] rounded-2xl bg-[#0F0F12] border-2 flex flex-col items-center justify-center relative transition-all duration-500 ${isGenerating ? 'border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.05)]' : 'border-[#2A2A30] shadow-lg'}`}>
                    <div className={`text-[10px] uppercase tracking-wider font-bold mb-1 transition-colors ${isGenerating ? 'text-[#60A5FA]' : 'text-[#666670]'}`}>AI PLANNER</div>
                    <div className="text-[16px] text-white font-bold tracking-tight">{isGenerating ? 'Generating' : ready ? 'Done' : 'Ready'}</div>
                    {isGenerating && (
                      <div className="flex gap-1.5 mt-3" aria-hidden="true">
                        {[1, 2, 3].map((n) => <div key={n} className={`w-1.5 h-1.5 rounded-full ${dots >= n ? 'bg-white' : 'bg-white/20'}`} />)}
                      </div>
                    )}
                  </div>
                  <div className={`mt-4 text-[10px] font-mono tracking-widest uppercase transition-colors ${isGenerating ? 'text-[#60A5FA]' : 'text-[#666670]'}`} role="status">
                    {isGenerating ? 'processing active' : ready ? 'plan ready' : 'idle'}
                  </div>
                </div>

                <div className="w-[100px] flex items-center relative h-[120px] shrink-0">
                  <svg width="100" height="120" className="absolute left-0 top-1/2 -translate-y-1/2 overflow-visible" aria-hidden="true">
                    <path d="M 0 60 C 40 60, 40 10, 100 10" fill="none" stroke="#444450" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx="50" cy="35" r="3" fill="#666670" />
                    <path d="M 0 60 L 100 60" fill="none" stroke="#444450" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx="50" cy="60" r="3" fill="#666670" />
                    <path d="M 0 60 C 40 60, 40 110, 100 110" fill="none" stroke="#444450" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx="50" cy="85" r="3" fill="#666670" />
                  </svg>
                </div>

                <div className="flex flex-col justify-between h-[140px] relative z-10 shrink-0">
                  {TABS.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)} aria-pressed={tab === t.id}
                      className={`w-[160px] h-[40px] rounded-lg bg-[#121215] border flex items-center px-4 gap-3 shadow-lg hover:border-white/20 transition-colors cursor-pointer ${tab === t.id ? 'border-white/30' : 'border-[#2A2A30]'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ready ? t.dot : 'bg-[#444450]'}`} />
                      <div className="text-[13px] text-white/90 font-medium font-sans">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); toggle(); }} className="px-4 sm:px-12 pb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 relative z-20 font-sans">
            <label htmlFor="planner-topic" className="sr-only">Topic to plan</label>
            <input id="planner-topic" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={isGenerating} placeholder="What do you want to plan? e.g. Binary Search"
              className="flex-1 max-w-md bg-[#121212] border border-white/10 rounded-md px-4 py-3 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-60" />
            <button type="submit" disabled={!isGenerating && !topic.trim()}
              className="px-6 py-3 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isGenerating ? 'Stop' : plan ? 'Regenerate' : 'Generate'}
            </button>
          </form>

          {/* Results */}
          <div className="border-t border-[#2A2A30] p-4 sm:p-8 font-sans" aria-live="polite">
            {!plan && !isGenerating && <p className="text-[13px] text-white/40 text-center">Enter a topic and press Generate to build a study plan, a practice quiz and suggested doubts.</p>}
            {isGenerating && <p className="text-[13px] text-white/50 text-center">Building your plan for "{topic}"...</p>}
            {ready && tab === 'plan' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-semibold text-white">{plan.topic}: Study plan</h2>
                  <span className="text-[12px] text-white/50">{doneCount}/{plan.items.length} done</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-4" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={plan.items.length}>
                  <div className="h-full bg-[#10B981] rounded-full transition-all" style={{ width: `${(doneCount / plan.items.length) * 100}%` }} />
                </div>
                <ul className="flex flex-col gap-2">
                  {plan.items.map((it) => (
                    <li key={it.id}>
                      <button onClick={() => dispatch({ type: 'plan/toggle', id: it.id })} aria-pressed={it.done}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-[#121212] hover:border-white/20 transition-colors text-left">
                        {it.done ? <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" /> : <Circle className="w-5 h-5 text-white/20 shrink-0" />}
                        <span className={`flex-1 text-[13px] ${it.done ? 'text-white/30 line-through' : 'text-white/90'}`}>{it.title}</span>
                        <span className="text-[11px] text-white/40 shrink-0">{formatShortDate(it.dueAt)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigateTo(`dashboard/session?topic=${encodeURIComponent(plan.topic)}`)} className="mt-4 px-4 py-2 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-[13px] rounded-md transition-colors flex items-center gap-2"><Play className="w-3.5 h-3.5" /> Start first lesson</button>
              </div>
            )}
            {ready && tab === 'quiz' && (
              <div className="flex flex-col items-start gap-3">
                <h2 className="text-[15px] font-semibold text-white">{plan.quiz.topic}: Practice quiz</h2>
                <p className="text-[13px] text-white/50">{plan.quiz.count} questions selected for this topic. Your score updates your Career skill levels and Insights.</p>
                <button onClick={() => navigateTo(`dashboard/quiz?topic=${encodeURIComponent(plan.quiz.topic)}${plan.quiz.skill && plan.quiz.skill !== 'science' ? `&skill=${plan.quiz.skill}` : ''}`)} className="px-4 py-2 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors">Start quiz</button>
              </div>
            )}
            {ready && tab === 'doubts' && (
              <div className="flex flex-col gap-3">
                <h2 className="text-[15px] font-semibold text-white">Doubts to resolve</h2>
                {plan.doubts.map((d) => (
                  <button key={d} onClick={() => setDoubtOpen(d)} className="text-left p-3 rounded-lg border border-white/10 bg-[#121212] hover:border-white/20 text-[13px] text-white/80 transition-colors">{d}</button>
                ))}
                <button onClick={() => navigateTo('dashboard/doubts')} className="self-start text-[12px] text-white/50 hover:text-white transition-colors">Open all doubts</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DoubtDrawer open={!!doubtOpen} onClose={() => setDoubtOpen(null)} subtitle={plan?.topic} context={{ title: plan?.topic }}
        greeting={doubtOpen ? <>Let's tackle this: <strong className="text-white/90">{doubtOpen}</strong> Ask it below and I'll answer.</> : undefined} resumeLabel="Back to planner" />
    </div>
  );
}
