import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ContextQuestion } from '../types';
import {
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const categoryColors: Record<string, string> = {
  product: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  market: 'bg-green-500/20 text-green-400 border-green-500/30',
  team: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  finance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  strategy: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

export default function ContextDiscoveryModal({ isOpen, onClose }: Props) {
  const { currentProject, discoverContext, answerContext, loading } = useStore();
  
  const [questions, setQuestions] = useState<ContextQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState('');
  const [completeness, setCompleteness] = useState(0);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load questions when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      loadQuestions();
    }
  }, [isOpen, currentProject?.id]);

  const loadQuestions = async () => {
    setIsDiscovering(true);
    try {
      const result = await discoverContext();
      // Sort by priority
      const sorted = [...result.questions].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
      setQuestions(sorted);
      setSummary(result.summary);
      setCompleteness(result.context_completeness);
    } catch (e) {
      console.error('Failed to discover context:', e);
    }
    setIsDiscovering(false);
  };

  const handleAnswerChange = (question: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const handleSubmit = async () => {
    // Filter out empty answers
    const filledAnswers = Object.fromEntries(
      Object.entries(answers).filter(([_, v]) => v.trim())
    );
    
    if (Object.keys(filledAnswers).length === 0) {
      onClose();
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await answerContext(filledAnswers);
      setCompleteness(result.context_completeness);
      setSummary(result.summary);
      setShowSuccess(true);
      
      // Brief success state, then close
      setTimeout(() => {
        setShowSuccess(false);
        setAnswers({});
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Failed to save context:', e);
    }
    setIsSaving(false);
  };

  const handleSkip = () => {
    setAnswers({});
    onClose();
  };

  const handleAskMore = async () => {
    // Save current answers first if any
    const filledAnswers = Object.fromEntries(
      Object.entries(answers).filter(([_, v]) => v.trim())
    );
    
    if (Object.keys(filledAnswers).length > 0) {
      setIsSaving(true);
      try {
        await answerContext(filledAnswers);
        setAnswers({});
      } catch (e) {
        console.error('Failed to save context:', e);
      }
      setIsSaving(false);
    }
    
    // Then load more questions
    await loadQuestions();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Let's learn about {currentProject?.name}
                </h2>
                <p className="text-sm text-slate-400">
                  Answer a few questions to get better strategic advice
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Completeness bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Context completeness</span>
              <span>{Math.round(completeness * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${completeness * 100}%` }}
              />
            </div>
          </div>
          
          {summary && (
            <p className="mt-3 text-sm text-slate-300 bg-slate-700/50 rounded-lg p-3">
              <span className="text-slate-500">What I know: </span>
              {summary}
            </p>
          )}
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isDiscovering ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="ml-3 text-slate-400">Identifying what I need to know...</span>
            </div>
          ) : showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircleIcon className="w-16 h-16 text-green-400" />
              <p className="mt-4 text-lg text-white">Context updated!</p>
              <p className="text-slate-400">I now understand {currentProject?.name} better.</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${categoryColors[q.category]}`}
                  >
                    {q.category}
                  </span>
                  {q.priority === 'high' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      important
                    </span>
                  )}
                </div>
                <label className="block text-white font-medium">{q.question}</label>
                <p className="text-sm text-slate-400">{q.why_it_matters}</p>
                <textarea
                  value={answers[q.question] || ''}
                  onChange={(e) => handleAnswerChange(q.question, e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:border-indigo-500 resize-none h-24"
                  placeholder="Type your answer..."
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!isDiscovering && !showSuccess && (
          <div className="p-6 border-t border-slate-700 flex items-center justify-between">
            <button
              onClick={handleAskMore}
              disabled={isSaving}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Ask different questions
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || loading}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
