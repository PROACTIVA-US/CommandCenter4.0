import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Idea, IdeaStatus } from '../types';

interface IdeaNodeData {
  idea: Idea;
  onSelect?: () => void;
}

const statusStyles: Record<IdeaStatus, { bg: string; border: string; shadow: string; shape: string }> = {
  resonance: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-500/50',
    shadow: 'shadow-purple-500/20',
    shape: 'rounded-full',
  },
  idea: {
    bg: 'bg-blue-900/40',
    border: 'border-blue-500',
    shadow: 'shadow-blue-500/20',
    shape: 'rounded-full',
  },
  hypothesis: {
    bg: 'bg-yellow-900/40',
    border: 'border-yellow-500',
    shadow: 'shadow-yellow-500/20',
    shape: 'rounded-lg rotate-45',
  },
  task: {
    bg: 'bg-green-900/40',
    border: 'border-green-500',
    shadow: 'shadow-green-500/20',
    shape: 'rounded-lg',
  },
};

function IdeaNode({ data, selected }: NodeProps<IdeaNodeData>) {
  const { idea } = data;
  const style = statusStyles[idea.status];
  const isDiamond = idea.status === 'hypothesis';

  // Pick the best confidence to display (prefer calibrated)
  const displayConfidence = idea.calibrated_confidence ?? idea.confidence;
  const isCalibrated = idea.calibrated_confidence !== null;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.7) return 'bg-green-600/50 text-green-200';
    if (conf >= 0.5) return 'bg-yellow-600/50 text-yellow-200';
    return 'bg-red-600/50 text-red-200';
  };

  return (
    <>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-slate-500 !border-slate-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-slate-500 !border-slate-400"
      />

      {/* Node container */}
      <div
        className={`
          ${isDiamond ? 'w-24 h-24' : 'w-32 h-auto min-h-[80px]'}
          ${style.bg}
          ${style.shape}
          border-2 ${style.border}
          shadow-lg ${style.shadow}
          ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
          ${idea.status === 'resonance' ? 'animate-pulse-slow' : ''}
          transition-all duration-200
          cursor-pointer
          flex items-center justify-center
        `}
      >
        {/* Content wrapper (counter-rotate for diamond) */}
        <div className={`${isDiamond ? '-rotate-45' : ''} p-3 text-center`}>
          {/* Title */}
          <div className="text-sm font-medium text-white leading-tight line-clamp-2">
            {idea.title}
          </div>
          
          {/* Confidence badge */}
          {displayConfidence !== null && (
            <div className="mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded ${getConfidenceColor(displayConfidence)}`}>
                {Math.round(displayConfidence * 100)}%
                {isCalibrated && ' ✓'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Glow effect for resonance */}
      {idea.status === 'resonance' && (
        <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl -z-10 animate-glow" />
      )}
    </>
  );
}

export default memo(IdeaNode);
