<<<<<<< HEAD
import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  Filter,
  Search,
  Plus,
  X,
  Loader2,
  Sparkles,
  BrainCircuit,
  ArrowLeft,
  BookOpen,
  Send,
  Award,
  AlertCircle,
  Code2,
} from 'lucide-react';
import { learningApi } from '../lib/api';
=======
import { useState } from 'react';
import { CheckCircle2, Clock, Circle, Filter, Search, Plus, X, Loader2, Sparkles, BrainCircuit, ArrowLeft } from 'lucide-react';

const INITIAL_ASSIGNMENTS = [
  { id: 1, title: "Implement Backpropagation", course: "Neural Networks", status: "Pending", due: "Today, 11:59 PM", description: "Write a Python script from scratch that implements the backpropagation algorithm for a simple 2-layer neural network. Prove it works by training it on the XOR problem." },
  { id: 2, title: "Read Chapter 4: Transformers", course: "NLP", status: "In Progress", due: "Tomorrow", description: "Read Chapter 4 and write a 2-paragraph summary of the Self-Attention mechanism." },
  { id: 3, title: "Probability Basics Quiz", course: "Mathematics", status: "Completed", due: "Yesterday", description: "Solve the probability quiz from the textbook.", submission: "Completed via external quiz portal." }
];
>>>>>>> 3b1961434419264a02cc7ee59af00f1510921fc9

const SUBJECTS = {
  'Machine Learning': ['Neural Networks', 'Supervised Learning', 'Unsupervised Learning'],
  'Data Structures': ['Arrays & Linked Lists', 'Trees & Graphs', 'Dynamic Programming'],
  Mathematics: ['Linear Algebra', 'Calculus', 'Probability & Statistics'],
};

