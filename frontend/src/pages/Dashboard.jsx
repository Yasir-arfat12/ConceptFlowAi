import { useMemo, useState } from 'react';
import { Search, Bell, Play, BookOpen, ChevronRight, LogOut } from 'lucide-react';
import { useApp, deriveStats, useUnreadCount } from '../store/AppStore';
import { getCurriculum } from '../lib/curriculum';
import DoubtDrawer from '../components/DoubtDrawer';

const TIMELINE_COLS = 8;
const GRID_LINES = Array.from({ length: TIMELINE_COLS + 1 }, (_, i) => i);

const LEARNING_PATHS = [
  {
    id: 1,
    title: "Machine Learning Foundations",
    type: "Core • 12 Modules",
    color: "bg-[#06B6D4]", // Cyan
    gradient: "from-[#06B6D4]/30 to-[#06B6D4]/5",
    progress: 60,
    startCol: 1,
    span: 4,
    milestones: [
      { name: "Supervised", pos: 20 },
      { name: "Unsupervised", pos: 60 },
    ]
  },
  {
    id: 2,
    title: "Neural Networks",
    type: "Advanced • In Progress",
    color: "bg-[#10B981]", // Green
    gradient: "from-[#10B981]/30 to-[#10B981]/5",
    progress: 80,
    startCol: 0,
    span: 5,
    milestones: [
      { name: "Perceptrons", pos: 15 },
      { name: "Backprop", pos: 50 },
      { name: "Optimization", pos: 85 }
    ]
  },
  {
    id: 3,
    title: "Natural Language Processing",
    type: "Specialization • Scheduled",
    color: "bg-zinc-300",
    gradient: "from-zinc-300/30 to-zinc-300/5",
    progress: 30,
    startCol: 2,
    span: 4.5,
    milestones: [
      { name: "Tokenization", pos: 25 },
      { name: "Attention", pos: 75 }
    ]
  },
  {
    id: 4,
    title: "Transformer Architecture",
    type: "Deep Dive • Locked",
    color: "bg-[#EAB308]", // Yellow
    gradient: "from-[#EAB308]/30 to-transparent",
    progress: 0,
    startCol: 5.5,
    span: 2.5,
    milestones: [
      { name: "Self-Attention", pos: 40 },
      { name: "BERT/GPT", pos: 80 }
    ]
  },
  {
    id: 5,
    title: "Capstone Portfolio",
    type: "Final • Locked",
    color: "bg-[#F43F5E]", // Rose
    gradient: "from-[#F43F5E]/30 to-transparent",
    progress: 0,
    startCol: 1,
    span: 4,
    milestones: [
      { name: "Ideation", pos: 30 },
      { name: "Deployment", pos: 70 }
    ]
  }
];

/** Week-start labels for the timeline axis, anchored to today (was hardcoded AUG/SEP). */
function buildWeekLabels(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 35); // Monday, five weeks back
  return GRID_LINES.map((i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i * 7);
    const major = i === 0 || d.getDate() <= 7;
    const day = String(d.getDate()).padStart(2, '0');
    return { major, text: major ? `${d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${day}` : day };
  });
}

