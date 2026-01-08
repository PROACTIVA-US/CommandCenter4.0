import { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function IdeasPage() {
  const navigate = useNavigate();
  const { currentProject, createProject, createIdea, wander, loading } = useStore();
  
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectGoal, setProjectGoal] = useState('');
  
  const [showExplore, setShowExplore] = useState(false);
  const [exploreContext, setExploreContext] = useState('');
  
  const [showCaptureIdea, setShowCaptureIdea] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    await createProject(projectName, projectGoal || undefined);
    setProjectName('');
    setProjectGoal('');
    setShowNewProject(false);
  };

  const handleExplore = async () => {
    if (!exploreContext.trim() || !currentProject) return;
    
    const ideas = await wander(exploreContext);
    
    // Create ideas on the canvas with spread positions
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    
    for (let i = 0; i < ideas.length; i++) {
      const angle = (i / ideas.length) * 2 * Math.PI - Math.PI / 2;
      await createIdea({
        title: ideas[i].title,
        description: `${ideas[i].description}\n\n**Why relevant:** ${ideas[i].why_relevant}`,
        status: 'resonance',
        position_x: centerX + Math.cos(angle) * radius,
        position_y: centerY + Math.sin(angle) * radius,
      });
    }
    
    setExploreContext('');
    setShowExplore(false);
    navigate('/canvas');
  };

  const handleCaptureIdea = async () => {
    if (!ideaTitle.trim() || !currentProject) return;
    
    await createIdea({
      title: ideaTitle,
      description: ideaDescription,
      status: 'idea',
      position_x: 400 + Math.random() * 200 - 100,
      position_y: 300 + Math.random() * 200 - 100,
    });
    
    setIdeaTitle('');
    setIdeaDescription('');
    setShowCaptureIdea(false);
    navigate('/canvas');
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Welcome to CommandCenter</h2>
          <p className="text-slate-400 mb-6">Create a project to get started</p>
          <button
            onClick={() => setShowNewProject(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 mx-auto"
          >
            <PlusIcon className="w-5 h-5" />
            New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">What would you like to do?</h1>
        <p className="text-slate-400">
          Choose how to enter The Loop for <span className="text-blue-400">{currentProject.name}</span>
        </p>
      </div>

      {/* Three Paths */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
        {/* Explore */}
        <button
          onClick={() => setShowExplore(true)}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-left hover:border-purple-500 hover:bg-slate-800/80 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center mb-4 group-hover:bg-purple-600/30 transition-colors">
            <SparklesIcon className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">I want to explore...</h3>
          <p className="text-sm text-slate-400">
            Wander through a problem space. Discover nascent ideas and opportunities.
          </p>
        </button>

        {/* Capture Idea */}
        <button
          onClick={() => setShowCaptureIdea(true)}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-left hover:border-blue-500 hover:bg-slate-800/80 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
            <LightBulbIcon className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">I have an idea</h3>
          <p className="text-sm text-slate-400">
            Capture an idea you already have. Add it to your canvas for validation.
          </p>
        </button>

        {/* Build */}
        <button
          onClick={() => navigate('/build')}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-left hover:border-green-500 hover:bg-slate-800/80 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center mb-4 group-hover:bg-green-600/30 transition-colors">
            <WrenchScrewdriverIcon className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">I need something built</h3>
          <p className="text-sm text-slate-400">
            Jump straight to execution. Open AutoClaude to build something.
          </p>
        </button>
      </div>

      {/* New Project Button */}
      <div className="mt-8">
        <button
          onClick={() => setShowNewProject(true)}
          className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Create new project
        </button>
      </div>

      {/* Modals */}
      
      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Veria 2026"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Goal (optional)</label>
                <input
                  type="text"
                  value={projectGoal}
                  onChange={(e) => setProjectGoal(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 100M ARR by 2027"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewProject(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explore Modal */}
      {showExplore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-2">Explore a space</h2>
            <p className="text-slate-400 text-sm mb-4">
              Describe what you want to explore. I'll wander through the space and surface ideas.
            </p>
            <textarea
              value={exploreContext}
              onChange={(e) => setExploreContext(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:border-purple-500 h-32 resize-none"
              placeholder="e.g., Ways to accelerate user acquisition for a B2B fintech product..."
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowExplore(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExplore}
                disabled={loading || !exploreContext.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Exploring...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Explore
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capture Idea Modal */}
      {showCaptureIdea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Capture an idea</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
                  placeholder="A concise name for your idea"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="What is this idea about?"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCaptureIdea(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCaptureIdea}
                disabled={!ideaTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