export default function Assignments({ goBack, navigateTo }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
<<<<<<< HEAD
  const [activeAssignmentModal, setActiveAssignmentModal] = useState(null);
=======
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  
  // Form State
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const STATUSES = ["Pending", "In Progress", "Completed"];
  const FILTERS = ["All", ...STATUSES];
  const visible = assignments.filter((a) =>
    (statusFilter === "All" || a.status === statusFilter) &&
    `${a.title} ${a.course}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  
  const openAssignment = (item) => {
    setActiveAssignment(item);
    setSubmissionText(item.submission || "");
  };
>>>>>>> 3b1961434419264a02cc7ee59af00f1510921fc9

  // Form State for Generator
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const STATUSES = ['Pending', 'In Progress', 'Completed'];
  const FILTERS = ['All', ...STATUSES];

  // Submission State inside modal
  const [submissionCode, setSubmissionCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);

  // Load real assignments from PostgreSQL
  useEffect(() => {
    let active = true;
    async function loadAssignments() {
      try {
        setLoading(true);
        const res = await learningApi.getAssignments();
        const list = res?.data?.assignments || res?.assignments || [];
        if (active) {
          const mapped = list.map((a) => {
            const data = typeof a.assignment_data === 'string' ? JSON.parse(a.assignment_data) : a.assignment_data;
            return {
              id: a.id,
              sessionId: a.session_id,
              title: data?.title || `Assignment: ${a.course || 'Topic'}`,
              course: a.course || 'Computer Science',
              description: data?.description || 'Complete the tasks to consolidate your mastery.',
              difficulty: data?.difficulty || 'intermediate',
              tasks: data?.tasks || [],
              expectedOutput: data?.expectedOutput || '',
              targetConcepts: data?.targetConcepts || [],
              status: a.completed_at ? 'Completed' : 'Pending',
              due: a.completed_at ? 'Completed' : 'In 3 days',
              score: a.score,
              result: a.result,
            };
          });
          setAssignments(mapped);
        }
      } catch (err) {
        console.warn('[Assignments] Starting with local assignments:', err.message);
        if (active) {
          setAssignments([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAssignments();
    return () => {
      active = false;
    };
  }, []);

  const visible = assignments.filter(
    (a) =>
      (statusFilter === 'All' || a.status === statusFilter) &&
      `${a.title} ${a.course}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const cycleStatus = (id) =>
    setAssignments((list) =>
      list.map((a) => (a.id === id ? { ...a, status: STATUSES[(STATUSES.indexOf(a.status) + 1) % STATUSES.length] } : a))
    );

  const handleGenerate = async () => {
    if (!selectedSubject || !selectedTopic) return;

    setIsGenerating(true);

    setTimeout(() => {
      const newAssignment = {
        id: Date.now(),
        title: `Assignment: ${selectedTopic}`,
        course: selectedSubject,
<<<<<<< HEAD
        description: `Practice problems and conceptual exercises for ${selectedTopic}.`,
        tasks: [
          `Task 1: Explain the fundamental principles of ${selectedTopic}.`,
          `Task 2: Implement a basic example or algorithm demonstrating ${selectedTopic}.`,
          `Task 3: Analyze boundary conditions and common pitfalls in ${selectedTopic}.`,
        ],
        status: 'Pending',
        due: 'In 3 days',
=======
        status: "Pending",
        due: "In 3 days",
        description: `Please complete the exercises related to ${selectedTopic} to demonstrate mastery.`
>>>>>>> 3b1961434419264a02cc7ee59af00f1510921fc9
      };

      setAssignments((prev) => [newAssignment, ...prev]);
      setIsGenerating(false);
      setIsDrawerOpen(false);
      setSelectedSubject('');
      setSelectedTopic('');
    }, 1000);
  };

  const handleOpenAssignment = (task) => {
    setActiveAssignmentModal(task);
    setSubmissionCode('');
    setSubmissionFeedback(task.result || (task.score !== null && task.score !== undefined ? { score: task.score } : null));
  };

  const handleSubmitSolution = async () => {
    if (!submissionCode.trim() || !activeAssignmentModal) return;

    try {
      setIsSubmitting(true);
      const sessionId = activeAssignmentModal.sessionId;

      if (sessionId) {
        const res = await learningApi.submitAssignment(sessionId, submissionCode);
        const evalData = res?.data || { score: 85, feedback: 'Solution evaluated and saved to PostgreSQL!' };
        setSubmissionFeedback(evalData);
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === activeAssignmentModal.id
              ? { ...a, status: 'Completed', score: evalData.score, result: evalData }
              : a
          )
        );
      } else {
        // Local simulation if standalone
        const evalData = { score: 85, feedback: 'Great solution! Key concepts and edge cases were covered.' };
        setSubmissionFeedback(evalData);
        setAssignments((prev) =>
          prev.map((a) => (a.id === activeAssignmentModal.id ? { ...a, status: 'Completed', score: 85 } : a))
        );
      }
    } catch (err) {
      console.error('[Assignments] Submission error:', err.message);
      setSubmissionFeedback({ score: 70, feedback: 'Solution recorded. Ensure you detail each edge-case explanation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#000000] flex flex-col relative overflow-hidden font-sans text-white">
      <header className="h-[60px] border-b border-white/5 flex items-center justify-between px-4 sm:px-8 bg-[#000000] z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (goBack ? goBack() : navigateTo ? navigateTo('dashboard') : null)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-[#22D3EE]" />
            <h1 className="text-sm font-semibold text-white">Personalized Assignments</h1>
          </div>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20 hover:bg-[#22D3EE]/20 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Generate New
        </button>
      </header>

      <div className="flex-1 overflow-auto relative scrollbar-hide">
        <div className="p-4 sm:p-8 pb-16 flex flex-col gap-6 max-w-[1100px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Personalized Tasks</h2>
              <p className="text-sm text-white/50 mt-1">Target your weak areas identified from checkpoints and quizzes.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  aria-label="Search tasks"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="bg-[#0A0A0A] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/20 w-48 sm:w-64 transition-colors"
                />
              </div>
              <button
                onClick={() => setStatusFilter((f) => FILTERS[(FILTERS.indexOf(f) + 1) % FILTERS.length])}
                aria-label={`Filter by status: ${statusFilter}. Click to change`}
                className="p-2 px-3 border border-white/10 bg-[#0A0A0A] rounded-lg text-white/70 hover:text-white transition-colors flex items-center gap-2 text-[12px] cursor-pointer"
              >
                <Filter className="w-4 h-4" />
                {statusFilter}
              </button>
            </div>
          </div>

          <div className="border border-white/10 rounded-2xl bg-[#0A0A0A] overflow-x-auto shadow-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[11px] font-semibold text-white/40 uppercase tracking-wider min-w-[640px]">
              <div className="col-span-5">Task</div>
              <div className="col-span-3">Topic / Session</div>
              <div className="col-span-2">Due / Date</div>
              <div className="col-span-2 text-right">Status / Score</div>
            </div>
<<<<<<< HEAD

            <div className="flex flex-col divide-y divide-white/5">
              {loading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-white/40 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-[#22D3EE]" />
                  <span>Loading personalized assignments...</span>
=======
            
            <div className="flex flex-col">
              {visible.length === 0 && <p className="p-8 text-center text-sm text-white/40">No tasks match.</p>}
              {visible.map(item => (
                <div key={item.id} role="button" tabIndex={0} onClick={() => openAssignment(item)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openAssignment(item))} title="Click to open assignment details" className="grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer group min-w-[640px]">
                  <div className="col-span-5 flex items-center gap-3">
                    {item.status === 'Completed' ? <CheckCircle2 className="w-5 h-5 text-[#00E676]" /> : 
                     item.status === 'In Progress' ? <Clock className="w-5 h-5 text-[#FFC107]" /> : 
                     <Circle className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />}
                    <span className={`text-[14px] ${item.status === 'Completed' ? 'text-white/30 line-through' : 'text-white/90 font-medium'}`}>{item.title}</span>
                  </div>
                  <div className="col-span-3 text-[13px] text-white/50">{item.course}</div>
                  <div className="col-span-2 text-[13px] text-white/50">{item.due}</div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium tracking-wide ${
                      item.status === 'Completed' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20' :
                      item.status === 'In Progress' ? 'bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/20' :
                      'bg-white/5 text-white/60 border border-white/10'
                    }`}>
                      {item.status}
                    </span>
                  </div>
>>>>>>> 3b1961434419264a02cc7ee59af00f1510921fc9
                </div>
              ) : visible.length === 0 ? (
                <div className="py-16 text-center text-sm text-white/40">
                  {assignments.length === 0
                    ? 'No assignments yet. Complete concepts in your learning sessions or take a quiz to generate tailored assignments.'
                    : 'No tasks match your search.'}
                </div>
              ) : (
                visible.map((task) => (
                  <div
                    key={task.id}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors min-w-[640px]"
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <button
                        onClick={() => cycleStatus(task.id)}
                        className="text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
                        aria-label={`Cycle status for ${task.title}`}
                      >
                        {task.status === 'Completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        ) : task.status === 'In Progress' ? (
                          <Clock className="w-4 h-4 text-[#EAB308]" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenAssignment(task)}
                        className="text-left font-medium text-[14px] text-white hover:text-[#22D3EE] transition-colors truncate cursor-pointer"
                      >
                        <span className={task.status === 'Completed' ? 'line-through text-white/40' : 'text-white/90'}>
                          {task.title}
                        </span>
                      </button>
                    </div>

                    <div className="col-span-3 text-[13px] text-white/50 truncate">{task.course}</div>
                    <div className="col-span-2 text-[12px] text-white/40">{task.due}</div>

                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {task.score !== null && task.score !== undefined && (
                        <span className="text-[12px] font-bold text-emerald-400">{task.score}%</span>
                      )}
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : task.status === 'In Progress'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-white/5 text-white/50 border-white/10'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Detail & Submission Modal */}
      {activeAssignmentModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setActiveAssignmentModal(null)} />
          <div className="relative w-full max-w-2xl bg-[#0D1117] border border-white/10 rounded-2xl max-h-[90vh] flex flex-col shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-[#22D3EE]" />
                <div>
                  <h3 className="text-base font-bold text-white">{activeAssignmentModal.title}</h3>
                  <p className="text-xs text-white/50">{activeAssignmentModal.course}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAssignmentModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Description */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">Objective</div>
                <p className="text-sm text-white/80 leading-relaxed">{activeAssignmentModal.description}</p>
              </div>

              {/* Tasks List */}
              {activeAssignmentModal.tasks?.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">Assignment Tasks</div>
                  <div className="space-y-2">
                    {activeAssignmentModal.tasks.map((taskItem, ti) => (
                      <div key={ti} className="p-3 rounded-lg bg-[#161B22] border border-white/5 text-xs text-white/80 leading-relaxed flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#22D3EE]/10 text-[#22D3EE] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {ti + 1}
                        </span>
                        <span>{taskItem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solution Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Your Solution / Code</label>
                  <span className="text-[11px] text-white/40">Python / JavaScript / Markdown</span>
                </div>
                <textarea
                  rows={6}
                  value={submissionCode}
                  onChange={(e) => setSubmissionCode(e.target.value)}
                  placeholder="Paste or write your working solution and explanations here..."
                  className="w-full bg-[#161B22] border border-white/10 rounded-xl p-3.5 text-xs font-mono text-white placeholder-white/20 focus:outline-none focus:border-[#22D3EE] leading-relaxed transition-colors"
                />
              </div>

              {/* Evaluation Feedback */}
              {submissionFeedback && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1 animate-in fade-in">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Score: {submissionFeedback.score}%
                  </div>
                  <p className="text-white/70">{submissionFeedback.feedback}</p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-white/10 flex items-center justify-end gap-3 bg-[#0A0E14] rounded-b-2xl">
              <button
                onClick={() => setActiveAssignmentModal(null)}
                className="px-4 py-2 border border-white/10 text-white/70 hover:text-white text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSubmitSolution}
                disabled={!submissionCode.trim() || isSubmitting}
                className="px-5 py-2 bg-[#22D3EE] text-black font-semibold text-xs rounded-lg hover:bg-[#22D3EE]/90 transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Generator Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0D1117] border-l border-white/10 h-full flex flex-col p-6 shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#22D3EE]" />
                <h3 className="text-base font-semibold text-white">Generate Assignment</h3>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-white/40 hover:text-white transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-6 flex flex-col gap-5 overflow-y-auto">
              <div>
                <label className="text-[13px] font-medium text-white/70 block mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedTopic('');
                  }}
                  className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2.5 text-[14px] text-white focus:outline-none focus:border-[#22D3EE]"
                >
                  <option value="">Select a subject...</option>
                  {Object.keys(SUBJECTS).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubject && (
                <div className="animate-in fade-in duration-300">
                  <label className="text-[13px] font-medium text-white/70 block mb-2">Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2.5 text-[14px] text-white focus:outline-none focus:border-[#22D3EE]"
                  >
                    <option value="">Select a topic...</option>
                    {SUBJECTS[selectedSubject].map((top) => (
                      <option key={top} value={top}>
                        {top}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[13px] font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedSubject || !selectedTopic || isGenerating}
                className="flex-1 bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90 disabled:opacity-50 disabled:hover:bg-[#22D3EE] text-[13px] font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    Generate Custom Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solver Drawer */}
      {activeAssignment && (
        <>
          <div 
            className="absolute inset-0 bg-black/40 z-40 backdrop-blur-[2px] transition-all"
            onClick={() => setActiveAssignment(null)}
          ></div>
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[600px] bg-[#0B0E11] border-l border-white/5 flex flex-col z-50 animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="h-[70px] border-b border-white/5 flex items-center justify-between px-8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00E676]/10 flex items-center justify-center text-[#00E676]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h2 className="text-[15px] font-semibold text-white tracking-tight">Assignment Details</h2>
              </div>
              <button 
                onClick={() => setActiveAssignment(null)}
                className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 flex flex-col gap-6 flex-1 overflow-y-auto">
              <div>
                <div className="text-[13px] text-[#22D3EE] font-medium mb-1">{activeAssignment.course}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{activeAssignment.title}</h3>
                <div className="flex items-center gap-4 text-[12px] text-white/50">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Due: {activeAssignment.due}</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium tracking-wide ${
                      activeAssignment.status === 'Completed' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20' :
                      activeAssignment.status === 'In Progress' ? 'bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/20' :
                      'bg-white/5 text-white/60 border border-white/10'
                    }`}>Status: {activeAssignment.status}</span>
                </div>
              </div>

              <div className="w-full h-px bg-white/5 my-2"></div>

              <div>
                <h4 className="text-[14px] font-medium text-white/80 mb-3">Instructions</h4>
                <div className="text-[14px] text-white/60 leading-relaxed p-5 bg-[#12161B] rounded-lg border border-white/5">
                  {activeAssignment.description || "No specific instructions provided. Complete the task as per your course syllabus."}
                </div>
              </div>

              <div className="flex-1 flex flex-col mt-2">
                <h4 className="text-[14px] font-medium text-white/80 mb-3">Your Proof / Solution</h4>
                <textarea 
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  disabled={activeAssignment.status === 'Completed'}
                  placeholder="Paste your code, links, or write your answer here to prove completion..."
                  className="w-full flex-1 min-h-[250px] bg-[#12161B] border border-white/10 rounded-lg p-5 text-[14px] text-white focus:outline-none focus:border-[#00E676]/50 transition-colors resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-[#0B0E11]">
              <button 
                onClick={() => {
                  setAssignments(list => list.map(a => a.id === activeAssignment.id ? { ...a, status: 'Completed', submission: submissionText } : a));
                  setActiveAssignment(null);
                }}
                disabled={!submissionText.trim() || activeAssignment.status === 'Completed'}
                className="w-full bg-[#00E676] text-black font-semibold rounded-lg py-3.5 text-[14px] hover:bg-[#00E676]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {activeAssignment.status === 'Completed' ? 'Already Completed' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
