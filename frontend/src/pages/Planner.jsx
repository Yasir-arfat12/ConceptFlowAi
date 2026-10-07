import { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  Lock,
  Play,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  Compass,
  Zap,
  Check,
} from 'lucide-react';
import { useApp } from '../store/AppStore';
import { learningApi } from '../lib/api';
import DoubtDrawer from '../components/DoubtDrawer';

const SUGGESTED_TOPIC_PILLS = [
  { name: 'Binary Search', ready: true, label: 'Binary Search' },
  { name: 'Dynamic Programming', ready: false, label: 'Dynamic Programming' },
  { name: 'Graph Algorithms', ready: false, label: 'Graph Algorithms' },
  { name: 'System Design', ready: false, label: 'System Design' },
];

export default function Planner({ navigateTo, goBack }) {
  const { state, dispatch } = useApp();
  const [topic, setTopic] = useState('Binary Search');
  const [isGenerating, setIsGenerating] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionConcepts, setSessionConcepts] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [doubtOpen, setDoubtOpen] = useState(null);

  // Load existing session & plan on mount
  useEffect(() => {
    let active = true;
    async function loadInitialPlan() {
      try {
        setIsGenerating(true);
        setErrorMsg('');

        // 1. Fetch curriculum preview from backend
        const previewRes = await learningApi.getPreview('Binary Search');
        const preview = previewRes?.data || previewRes;

        // 2. Check if user already has an active session for Binary Search
        let existingActive = null;
        let conceptsList = [];
        try {
          const sessionsRes = await learningApi.getSessions();
          const sessions = sessionsRes?.data?.sessions || sessionsRes?.sessions || [];
          existingActive = sessions.find(
            (s) => (s.topic?.toLowerCase().includes('binary search') || s.topic?.toLowerCase().includes('binary-search')) && s.status === 'active'
          );

          if (existingActive) {
            const fullSessionRes = await learningApi.getSession(existingActive.id);
            const fullData = fullSessionRes?.data || fullSessionRes;
            existingActive = fullData?.session || existingActive;
            conceptsList = fullData?.concepts || [];
          }
        } catch {
          // Ignore session fetch errors on initial preview
        }

        if (active) {
          setPlanData(preview);
          setActiveSession(existingActive);
          setSessionConcepts(conceptsList);
        }
      } catch (err) {
        if (active) {
          console.warn('[Planner] Failed to load preview:', err);
        }
      } finally {
        if (active) setIsGenerating(false);
      }
    }

    loadInitialPlan();
    return () => {
      active = false;
    };
  }, []);

  // Handle plan generation for entered topic
  const handleGenerate = async (topicToUse) => {
    const cleanTopic = (topicToUse || topic || '').trim();
    if (!cleanTopic || isGenerating) return;

    try {
      setIsGenerating(true);
      setErrorMsg('');

      // Fetch preview from backend
      const previewRes = await learningApi.getPreview(cleanTopic);
      const preview = previewRes?.data || previewRes;
      setPlanData(preview);

      // If supported (Binary Search), check if user has an active session
      if (preview?.isSupported) {
        try {
          const sessionsRes = await learningApi.getSessions();
          const sessions = sessionsRes?.data?.sessions || sessionsRes?.sessions || [];
          const existing = sessions.find(
            (s) => (s.topic?.toLowerCase().includes('binary search') || s.topic?.toLowerCase().includes('binary-search')) && s.status === 'active'
          );

          if (existing) {
            const fullRes = await learningApi.getSession(existing.id);
            const fullData = fullRes?.data || fullRes;
            setActiveSession(fullData?.session || existing);
            setSessionConcepts(fullData?.concepts || []);
          } else {
            setActiveSession(null);
            setSessionConcepts([]);
          }
        } catch {
          setActiveSession(null);
          setSessionConcepts([]);
        }
      } else {
        setActiveSession(null);
        setSessionConcepts([]);
      }
    } catch (err) {
      console.error('[Planner] Generation error:', err);
      setErrorMsg('Failed to load plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Start or resume session
  const handleStartSession = async () => {
    if (isStarting) return;
    try {
      setIsStarting(true);
      setErrorMsg('');

      // If active session exists, directly navigate with its sessionId
      if (activeSession?.id) {
        navigateTo?.(`dashboard/session?sessionId=${activeSession.id}`);
        return;
      }

      // Otherwise create or resume a session from backend
      const res = await learningApi.startSession('Binary Search', { resumeIfExists: true });
      const data = res?.data || res;
      const targetSession = data?.session || data;

      if (targetSession?.id) {
        navigateTo?.(`dashboard/session?sessionId=${targetSession.id}`);
      } else {
        throw new Error('No session ID returned from backend.');
      }
    } catch (err) {
      console.error('[Planner] Start session error:', err);
      setErrorMsg('Unable to start your session. Please try again.');
      setIsStarting(false);
    }
  };

  // Select a suggested topic pill
  const handleSelectPill = (pill) => {
    setTopic(pill.label);
    handleGenerate(pill.label);
  };

  const isSupported = planData?.isSupported;
  const concepts = planData?.concepts || [];

  return (
    <div className="w-full h-full bg-[#050508] text-white flex flex-col relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[350px] h-[300px] bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="h-[64px] border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-8 bg-[#07070a]/80 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack?.()}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-violet-400" />
              Interactive Study Planner
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative scrollbar-hide py-8 sm:py-10 px-4 sm:px-8">
        <div className="max-w-[900px] mx-auto flex flex-col gap-8">
          
          {/* ═══════════════════════════════════════════════════════════════
              SECTION 1: SEARCH / TOPIC INPUT
              ═══════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl bg-[#0b0b10] border border-white/10 p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              What do you want to learn?
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-4">
              Generate a Personalized Learning Plan
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerate();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4"
            >
              <div className="relative flex-1">
                <input
                  id="planner-topic-input"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating || isStarting}
                  placeholder="e.g. Binary Search"
                  className="w-full bg-[#121218] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={isGenerating || isStarting || !topic.trim()}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-violet-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Planning...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Plan
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-white/40 mr-1 font-medium">Suggestions:</span>
              {SUGGESTED_TOPIC_PILLS.map((pill) => (
                <button
                  key={pill.name}
                  onClick={() => handleSelectPill(pill)}
                  disabled={isGenerating || isStarting}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                    topic.toLowerCase() === pill.label.toLowerCase()
                      ? 'bg-violet-500/15 border-violet-500/40 text-violet-300 font-medium'
                      : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:border-white/20'
                  }`}
                >
                  {pill.name}
                  {pill.ready ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                  ) : (
                    <span className="text-[10px] text-white/40 font-mono">soon</span>
                  )}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 2: PLAN RESULTS (SUPPORTED: BINARY SEARCH)
              ═══════════════════════════════════════════════════════════════ */}
          {isSupported && planData && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
              
              {/* Plan Card */}
              <div className="rounded-2xl bg-[#0b0b10] border border-white/10 p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Top / Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                      <Zap className="w-3.5 h-3.5" />
                      Verified Curriculum • Ready to Learn
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                      {planData.topic}
                    </h3>
                    <p className="text-sm text-white/70 max-w-xl leading-relaxed">
                      {planData.description}
                    </p>
                  </div>

                  {/* Active Status Badge if session exists */}
                  {activeSession && (
                    <div className="sm:self-start bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2 rounded-xl text-left shrink-0">
                      <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Session in progress
                      </div>
                      <div className="text-xs text-white/70 font-medium">
                        {activeSession.progress_percentage || 0}% completed
                      </div>
                    </div>
                  )}
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 relative z-10">
                  {(planData.features || [
                    '6 Structured Concepts',
                    'Interactive Checkpoints',
                    'Progressive Difficulty',
                    'Cloud Session Sync',
                  ]).map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#121218] border border-white/5 text-xs text-white/80 font-medium flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    PROMINENT START SESSION / CONTINUE SESSION CTA BUTTON
                    ═══════════════════════════════════════════════════════════════ */}
                <div className="pt-2 pb-2 relative z-10">
                  <button
                    onClick={handleStartSession}
                    disabled={isStarting}
                    className="w-full sm:w-auto min-w-[240px] px-8 py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-base rounded-xl transition-all duration-200 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Starting Session...</span>
                      </>
                    ) : activeSession ? (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>Continue Learning Session →</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>Start Learning Session →</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-white/40 mt-2.5">
                    {activeSession
                      ? 'Resumes from your active concept in PostgreSQL'
                      : 'Creates your persistent learning session in PostgreSQL with interactive checkpoints'}
                  </p>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  LEARNING JOURNEY TIMELINE
                  ═══════════════════════════════════════════════════════════════ */}
              <div className="rounded-2xl bg-[#0b0b10] border border-white/10 p-6 sm:p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-violet-400" />
                      Learning Journey & Concept Milestones
                    </h4>
                    <p className="text-xs text-white/50 mt-1">
                      Sequential mastery path verified by PostgreSQL checkpoint evaluations
                    </p>
                  </div>
                  <span className="text-xs font-mono text-white/40 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    {concepts.length} Concepts
                  </span>
                </div>

                {/* Timeline Items */}
                <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-[15px] sm:before:left-[19px] before:top-3 before:bottom-3 before:w-[2px] before:bg-white/10">
                  {concepts.map((concept, index) => {
                    const conceptNum = String(concept.orderIndex || index + 1).padStart(2, '0');
                    
                    // Match with active session status if available
                    const sessionConcept = sessionConcepts.find(
                      (c) => c.order_index === (concept.orderIndex || index + 1) || c.title === concept.title
                    );
                    const status = sessionConcept?.status || (index === 0 ? 'active' : 'locked');

                    const isCompleted = status === 'completed';
                    const isActive = status === 'active';
                    const isLocked = status === 'locked';

                    return (
                      <div key={concept.title || index} className="relative group">
                        {/* Node circle on timeline */}
                        <div
                          className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                              : isActive
                              ? 'bg-violet-600 text-white ring-4 ring-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                              : 'bg-[#181820] border border-white/20 text-white/40'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            conceptNum
                          )}
                        </div>

                        {/* Card Content */}
                        <div
                          className={`p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-[#12121c] border-violet-500/40 shadow-lg shadow-violet-500/5'
                              : isCompleted
                              ? 'bg-[#0e1410] border-emerald-500/25'
                              : 'bg-[#0e0e14] border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-mono text-white/40">
                              CONCEPT {conceptNum}
                            </span>
                            
                            {/* Status Badge */}
                            {isCompleted ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed
                              </span>
                            ) : isActive ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/40 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Locked
                              </span>
                            )}
                          </div>

                          <h5 className="text-sm sm:text-base font-semibold text-white mb-1">
                            {concept.title}
                          </h5>

                          {concept.keyTakeaways && (
                            <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mt-1">
                              {concept.keyTakeaways.replace(/•/g, '').trim()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom CTA within timeline */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-white/50">
                    Ready to start your mastery sequence?
                  </div>
                  <button
                    onClick={handleStartSession}
                    disabled={isStarting}
                    className="px-5 py-2.5 bg-white text-black font-semibold text-xs sm:text-sm rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {activeSession ? 'Continue Learning' : 'Start Concept 1'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 3: UNSUPPORTED TOPIC / COMING SOON STATE
              ═══════════════════════════════════════════════════════════════ */}
          {!isSupported && planData && (
            <div className="rounded-2xl bg-[#0b0b10] border border-white/10 p-6 sm:p-8 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
                <Clock className="w-3.5 h-3.5" />
                Coming Soon
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                Learning Path for "{topic}" is in Development
              </h3>
              
              <p className="text-sm text-white/60 leading-relaxed max-w-xl mb-8">
                To guarantee top pedagogical quality and deterministic grading, our AI learning engine currently features verified curriculum and checkpoints for <strong>Binary Search</strong>. Additional data structure & algorithm topics are rolling out shortly.
              </p>

              {/* Spotlight on Binary Search */}
              <div className="p-6 rounded-xl bg-[#12121a] border border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                    Featured Topic
                  </span>
                  <h4 className="text-lg font-bold text-white mt-2 mb-1">
                    Binary Search Masterclass
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed max-w-md">
                    Explore 6 structured concepts, interactive checkpoint grading, edge cases, and algorithmic complexity.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setTopic('Binary Search');
                    handleGenerate('Binary Search');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg hover:shadow-violet-600/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Explore Binary Search →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Doubt Drawer for contextual inquiries */}
      <DoubtDrawer
        open={!!doubtOpen}
        onClose={() => setDoubtOpen(null)}
        subtitle={planData?.topic || topic}
        context={{ title: planData?.topic || topic }}
        greeting={
          doubtOpen ? (
            <>
              Let's address this: <strong className="text-white/90">{doubtOpen}</strong>. Ask below and I'll explain.
            </>
          ) : undefined
        }
        resumeLabel="Back to planner"
      />
    </div>
  );
}
