import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Bell,
  Play,
  BookOpen,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Flame,
  Award,
  Clock,
  RotateCcw,
  Compass,
  Lock,
  CircleDot,
  BrainCircuit,
} from 'lucide-react';
import { useApp, useUnreadCount } from '../store/AppStore';
import { dashboardApi, learningApi } from '../lib/api';

const SUGGESTED_TOPICS = [
  { title: 'Binary Search', desc: 'Divide-and-conquer search algorithm', prompt: 'Teach me Binary Search' },
  { title: 'Neural Networks', desc: 'Perceptrons, weights & backprop', prompt: 'Teach me Neural Networks' },
  { title: 'Data Structures', desc: 'Trees, hash maps & graphs', prompt: 'Teach me Data Structures' },
  { title: 'Linear Algebra', desc: 'Vectors, matrices & transformations', prompt: 'Teach me Linear Algebra' },
];

export default function Dashboard({ navigateTo }) {
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const { state, dispatch } = useApp();
  const unread = useUnreadCount();

  // Fetch real PostgreSQL dashboard & mastery data
  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await dashboardApi.getDashboard();
        if (active) {
          const payload = res.data || res;
          setDbData(payload);
          if (payload.user) {
            dispatch({ type: 'user/set', user: payload.user });
          }
        }
      } catch (err) {
        console.warn('[Dashboard] Could not fetch dashboard data:', err.message);
        if (active) {
          setDbData({
            stats: {
              conceptsCompleted: 0,
              totalConcepts: 0,
              assignmentsCompleted: 0,
              quizzesCompleted: 0,
              averageScore: 0,
              streakDays: 0,
              hoursLearned: 0,
              totalResponses: 0,
            },
            mastery: {
              overallScore: 0,
              masteryLabel: 'Not Started',
              breakdown: { mastered: 0, developing: 0, needsPractice: 0, notStarted: 0 },
              strongAreas: [],
              areasToImprove: [],
              allConcepts: [],
              trend: [],
              nextFocus: null,
              consistency: { days: [], activeDaysThisWeek: 0 },
              insight: 'Your mastery journey starts here.',
            },
            activeSessions: [],
            recentSessions: [],
            activeSessionId: null,
            currentConcept: null,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      active = false;
    };
  }, [dispatch]);

  const userName = dbData?.user?.name || state.user?.name || 'Learner';
  const stats = dbData?.stats || {
    conceptsCompleted: 0,
    totalConcepts: 0,
    assignmentsCompleted: 0,
    quizzesCompleted: 0,
    averageScore: 0,
    streakDays: 0,
    hoursLearned: 0,
    totalResponses: 0,
  };

  const mastery = dbData?.mastery || {
    overallScore: 0,
    masteryLabel: 'Not Started',
    breakdown: { mastered: 0, developing: 0, needsPractice: 0, notStarted: 0 },
    strongAreas: [],
    areasToImprove: [],
    allConcepts: [],
    trend: [],
    nextFocus: null,
    consistency: { days: [], activeDaysThisWeek: 0 },
    insight: 'Your mastery journey starts here.',
  };

  const activeSessions = dbData?.activeSessions || [];
  const activeSession = activeSessions[0] || null;
  const currentConcept = dbData?.currentConcept || null;
  const activeSessionConcepts = dbData?.activeSessionConcepts || [];

  const hasHistory =
    stats.conceptsCompleted > 0 ||
    activeSessions.length > 0 ||
    (dbData?.recentSessions && dbData.recentSessions.length > 0) ||
    stats.totalResponses > 0;

  // Start new learning session
  const handleStartLearning = async (topicToStart) => {
    const topic = (topicToStart || newTopic).trim();
    if (!topic || starting) return;
    try {
      setStarting(true);
      setStartError('');
      const res = await learningApi.startSession(topic);
      const session = res?.data?.session || res?.session;
      if (session?.id) {
        navigateTo?.(`dashboard/session?sessionId=${session.id}`);
      } else {
        navigateTo?.(`dashboard/session?topic=${encodeURIComponent(topic)}`);
      }
    } catch (err) {
      setStartError(err.message || 'Failed to start learning session.');
      navigateTo?.(`dashboard/session?topic=${encodeURIComponent(topic)}`);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen bg-black flex flex-col items-center justify-center text-white/50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-white/70" />
        <span className="text-sm font-medium">Loading your personalized learning dashboard...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black text-white flex flex-col relative overflow-hidden font-sans select-none">
      {/* Top Header */}
      <header className="h-[60px] border-b border-white/5 flex items-center justify-between px-4 sm:px-8 shrink-0 bg-[#0A0A0A] z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Personalized Learning Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo?.('dashboard/inbox')}
            aria-label="Notifications"
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative scrollbar-hide">
        <div className="max-w-[1240px] mx-auto p-4 sm:p-8 pb-20 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          
          {/* Welcome Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                Welcome back, {userName} <span className="animate-pulse">👋</span>
              </h2>
              <p className="text-sm sm:text-base text-white/50 mt-1">
                {hasHistory ? 'Ready to continue mastering your concepts today?' : 'What do you want to learn today?'}
              </p>
            </div>

            {hasHistory && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateTo?.('dashboard/insights')}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs sm:text-sm font-medium text-white/80 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  View Full Mastery
                </button>
              </div>
            )}
          </div>

          {!hasHistory ? (
            /* ════════════════════════════════════════════════════════════════════════
               BRAND NEW USER: ONBOARDING EMPTY STATE
               ════════════════════════════════════════════════════════════════════════ */
            <div className="flex flex-col gap-8">
              <div className="p-8 sm:p-12 rounded-2xl border border-white/10 bg-[#09090b] relative overflow-hidden flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-emerald-400 shadow-sm">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Your mastery journey starts here
                </h3>
                <p className="text-sm sm:text-base text-white/50 max-w-lg mb-8 leading-relaxed">
                  Start your first concept-by-concept learning session. Your understanding profile, concept mastery, and insights will build automatically.
                </p>

                {/* Topic Search Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleStartLearning();
                  }}
                  className="w-full max-w-xl flex items-center bg-[#121212] border border-white/10 rounded-xl p-1.5 focus-within:border-white/30 transition-all shadow-lg"
                >
                  <Search className="w-5 h-5 text-white/40 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Teach me Binary Search, Neural Networks..."
                    className="flex-1 bg-transparent border-none text-sm text-white px-3 py-2.5 focus:outline-none placeholder:text-white/30"
                  />
                  <button
                    type="submit"
                    disabled={!newTopic.trim() || starting}
                    className="px-5 py-2.5 bg-white text-black font-semibold text-xs sm:text-sm rounded-lg hover:bg-white/90 disabled:opacity-40 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    Start Learning
                  </button>
                </form>

                {startError && (
                  <p className="text-xs text-[#F43F5E] mt-3">{startError}</p>
                )}
              </div>

              {/* Suggested Topics Grid */}
              <div>
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
                  Or pick a foundational topic
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SUGGESTED_TOPICS.map((topic) => (
                    <button
                      key={topic.title}
                      onClick={() => handleStartLearning(topic.title)}
                      disabled={starting}
                      className="p-5 rounded-xl border border-white/10 bg-[#09090b] hover:bg-[#121212] hover:border-white/20 transition-all text-left flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
                            {topic.title}
                          </h5>
                          <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed">{topic.desc}</p>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-400/80 mt-4 flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" /> Start topic
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════════════
               EXISTING STUDENT: PERSONALIZED MASTERY INTELLIGENCE DASHBOARD
               ════════════════════════════════════════════════════════════════════════ */
            <div className="flex flex-col gap-8">
              
              {/* Top Row: Continue Learning & Overall Mastery */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Continue Learning Card (7 cols) */}
                <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#09090b] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CircleDot className="w-3.5 h-3.5 animate-pulse" />
                        Current Learning Session
                      </span>
                      {activeSession && (
                        <span className="text-xs text-white/40 font-mono">
                          {activeSession.progress_percentage || 0}% complete
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                      {activeSession?.topic || 'No active session'}
                    </h3>

                    {currentConcept ? (
                      <p className="text-sm text-white/70 flex items-center gap-2 mb-6">
                        <span className="text-white/40">Currently learning:</span>
                        <strong className="text-white font-medium">"{currentConcept.title}"</strong>
                        {currentConcept.order_index && (
                          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                            Concept {currentConcept.order_index} of {activeSession?.total_concepts || 6}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-white/50 mb-6">
                        All concepts in your previous topic are completed. Start another topic or review!
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(activeSession?.progress_percentage || 0, 5)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
                    {activeSession ? (
                      <button
                        onClick={() => navigateTo?.(`dashboard/session?sessionId=${activeSession.id}`)}
                        className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Continue Learning
                      </button>
                    ) : (
                      <button
                        onClick={() => navigateTo?.('dashboard/chat')}
                        className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Start New Topic
                      </button>
                    )}

                    <span className="text-xs text-white/40">
                      {stats.conceptsCompleted} of {stats.totalConcepts} total concepts mastered
                    </span>
                  </div>
                </div>

                {/* 2. Overall Mastery Card (5 cols) */}
                <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#09090b] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Overall Mastery
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      {mastery.masteryLabel}
                    </span>
                  </div>

                  {/* Radial / Gauge Visualization */}
                  <div className="flex items-center gap-6 my-auto py-2">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-white/10 fill-none"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-emerald-400 fill-none transition-all duration-700"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * (mastery.overallScore || 0)) / 100}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                          {mastery.overallScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="text-xs text-white/60 leading-relaxed">
                        Based on your checkpoint evaluation performance across verified concepts.
                      </div>
                      <div className="text-[11px] text-white/40">
                        Avg Checkpoint Score: <strong className="text-white">{stats.averageScore}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Mastery Breakdown Mini-Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 text-center">
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="text-base font-bold text-emerald-400">{mastery.breakdown.mastered}</div>
                      <div className="text-[10px] text-white/40">Mastered</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="text-base font-bold text-cyan-400">{mastery.breakdown.developing}</div>
                      <div className="text-[10px] text-white/40">Developing</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="text-base font-bold text-rose-400">{mastery.breakdown.needsPractice}</div>
                      <div className="text-[10px] text-white/40">Needs Practice</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Intelligence Stats Grid (4 Cards) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col">
                  <Target className="w-5 h-5 text-emerald-400 mb-3" />
                  <div className="text-xs text-white/50 font-medium mb-1">Concepts Mastered</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {stats.conceptsCompleted}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 mb-3" />
                  <div className="text-xs text-white/50 font-medium mb-1">Checkpoints Evaluated</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {stats.totalResponses}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col">
                  <TrendingUp className="w-5 h-5 text-[#EAB308] mb-3" />
                  <div className="text-xs text-white/50 font-medium mb-1">Average Score</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {stats.averageScore}%
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col">
                  <Flame className="w-5 h-5 text-rose-400 mb-3" />
                  <div className="text-xs text-white/50 font-medium mb-1">Learning Streak</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {stats.streakDays} {stats.streakDays === 1 ? 'day' : 'days'}
                  </div>
                </div>
              </div>

              {/* Learning Journey / Concept Pathway (for Active Topic) */}
              {activeSessionConcepts.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#09090b] p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-white tracking-tight">
                        Your Learning Journey · {activeSession?.topic}
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">
                        Concept-by-concept mastery flow verified in PostgreSQL
                      </p>
                    </div>

                    <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                      {activeSessionConcepts.filter((c) => c.status === 'completed').length} / {activeSessionConcepts.length} Unlocked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {activeSessionConcepts.map((concept, idx) => {
                      const isCompleted = concept.status === 'completed';
                      const isActive = concept.status === 'active';
                      const isLocked = concept.status === 'locked';

                      return (
                        <button
                          key={concept.id}
                          disabled={isLocked}
                          onClick={() => navigateTo?.(`dashboard/session?sessionId=${activeSession.id}`)}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30 shadow-sm'
                              : isCompleted
                              ? 'bg-[#121212] border-white/10 hover:border-white/20'
                              : 'bg-white/[0.01] border-white/5 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono text-white/50">
                              0{idx + 1}
                            </span>
                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            {isActive && <CircleDot className="w-4 h-4 text-emerald-400 animate-pulse" />}
                            {isLocked && <Lock className="w-3.5 h-3.5 text-white/30" />}
                          </div>

                          <div>
                            <h5 className="text-xs font-medium text-white truncate mb-1" title={concept.title}>
                              {concept.title}
                            </h5>
                            {concept.score !== null ? (
                              <span className="text-[11px] font-semibold text-emerald-400">
                                {concept.score}%
                              </span>
                            ) : (
                              <span className="text-[10px] text-white/40">
                                {isActive ? 'In Progress' : 'Locked'}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Two-Column Mastery: Strong Areas vs Areas to Improve */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strong Areas */}
                <div className="rounded-2xl border border-white/10 bg-[#09090b] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      Your Strong Areas
                    </h4>
                    <span className="text-xs text-white/40 font-mono">
                      {mastery.strongAreas.length} verified
                    </span>
                  </div>

                  {mastery.strongAreas.length > 0 ? (
                    <div className="space-y-3">
                      {mastery.strongAreas.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl border border-white/5 bg-[#121212] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate">{item.title}</div>
                            <div className="text-[11px] text-white/40 truncate">{item.topic}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {item.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-xl">
                      Complete checkpoint questions with 75%+ score to record your strong areas.
                    </div>
                  )}
                </div>

                {/* Areas to Improve */}
                <div className="rounded-2xl border border-white/10 bg-[#09090b] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-[#F43F5E]" />
                      Needs More Practice
                    </h4>
                    <span className="text-xs text-white/40 font-mono">
                      {mastery.areasToImprove.length} concepts
                    </span>
                  </div>

                  {mastery.areasToImprove.length > 0 ? (
                    <div className="space-y-3">
                      {mastery.areasToImprove.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl border border-white/5 bg-[#121212] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate">{item.title}</div>
                            <div className="text-[11px] text-white/40 truncate">{item.topic}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-[#F43F5E] bg-[#F43F5E]/10 px-2 py-0.5 rounded-full border border-[#F43F5E]/20">
                              {item.score}%
                            </span>
                            <button
                              onClick={() => navigateTo?.(`dashboard/session?sessionId=${item.sessionId}`)}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white text-white hover:text-black text-[11px] font-medium rounded transition-colors cursor-pointer"
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-xl">
                      No weak areas identified. You're meeting the mastery bar across all active concepts!
                    </div>
                  )}
                </div>
              </div>

              {/* Personalized Learning Insight & Consistency */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Learning Insight Box (7 cols) */}
                <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#09090b] p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3">
                    <BrainCircuit className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Personalized Learning Insight
                    </h4>
                  </div>

                  <p className="text-sm text-white/80 leading-relaxed my-2">
                    "{mastery.insight}"
                  </p>

                  <div className="pt-4 border-t border-white/5 text-[11px] text-white/40 flex items-center justify-between">
                    <span>Derived from PostgreSQL evaluation history</span>
                    <span className="text-emerald-400 font-medium">Updated live</span>
                  </div>
                </div>

                {/* Consistency Strip (5 cols) */}
                <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#09090b] p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#EAB308]" />
                      Learning Consistency
                    </span>
                    <span className="text-xs text-white/40 font-mono">Past 7 days</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-3">
                    {mastery.consistency.days.map((day) => (
                      <div key={day.date} className="flex flex-col items-center gap-2">
                        <span className="text-[10px] text-white/40">{day.dayName}</span>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            day.active
                              ? 'bg-emerald-500 text-black font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                              : 'bg-white/5 text-white/20 text-xs'
                          }`}
                        >
                          {day.active ? '✓' : '·'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-white/40 pt-2 border-t border-white/5">
                    {mastery.consistency.activeDaysThisWeek} active {mastery.consistency.activeDaysThisWeek === 1 ? 'day' : 'days'} recorded this week.
                  </div>
                </div>
              </div>

              {/* Recent Learning Sessions */}
              {dbData?.recentSessions && dbData.recentSessions.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#09090b] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-white">Recent Learning Sessions</h4>
                    <button
                      onClick={() => navigateTo?.('dashboard/history')}
                      className="text-xs text-white/50 hover:text-white transition-colors"
                    >
                      View all history →
                    </button>
                  </div>

                  <div className="divide-y divide-white/5">
                    {dbData.recentSessions.map((s) => (
                      <div key={s.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white truncate">{s.topic}</div>
                          <div className="text-xs text-white/40 mt-0.5">
                            {s.completed_concepts || 0} of {s.total_concepts || 6} concepts completed · {s.progress_percentage || 0}%
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {s.average_score > 0 && (
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              {s.average_score}% avg
                            </span>
                          )}
                          <button
                            onClick={() => navigateTo?.(`dashboard/session?sessionId=${s.id}`)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-black text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            {s.status === 'completed' ? 'Review' : 'Resume'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
