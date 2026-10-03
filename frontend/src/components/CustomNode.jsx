import { Handle, Position } from '@xyflow/react';
import clsx from 'clsx';
import { BookOpen, CheckCircle2, Circle, Lock } from 'lucide-react';

export default function CustomNode({ data, selected }) {
  const { label, type, status = 'locked' } = data;

  return (
    <div 
      className={clsx(
        "relative group min-w-[180px] rounded-lg border transition-all duration-300",
        "bg-[#121212] shadow-sm",
        selected ? "border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-white/5 hover:border-white/20",
        status === 'locked' && "opacity-50 grayscale hover:grayscale-0"
      )}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2.5 h-2.5 bg-[#0A0A0A] border-2 border-white/30 rounded-full" 
      />
      
      <div className="p-4 flex items-start gap-3">
        <div className="mt-1">
          {status === 'completed' && <CheckCircle2 className="w-5 h-5 text-white" />}
          {status === 'active' && <Circle className="w-5 h-5 text-zinc-400 fill-zinc-800" />}
          {status === 'locked' && <Lock className="w-5 h-5 text-white/40" />}
        </div>
        
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-wider text-white/50 uppercase mb-1">
            {type}
          </p>
          <h3 className="text-sm font-medium text-white leading-tight">
            {label}
          </h3>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-2.5 h-2.5 bg-[#0A0A0A] border-2 border-white/60 rounded-full" 
      />
    </div>
  );
}
