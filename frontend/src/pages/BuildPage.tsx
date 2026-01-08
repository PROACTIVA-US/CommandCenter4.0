import { WrenchScrewdriverIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export default function BuildPage() {
  const autoclaudePath = '/Users/danielconnolly/Projects/AutoClaude/Auto-Claude';
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-green-600/20 flex items-center justify-center mx-auto mb-6">
          <WrenchScrewdriverIcon className="w-8 h-8 text-green-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">Build with AutoClaude</h1>
        
        <p className="text-slate-400 mb-8">
          When you're ready to build, AutoClaude handles the execution. 
          It takes your validated tasks and turns them into working code.
        </p>

        <div className="space-y-4">
          <a
            href={`vscode://file${autoclaudePath}`}
            className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-medium"
          >
            Open AutoClaude in VS Code
          </a>
          
          <div className="text-sm text-slate-500">
            Or run from terminal:
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 text-left">
            <code className="text-sm text-slate-300">
              cd {autoclaudePath}<br />
              npm run dev
            </code>
          </div>
        </div>

        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            <span>Tasks marked "Send to Build" will appear in AutoClaude</span>
          </div>
        </div>
      </div>
    </div>
  );
}
