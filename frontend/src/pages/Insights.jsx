import { useEffect, useState } from 'react';
import {
  Award,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  Play,
  BrainCircuit,
  Lock,
  CircleDot,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../store/AppStore';
import { dashboardApi } from '../lib/api';

export default function Insights({ navigateTo, goBack }) {
  const { state } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState('all');

  useEffect(() => {
    let active = true;
    async function loadMastery() {
      try {
        setLoading(true);
        const res = await dashboardApi.getDashboard();
        if (active) {
          const payload = res.data || res;
          setData(payload);
        }
      } catch (err) {
        console.warn('[Mastery] Could not fetch mastery data:', err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMastery();
    return () => {
      active = false;
    };
  }, []);

  const stats = data?.stats || {
    conceptsCompleted: 0,
    totalConcepts: 0,
    averageScore: 0,
    totalResponses: 0,
  };

  const mastery = data?.mastery || {
    overallScore: 0,
    masteryLabel: 'Not Started',
    breakdown: { mastered: 0, developing: 0, needsPractice: 0, notStarted: 0 },
    strongAreas: [],
    areasToImprove: [],
    allConcepts: [],
    trend: [],
    nextFocus: null,
    insight: 'Your mastery journey starts here.',
  };

  const allConcepts = mastery.allConcepts || [];
  const topics = Array.from(new Set(allConcepts.map((c) => c.topic).filter(Boolean)));

  const filteredConcepts =
    filterTopic === 'all'
      ? allConcepts
      : allConcepts.filter((c) => c.topic?.toLowerCase() === filterTopic.toLowerCase());

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen bg-black flex flex-col items-center justify-center text-white/50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-white/70" />
        <span className="text-sm font-medium">Loading your mastery analytics...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black text-white flex flex-col relative overflow-hidden font-sans select-none">
      {/* Top Header */}
      <header className="h-[60px] border-b border-white/5 flex items-center justify-between px-4 sm:px-8 shrink-0 bg-[#0A0A0A] z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack?.()}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            My Mastery
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[1240px] mx-auto p-4 sm:p-8 pb-20 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          
          {/* Header Title Section */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Mastery Analytics
            </h2>
            <p className="text-sm sm:text-base text-white/50 mt-1">
              Understand what you know, what you're improving, and where to focus next.
            </p>
          </div>

          {/* Top 4 Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col">
              <Award className="w-5 h-5 text-emerald-400 mb-3" />
              <div className="text-xs text-white/50 font-medium mb-1">Overall Mastery</div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {mastery.overallScore}%
              </div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">
                {mastery.masteryLabel}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col">
              <Target className="w-5 h-5 text-cyan-400 mb-3" />
              <div className="text-xs text-white/50 font-medium mb-1">Average Checkpoint Score</div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.averageScore}%
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                Across {stats.totalResponses} evaluated answers
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col">
              <CheckCircle2 className="w-5 h-5 text-[#EAB308] mb-3" />
              <div className="text-xs text-white/50 font-medium mb-1">Concepts Mastered (80%+)</div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {mastery.breakdown.mastered}
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                {stats.conceptsCompleted} completed concepts
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col">
              <TrendingUp className="w-5 h-5 text-rose-400 mb-3" />
              <div className="text-xs text-white/50 font-medium mb-1">Concepts in Progress</div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {mastery.breakdown.developing}
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                {mastery.breakdown.needsPractice} needing extra practice
              </div>
            </div>
          </div>

          {/* Mastery Breakdown Visual Distribution */}
          <div className="rounded-2xl border border-white/10 bg-[#09090b] p-6 sm:p-7">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Mastery Breakdown
            </h3>

            {/* Segmented Distribution Bar */}
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex gap-1 mb-6">
              {mastery.breakdown.mastered > 0 && (
                <div
                  className="bg-emerald-400 h-full rounded-sm"
                  style={{ flex: mastery.breakdown.mastered }}
                  title={`Mastered: ${mastery.breakdown.mastered}`}
                />
              )}
              {mastery.breakdown.developing > 0 && (
                <div
                  className="bg-cyan-400 h-full rounded-sm"
                  style={{ flex: mastery.breakdown.developing }}
                  title={`Developing: ${mastery.breakdown.developing}`}
                />
              )}
              {mastery.breakdown.needsPractice > 0 && (
                <div
                  className="bg-rose-400 h-full rounded-sm"
                  style={{ flex: mastery.breakdown.needsPractice }}
                  title={`Needs Practice: ${mastery.breakdown.needsPractice}`}
                />
              )}
              {mastery.breakdown.notStarted > 0 && (
                <div
                  className="bg-white/10 h-full rounded-sm"
                  style={{ flex: mastery.breakdown.notStarted }}
                  title={`Not Started: ${mastery.breakdown.notStarted}`}
                />
              )}
            </div>

            {/* 4 Category Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-400">Mastered</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">{mastery.breakdown.mastered}</div>
                <span className="text-[11px] text-white/40 mt-1">Score 80% or higher</span>
              </div>

              <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-cyan-400">Developing</span>
                  <CircleDot className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white">{mastery.breakdown.developing}</div>
                <span className="text-[11px] text-white/40 mt-1">Score 60% – 79%</span>
              </div>

              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-rose-400">Needs Practice</span>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-white">{mastery.breakdown.needsPractice}</div>
                <span className="text-[11px] text-white/40 mt-1">Score below 60%</span>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white/50">Not Started</span>
                  <Lock className="w-4 h-4 text-white/30" />
                </div>
                <div className="text-2xl font-bold text-white">{mastery.breakdown.notStarted}</div>
                <span className="text-[11px] text-white/40 mt-1">Locked concepts</span>
              </div>
            </div>
          </div>

          {/* Score Trend / Understanding Over Time */}
          {mastery.trend && mastery.trend.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#09090b] p-6 sm:p-7">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Understanding Over Time
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Checkpoint evaluation score progression
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                  {mastery.trend.length} evaluations recorded
                </span>
              </div>

              {/* Sparkline / Bar Chart */}
              <div className="flex items-end gap-3 h-44 pt-4 px-2" role="img" aria-label="Score trend over time">
                {mastery.trend.map((t, idx) => {
                  const score = t.score || 0;
                  const isHigh = score >= 80;
                  const isMid = score >= 60 && score < 80;
                  return (
                    <div key={t.id || idx} className="flex-1 flex flex-col items-center justify-end gap-2 h-full group relative">
                      <span className="text-[10px] font-mono text-white/70 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                        {score}%
                      </span>
                      <div
                        className={`w-full rounded-t-sm transition-all duration-500 ${
                          isHigh ? 'bg-emerald-400' : isMid ? 'bg-cyan-400' : 'bg-rose-400'
                        }`}
                        style={{ height: `${Math.max(score, 6)}%` }}
                      />
                      <span className="text-[9px] text-white/40 truncate max-w-[45px]" title={t.concept_title || `Evaluation ${idx + 1}`}>
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Concept Performance Table */}
          <div className="rounded-2xl border border-white/10 bg-[#09090b] p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Concept Performance
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Detailed checkpoint evaluation results per concept
                </p>
              </div>

              {/* Topic Filter Chips */}
              {topics.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setFilterTopic('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filterTopic === 'all'
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    All Topics
                  </button>
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterTopic(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        filterTopic.toLowerCase() === t.toLowerCase()
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredConcepts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 pl-2">Concept</th>
                      <th className="pb-3 hidden md:table-cell">Topic</th>
                      <th className="pb-3">Score</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredConcepts.map((c) => {
                      const score = c.score;
                      const isCompleted = c.status === 'completed';
                      const isActive = c.status === 'active';
                      const isLocked = c.status === 'locked';

                      let badge = { text: 'Locked', color: 'text-white/40 bg-white/5 border-white/10' };
                      if (isCompleted) {
                        if ((score || 0) >= 80) {
                          badge = { text: 'Mastered', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
                        } else if ((score || 0) >= 60) {
                          badge = { text: 'Developing', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
                        } else {
                          badge = { text: 'Needs Practice', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
                        }
                      } else if (isActive) {
                        badge = { text: 'In Progress', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
                      }

                      return (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 pl-2 font-medium text-white flex items-center gap-2">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : isActive ? (
                              <CircleDot className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-white/30 shrink-0" />
                            )}
                            <span className="truncate max-w-[280px]">{c.title}</span>
                          </td>
                          <td className="py-3.5 text-white/50 hidden md:table-cell">{c.topic}</td>
                          <td className="py-3.5 font-mono">
                            {score !== null && score !== undefined ? (
                              <span className="font-semibold text-white">{score}%</span>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.color}`}>
                              {badge.text}
                            </span>
                          </td>
                          <td className="py-3.5 pr-2 text-right">
                            {!isLocked && c.session_id && (
                              <button
                                onClick={() => navigateTo?.(`dashboard/session?sessionId=${c.session_id}`)}
                                className="px-3 py-1 bg-white/10 hover:bg-white text-white hover:text-black text-xs font-medium rounded-lg transition-colors cursor-pointer"
                              >
                                {isCompleted ? 'Review' : 'Continue'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-xl">
                No concepts found. Start a learning session on the dashboard to build your concept performance list.
              </div>
            )}
          </div>

          {/* Personalized Next Step Card */}
          {mastery.nextFocus && (
            <div className="rounded-2xl border border-white/10 bg-[#09090b] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  Recommended Next Focus
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-white mb-1">
                  {mastery.nextFocus.topic} — {mastery.nextFocus.title}
                </h4>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-xl">
                  {mastery.nextFocus.reason}
                </p>
              </div>

              {mastery.nextFocus.sessionId && (
                <button
                  onClick={() => navigateTo?.(`dashboard/session?sessionId=${mastery.nextFocus.sessionId}`)}
                  className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {mastery.nextFocus.actionLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
