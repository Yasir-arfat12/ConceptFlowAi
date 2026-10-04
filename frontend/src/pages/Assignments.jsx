import { useState } from 'react';
import { CheckCircle2, Clock, Circle, Filter, Search, Plus, X, Loader2, Sparkles, BrainCircuit, ArrowLeft } from 'lucide-react';

const INITIAL_ASSIGNMENTS = [
  { id: 1, title: "Implement Backpropagation", course: "Neural Networks", status: "Pending", due: "Today, 11:59 PM", description: "Write a Python script from scratch that implements the backpropagation algorithm for a simple 2-layer neural network. Prove it works by training it on the XOR problem." },
  { id: 2, title: "Read Chapter 4: Transformers", course: "NLP", status: "In Progress", due: "Tomorrow", description: "Read Chapter 4 and write a 2-paragraph summary of the Self-Attention mechanism." },
  { id: 3, title: "Probability Basics Quiz", course: "Mathematics", status: "Completed", due: "Yesterday", description: "Solve the probability quiz from the textbook.", submission: "Completed via external quiz portal." }
];

const SUBJECTS = {
  "Machine Learning": ["Neural Networks", "Supervised Learning", "Unsupervised Learning"],
  "Data Structures": ["Arrays & Linked Lists", "Trees & Graphs", "Dynamic Programming"],
  "Mathematics": ["Linear Algebra", "Calculus", "Probability & Statistics"]
};

export default function Assignments({ goBack }) {
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  const handleGenerate = () => {
    if (!selectedSubject || !selectedTopic) return;
    
    setIsGenerating(true);
    
    // Simulate backend generation delay
    setTimeout(() => {
      const newAssignment = {
        id: Date.now(),
        title: `Assignment: ${selectedTopic}`,
        course: selectedSubject,
        status: "Pending",
        due: "In 3 days",
        description: `Please complete the exercises related to ${selectedTopic} to demonstrate mastery.`
      };
      
      setAssignments([newAssignment, ...assignments]);
      setIsGenerating(false);
      setIsDrawerOpen(false);
      setSelectedSubject("");
      setSelectedTopic("");
    }, 2000);
  };

  return (
    <div className="w-full h-full bg-[#0B0E11] flex flex-col relative overflow-hidden font-sans text-white">
      <header className="h-[60px] border-b border-white/5 flex items-center justify-between px-8 bg-[#0B0E11] z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack?.()} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0" aria-label="Go back" title="Go back"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-sm font-semibold text-white">Assignments</h1>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20 hover:bg-[#22D3EE]/20 px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate New
        </button>
      </header>

      <div className="flex-1 overflow-auto relative scrollbar-hide">
        <div className="p-8 pb-12 flex flex-col gap-6 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[37px] leading-[0.95] tracking-tight font-bold text-white mb-3">Tasks</h2>
              <p className="text-lg text-white/50">Manage your upcoming deliverables.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" aria-label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="bg-[#12161B] border border-white/5 rounded-md pl-9 pr-4 py-2 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/20 w-64 transition-colors" />
              </div>
              <button onClick={() => setStatusFilter((f) => FILTERS[(FILTERS.indexOf(f) + 1) % FILTERS.length])} aria-label={`Filter by status: ${statusFilter}. Click to change`} className="p-2 px-3 border border-white/5 bg-[#12161B] rounded-md text-white/70 hover:text-white transition-colors flex items-center gap-2 text-[12px]">
                <Filter className="w-4 h-4" />{statusFilter}
              </button>
            </div>
          </div>

          <div className="border border-white/5 rounded-xl bg-[#12161B] overflow-x-auto mt-4 shadow-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-[12px] font-medium text-white/40 uppercase tracking-wider min-w-[640px]">
              <div className="col-span-5">Task</div>
              <div className="col-span-3">Course</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generation Drawer */}
      {isDrawerOpen && (
        <>
          <div 
            className="absolute inset-0 bg-black/40 z-40 backdrop-blur-[2px] transition-all"
            onClick={() => !isGenerating && setIsDrawerOpen(false)}
          ></div>
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[450px] bg-[#0B0E11] border-l border-white/5 flex flex-col z-50 animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="h-[70px] border-b border-white/5 flex items-center justify-between px-8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/10 flex items-center justify-center text-[#22D3EE]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-[15px] font-semibold text-white tracking-tight">Generate Assignment</h2>
              </div>
              <button 
                onClick={() => !isGenerating && setIsDrawerOpen(false)}
                disabled={isGenerating}
                className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 flex flex-col gap-6 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-white/70">Select Subject</label>
                <select 
                  className="w-full bg-[#12161B] border border-white/10 rounded-lg p-3 text-[14px] text-white focus:outline-none focus:border-[#22D3EE]/50 transition-colors appearance-none"
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedTopic("");
                  }}
                  disabled={isGenerating}
                >
                  <option value="" disabled>Choose a subject...</option>
                  {Object.keys(SUBJECTS).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className={`flex flex-col gap-2 transition-opacity duration-300 ${!selectedSubject ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <label className="text-[13px] font-medium text-white/70">Select Topic</label>
                <select 
                  className="w-full bg-[#12161B] border border-white/10 rounded-lg p-3 text-[14px] text-white focus:outline-none focus:border-[#22D3EE]/50 transition-colors appearance-none"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={!selectedSubject || isGenerating}
                >
                  <option value="" disabled>Choose a specific topic...</option>
                  {selectedSubject && SUBJECTS[selectedSubject].map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
              
              <div className="mt-4 p-4 rounded-lg bg-[#22D3EE]/5 border border-[#22D3EE]/10 flex gap-3 text-[#22D3EE]/90">
                <BrainCircuit className="w-5 h-5 shrink-0" />
                <p className="text-[12px] leading-relaxed">
                  The AI will analyze your mastery level for this topic and generate a custom assignment targeted at your weak points.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-[#0B0E11]">
              <button 
                onClick={handleGenerate}
                disabled={!selectedSubject || !selectedTopic || isGenerating}
                className="w-full bg-[#22D3EE] text-black font-semibold rounded-lg py-3.5 text-[14px] hover:bg-[#22D3EE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating from backend...
                  </>
                ) : (
                  <>Generate Custom Assignment</>
                )}
              </button>
            </div>
          </div>
        </>
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
  )
}

