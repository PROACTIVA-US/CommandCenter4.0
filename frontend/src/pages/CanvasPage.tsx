import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../store';
import { Idea, IdeaStatus, ValidationResult } from '../types';
import IdeaNode from '../components/IdeaNode';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Custom node types
const nodeTypes: NodeTypes = {
  idea: IdeaNode,
};

export default function CanvasPage() {
  const { ideas, connections, currentProject, updateIdea, deleteIdea, createConnection, validate, loading } = useStore();
  
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Convert ideas to React Flow nodes
  const initialNodes: Node[] = useMemo(() => 
    ideas.map((idea) => ({
      id: idea.id,
      type: 'idea',
      position: { x: idea.position_x, y: idea.position_y },
      data: { 
        idea,
        onSelect: () => setSelectedIdea(idea),
      },
    })),
    [ideas]
  );

  // Convert connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() =>
    connections.map((conn) => ({
      id: conn.id,
      source: conn.source_id,
      target: conn.target_id,
      label: conn.label || undefined,
      animated: false,
      style: { stroke: '#475569' },
    })),
    [connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when ideas change
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle new connections
  const onConnect = useCallback(
    async (params: Connection) => {
      if (params.source && params.target) {
        await createConnection(params.source, params.target);
      }
    },
    [createConnection]
  );

  // Handle node position changes
  const onNodeDragStop = useCallback(
    async (_: React.MouseEvent, node: Node) => {
      await updateIdea(node.id, {
        position_x: node.position.x,
        position_y: node.position.y,
      });
    },
    [updateIdea]
  );

  // Validate selected idea
  const handleValidate = async () => {
    if (!selectedIdea) return;
    
    setShowValidation(true);
    const result = await validate(
      selectedIdea.title + (selectedIdea.description ? `: ${selectedIdea.description}` : ''),
      currentProject?.goal || undefined
    );
    setValidationResult(result);
    
    // Update idea with confidence (both Claude's and calibrated)
    await updateIdea(selectedIdea.id, {
      confidence: result.confidence,
      calibrated_confidence: result.calibrated_confidence,
      validation_reasoning: result.reasoning,
      status: result.confidence >= 0.5 ? 'hypothesis' : selectedIdea.status,
    });
    
    // Refresh selected idea
    setSelectedIdea({ 
      ...selectedIdea, 
      confidence: result.confidence, 
      calibrated_confidence: result.calibrated_confidence,
      validation_reasoning: result.reasoning 
    });
  };

  // Crystallize idea to next status
  const handleCrystallize = async (newStatus: IdeaStatus) => {
    if (!selectedIdea) return;
    await updateIdea(selectedIdea.id, { status: newStatus });
    setSelectedIdea({ ...selectedIdea, status: newStatus });
  };

  // Delete selected idea
  const handleDelete = async () => {
    if (!selectedIdea) return;
    await deleteIdea(selectedIdea.id);
    setSelectedIdea(null);
  };

  const getStatusColor = (status: IdeaStatus) => {
    switch (status) {
      case 'resonance': return 'text-purple-400';
      case 'idea': return 'text-blue-400';
      case 'hypothesis': return 'text-yellow-400';
      case 'task': return 'text-green-400';
    }
  };

  const getNextStatus = (status: IdeaStatus): IdeaStatus | null => {
    switch (status) {
      case 'resonance': return 'idea';
      case 'idea': return 'hypothesis';
      case 'hypothesis': return 'task';
      case 'task': return null;
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.7) return 'text-green-400';
    if (conf >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex-1 flex">
      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(_, node) => {
            const idea = ideas.find(i => i.id === node.id);
            if (idea) setSelectedIdea(idea);
          }}
          onPaneClick={() => setSelectedIdea(null)}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-900"
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
        </ReactFlow>

        {/* Empty state */}
        {ideas.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-slate-500 text-lg mb-2">Your canvas is empty</p>
              <p className="text-slate-600 text-sm">Go to Ideas to start exploring</p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedIdea && (
        <div className="w-80 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={`text-xs uppercase tracking-wide ${getStatusColor(selectedIdea.status)}`}>
                {selectedIdea.status}
              </span>
              <h2 className="text-lg font-semibold text-white mt-1">{selectedIdea.title}</h2>
            </div>
          </div>

          {/* Confidence Display */}
          {(selectedIdea.confidence !== null || selectedIdea.calibrated_confidence !== null) && (
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Confidence</div>
              <div className="flex items-center gap-4">
                {selectedIdea.confidence !== null && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getConfidenceColor(selectedIdea.confidence)}`}>
                      {Math.round(selectedIdea.confidence * 100)}%
                    </div>
                    <div className="text-xs text-slate-400">Claude</div>
                  </div>
                )}
                {selectedIdea.calibrated_confidence !== null && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getConfidenceColor(selectedIdea.calibrated_confidence)}`}>
                      {Math.round(selectedIdea.calibrated_confidence * 100)}%
                    </div>
                    <div className="text-xs text-blue-400">Calibrated</div>
                  </div>
                )}
              </div>
              {selectedIdea.calibrated_confidence !== null && (
                <p className="text-xs text-slate-500 mt-2">
                  Calibrated = when it says X%, it's right ~X% of the time
                </p>
              )}
            </div>
          )}

          {/* Description */}
          {selectedIdea.description && (
            <div className="mb-4">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedIdea.description}</p>
            </div>
          )}

          {/* Validation Reasoning */}
          {selectedIdea.validation_reasoning && (
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Assessment</div>
              <p className="text-sm text-slate-300">{selectedIdea.validation_reasoning}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {/* Validate */}
            {selectedIdea.status !== 'task' && (
              <button
                onClick={handleValidate}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                {selectedIdea.confidence !== null ? 'Re-validate' : 'Validate'}
              </button>
            )}

            {/* Crystallize */}
            {getNextStatus(selectedIdea.status) && (
              <button
                onClick={() => handleCrystallize(getNextStatus(selectedIdea.status)!)}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  selectedIdea.status === 'resonance'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : selectedIdea.status === 'idea'
                    ? 'bg-yellow-600 hover:bg-yellow-500'
                    : 'bg-green-600 hover:bg-green-500'
                } text-white`}
              >
                Crystallize to {getNextStatus(selectedIdea.status)}
              </button>
            )}

            {/* Send to Build */}
            {selectedIdea.status === 'task' && (
              <button
                onClick={() => {
                  // In real implementation, this would pass the task to AutoClaude
                  window.open('/build', '_blank');
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
              >
                Send to Build
              </button>
            )}

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidation && validationResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Validation Result</h2>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getConfidenceColor(validationResult.confidence)}`}>
                    {Math.round(validationResult.confidence * 100)}%
                  </div>
                  <div className="text-xs text-slate-400">Claude</div>
                </div>
                {validationResult.calibrated_confidence !== null && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getConfidenceColor(validationResult.calibrated_confidence)}`}>
                      {Math.round(validationResult.calibrated_confidence * 100)}%
                    </div>
                    <div className="text-xs text-blue-400">Calibrated</div>
                  </div>
                )}
              </div>
            </div>

            {validationResult.calibrated_confidence !== null && (
              <div className="mb-4 p-2 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-xs text-blue-300">
                  📊 Calibrated confidence from OpenForecaster-8B — trained on 52k forecasting questions. 
                  When it says X%, it's right ~X% of the time.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Assessment</div>
                <p className="text-white">{validationResult.reasoning}</p>
              </div>

              {validationResult.risks.length > 0 && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Risks</div>
                  <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                    {validationResult.risks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.next_steps.length > 0 && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Next Steps</div>
                  <ul className="list-disc list-inside text-sm text-green-300 space-y-1">
                    {validationResult.next_steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowValidation(false);
                  setValidationResult(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