export default function Dashboard({ navigateTo }) {
  const [selectedPath, setSelectedPath] = useState(null);
  const { state, dispatch } = useApp();
  const unread = useUnreadCount();
  const stats = deriveStats(state);
  const weekLabels = useMemo(() => buildWeekLabels(), []);
  const cont = useMemo(() => {
    const last = Object.values(state.progress).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    if (!last) return { title: 'Binary Search', done: 0, total: 4, pct: 0, next: 'Introduction' };
    const cur = getCurriculum(last.title);
    return { title: last.title, done: last.done, total: last.total, pct: Math.round((last.done / last.total) * 100), next: cur.concepts[Math.min(last.done, cur.concepts.length - 1)].title };
  }, [state.progress]);
  const resume = () => navigateTo?.(`dashboard/session?topic=${encodeURIComponent(cont.title)}`);

  // Dynamically compute the learning paths based on progress state
  const learningPaths = useMemo(() => {
    const progressList = Object.values(state.progress).sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    return progressList.map((p, i) => {
      const colors = [
        { color: "bg-[#06B6D4]", gradient: "from-[#06B6D4]/30 to-[#06B6D4]/5" },
        { color: "bg-[#10B981]", gradient: "from-[#10B981]/30 to-[#10B981]/5" },
        { color: "bg-zinc-300", gradient: "from-zinc-300/30 to-zinc-300/5" },
        { color: "bg-[#EAB308]", gradient: "from-[#EAB308]/30 to-transparent" },
        { color: "bg-[#F43F5E]", gradient: "from-[#F43F5E]/30 to-transparent" }
      ];
      const theme = colors[i % colors.length];
      const pct = Math.round((p.done / Math.max(1, p.total)) * 100);
      const cur = getCurriculum(p.title);
      
      const milestones = cur.concepts.slice(0, 3).map((c, idx) => ({
        name: c.title,
        pos: ((idx + 1) / Math.max(1, p.total)) * 100
      }));

      // layout offsets for horizontal timeline visualization
      const startCol = i % 2;
      const span = Math.max(3, Math.min(6, p.total));

      return {
        id: i + 1,
        title: p.title,
        type: `Core • ${p.total} Modules`,
        color: theme.color,
        gradient: theme.gradient,
        progress: pct,
        startCol,
        span,
        milestones
      };
    });
  }, [state.progress]);

  return (
    <div className="w-full h-full bg-transparent flex flex-col relative overflow-hidden font-sans">

      {/* Top Header */}
      <header className="h-[60px] border-b border-[#37333b] flex items-center justify-between px-4 sm:px-8 bg-transparent z-20 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-white">Dashboard Overview</h1>
          <span className="flex items-center justify-center text-zinc-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>
          </span>
          <span className="text-white/30 text-xs" aria-hidden="true">•••</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2 text-sm text-white/60 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
            Live
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigateTo?.('dashboard/chat')} aria-label="Start a new learning session" className="relative w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors border border-white/5">
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={() => navigateTo?.('dashboard/inbox')} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors border border-white/5">
              <Bell className="w-4 h-4" aria-hidden="true" />
              {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-white text-black text-[10px] font-semibold flex items-center justify-center">{unread}</span>}
            </button>
            {/* Student Interface Profile */}
            <div className="h-8 flex items-center gap-1 pl-3 border-l border-white/10 ml-1">
              <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer mr-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-500 to-zinc-300 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
                  {state.user.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-[13px] font-medium text-white/90 hidden sm:block">{state.user.name}</span>
              </div>
              <button 
                onClick={() => {
                  dispatch({ type: 'user/logout' });
                  navigateTo?.('auth');
                }} 
                aria-label="Log out" 
                title="Log out"
                className="relative w-8 h-8 rounded bg-transparent flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto relative scrollbar-hide">
        <div className="p-4 sm:p-8 pb-12 flex flex-col gap-8 max-w-[1200px] mx-auto">

          {/* Welcome & Stats */}
          <section className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <h2 className="text-[28px] sm:text-[37px] leading-[0.95] tracking-tight font-bold bg-gradient-to-b from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent mb-3">Welcome back, {state.user.name}!</h2>
              <p className="text-lg text-white/50">You're making excellent progress on your {cont.title} path.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stat Card 1 */}
              <div className="rounded-xl border border-white/10 bg-transparent p-5 flex flex-col justify-center h-[104px]">
                <div className="text-[13px] text-white/50 font-medium mb-1">Current streak</div>
                <div className="text-[32px] leading-none font-medium text-white tracking-tight">{stats.streak} <span className="text-xl text-white/40 tracking-normal font-normal">Days</span></div>
              </div>

              {/* Stat Card 2 */}
              <div className="rounded-xl border border-white/10 bg-transparent p-5 flex flex-col justify-center h-[104px]">
                <div className="text-[13px] text-white/50 font-medium mb-1">Time learned</div>
                <div className="text-[32px] leading-none font-medium text-white tracking-tight">{stats.hours} <span className="text-xl text-white/40 tracking-normal font-normal">hrs</span></div>
              </div>

              {/* Stat Card 3 */}
              <div className="rounded-xl border border-white/10 bg-transparent p-5 flex flex-col justify-center h-[104px]">
                <div className="text-[13px] text-white/50 font-medium mb-1">Concepts completed</div>
                <div className="text-[32px] leading-none font-medium text-white tracking-tight">{stats.concepts}</div>
              </div>
            </div>
          </section>

          {/* Continue Learning */}
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-medium text-white/70">Continue Learning</h3>
              <button onClick={() => navigateTo?.('dashboard/history')} className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div
              className="rounded-xl border border-white/10 bg-[#09090b] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-colors hover:border-white/20 cursor-pointer"
              onClick={resume}
            >
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                    <span className="text-[10px] font-medium text-[#10B981] tracking-wider uppercase">In Progress • Core</span>
                  </div>
                  <div className="text-[15px] font-medium text-white mb-0.5">{cont.title}: {cont.next}</div>
                  <div className="text-[13px] text-white/50">{`Concept ${Math.min(cont.done + 1, cont.total)} of ${cont.total} • Pick up right where you left off.`}</div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col gap-2 w-32 hidden sm:flex">
                  <div className="flex justify-between items-center text-[10px] text-white/40 font-medium uppercase tracking-wider">
                    <span>Progress</span>
                    <span className="text-white/70">{cont.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#10B981]/50 to-[#10B981] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${cont.pct}%` }}></div>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Resume
                </button>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            <h3 className="text-[14px] font-medium text-white/70">Learning Timeline</h3>
            <div className="rounded-xl border border-[#37333b] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_68%),linear-gradient(#09090c,#09090c)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.7)] overflow-hidden relative">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="min-w-[900px] min-h-[450px] p-8 pb-16 relative">

                  {/* Vertical Grid Lines & Dates */}
                  <div className="absolute top-0 bottom-0 left-8 right-8 flex justify-between z-0 pointer-events-none">
                    {GRID_LINES.map((i) => (
                      <div key={i} className="h-full w-px bg-white/[0.03] relative">
                        <span className={`absolute -translate-x-1/2 text-[10px] text-white/30 font-medium tracking-widest ${weekLabels[i].major ? 'top-4' : 'top-8'}`}>{weekLabels[i].text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connection Lines (SVG) - Hardcoded for visual fidelity to reference */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ top: '160px', left: '32px', width: 'calc(100% - 64px)' }}>
                    {/* Curved line connecting NLP to Transformers */}
                    <path
                      d={`M ${(6.5 / 8) * 100}%, 230 C ${(6.8 / 8) * 100}%, 230 ${(6.2 / 8) * 100}%, 330 ${(5.5 / 8) * 100}%, 330`}
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* Rows */}
                  <div className="relative z-20 mt-24 flex flex-col gap-12">
                    {learningPaths.map((path) => (
                      <div
                        key={path.id}
                        className="relative w-full flex flex-col gap-2 group cursor-pointer rounded-sm"
                        role="button" tabIndex={0} aria-label={`Open tutor for ${path.title}, ${path.progress}% mastery`}
                        onClick={() => setSelectedPath(path)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPath(path); } }}
                      >

                        {/* Track Label */}
                        <div className="flex items-center gap-2 mb-1" style={{ marginLeft: `${(path.startCol / TIMELINE_COLS) * 100}%` }}>
                          <div className={`w-1.5 h-1.5 ${path.color}`}></div>
                          <span className="text-xs font-semibold text-white/90 group-hover:text-white transition-colors">{path.title}</span>
                          <span className="text-[9px] text-white/30 uppercase tracking-widest">{path.type}</span>
                        </div>

                        {/* Track Bar */}
                        <div className="relative h-8 w-full flex">
                          {/* Offset empty space */}
                          <div style={{ width: `${(path.startCol / TIMELINE_COLS) * 100}%` }}></div>

                          {/* The Bar Container */}
                          <div
                            className="relative h-8 bg-[#121212] border border-white/5 rounded-[3px] overflow-hidden group-hover:border-white/10 transition-colors"
                            style={{ width: `${(path.span / TIMELINE_COLS) * 100}%` }}
                          >
                            {/* Progress Fill */}
                            {path.progress > 0 && (
                              <div
                                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${path.gradient}`}
                                style={{ width: `${path.progress}%` }}
                              ></div>
                            )}

                            {/* Milestones inside track */}
                            {path.milestones.map((m, i) => (
                              <div
                                key={i}
                                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                                style={{ left: `${m.pos}%` }}
                              >
                                <div className="w-1.5 h-1.5 rotate-45 bg-white/40 border border-[#121212] group-hover:bg-white/70 transition-colors"></div>
                                <span className="absolute top-5 text-[9px] text-white/40 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100 transition-opacity">
                                  {m.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* AI Tutor Slide-out Drawer (wired to the tutor client and the shared Doubts store) */}
      <DoubtDrawer
        open={!!selectedPath}
        onClose={() => setSelectedPath(null)}
        subtitle={selectedPath?.title}
        context={{ title: selectedPath?.title }}
        resumeLabel="Close tutor"
        greeting={selectedPath && (
          <>
            Hello! I see you're focusing on <strong className="text-white/90">{selectedPath.title}</strong> today.
            Based on your timeline, you have {selectedPath.progress}% mastery so far.
            Would you like me to quiz you on {selectedPath.milestones[0]?.name}, or do you want to learn something new?
          </>
        )}
      />

    </div>
  );
}
