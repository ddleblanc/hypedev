'use client';

import { ProjectTree } from '../projects/project-tree';

// =============================================================================
// Projects Tab
// =============================================================================

export function ProjectsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-studio-text">
          Your Projects
        </h2>
        <p className="text-studio-text-muted mt-1">
          Browse and manage all your collections and NFTs
        </p>
      </div>

      {/* Project Tree Hierarchy */}
      <ProjectTree />
    </div>
  );
}
