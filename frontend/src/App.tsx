import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store';
import IdeasPage from './pages/IdeasPage';
import CanvasPage from './pages/CanvasPage';
import BuildPage from './pages/BuildPage';
import {
  LightBulbIcon,
  MapIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

function App() {
  const { projects, currentProject, fetchProjects, selectProject, error, setError } = useStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto-select first project if none selected
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      selectProject(projects[0]);
    }
  }, [projects, currentProject, selectProject]);

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">CommandCenter</h1>
          <p className="text-xs text-slate-400 mt-1">Strategic Intelligence</p>
        </div>

        {/* Project Selector */}
        <div className="p-4 border-b border-slate-700">
          <label className="text-xs text-slate-400 uppercase tracking-wide">Project</label>
          <select
            className="mt-1 w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
            value={currentProject?.id || ''}
            onChange={(e) => {
              const project = projects.find((p) => p.id === e.target.value);
              if (project) selectProject(project);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {currentProject?.goal && (
            <p className="mt-2 text-xs text-slate-400 truncate" title={currentProject.goal}>
              Goal: {currentProject.goal}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/ideas"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`
            }
          >
            <LightBulbIcon className="w-5 h-5" />
            Ideas
          </NavLink>
          <NavLink
            to="/canvas"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`
            }
          >
            <MapIcon className="w-5 h-5" />
            Canvas
          </NavLink>
          <NavLink
            to="/build"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`
            }
          >
            <WrenchScrewdriverIcon className="w-5 h-5" />
            Build
          </NavLink>
        </nav>

        {/* The Loop */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">The Loop</div>
          <div className="flex items-center justify-center gap-1 text-xs">
            <span className="text-purple-400">DISCOVER</span>
            <span className="text-slate-500">→</span>
            <span className="text-yellow-400">VALIDATE</span>
            <span className="text-slate-500">→</span>
            <span className="text-green-400">IMPROVE</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/50 border-b border-red-700 px-4 py-2 flex items-center justify-between">
            <span className="text-red-200 text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200"
            >
              ×
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/ideas" replace />} />
            <Route path="/ideas" element={<IdeasPage />} />
            <Route path="/canvas" element={<CanvasPage />} />
            <Route path="/build" element={<BuildPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
