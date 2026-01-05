'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStudioNew } from '@/contexts/studio-new-context';
import { useStudioData } from '@/hooks/use-studio-data';

export function ProjectStep() {
  const { state, updateDraft } = useStudioNew();
  const { projects } = useStudioData();
  const [isNewProject, setIsNewProject] = useState(
    !state.create.draft.projectId
  );

  // Initialize to new project mode if no projects exist
  useEffect(() => {
    if (projects.length === 0) {
      setIsNewProject(true);
    }
  }, [projects.length]);

  const handleSelectExisting = (projectId: string, projectName: string) => {
    setIsNewProject(false);
    updateDraft({ projectId, projectName, projectDescription: '' });
  };

  const handleNewProject = () => {
    setIsNewProject(true);
    updateDraft({ projectId: null, projectName: '', projectDescription: '' });
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        Where does it belong?
      </h2>
      <p className="text-studio-text-muted mb-8">
        Add to an existing project or create a new one
      </p>

      {/* Toggle */}
      <div className="flex gap-2 p-1 bg-studio-surface rounded-lg mb-6 mx-auto max-w-xs">
        <button
          onClick={handleNewProject}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            isNewProject
              ? 'bg-studio-accent text-white'
              : 'text-studio-text-muted hover:text-studio-text'
          )}
        >
          New Project
        </button>
        <button
          onClick={() => projects.length > 0 && setIsNewProject(false)}
          disabled={projects.length === 0}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            !isNewProject
              ? 'bg-studio-accent text-white'
              : 'text-studio-text-muted hover:text-studio-text',
            projects.length === 0 && 'opacity-50 cursor-not-allowed'
          )}
        >
          Existing
        </button>
      </div>

      {isNewProject ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-left"
        >
          <div>
            <label className="block text-sm font-medium text-studio-text mb-2">
              Project Name
            </label>
            <Input
              placeholder="My Awesome Game"
              value={state.create.draft.projectName || ''}
              onChange={(e) => updateDraft({ projectName: e.target.value })}
              className="bg-studio-surface border-studio-border text-studio-text"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-studio-text mb-2">
              Description{' '}
              <span className="text-studio-text-muted">(optional)</span>
            </label>
            <Textarea
              placeholder="A brief description of your project..."
              value={state.create.draft.projectDescription || ''}
              onChange={(e) =>
                updateDraft({ projectDescription: e.target.value })
              }
              className="bg-studio-surface border-studio-border text-studio-text min-h-[80px]"
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 max-h-[300px] overflow-y-auto"
        >
          {projects.length === 0 ? (
            <p className="text-studio-text-muted py-8">
              No projects yet. Create your first one!
            </p>
          ) : (
            projects.map((project) => {
              const isSelected = state.create.draft.projectId === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => handleSelectExisting(project.id, project.name)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    isSelected
                      ? 'bg-studio-accent/10 border border-studio-accent'
                      : 'bg-studio-surface border border-studio-border hover:border-studio-text-muted/30'
                  )}
                >
                  <Folder className="h-5 w-5 text-studio-text-muted flex-shrink-0" />
                  <span className="font-medium text-studio-text truncate">
                    {project.name}
                  </span>
                  {isSelected && (
                    <div className="ml-auto h-4 w-4 rounded-full bg-studio-accent flex items-center justify-center flex-shrink-0">
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </motion.div>
      )}
    </div>
  );
}
