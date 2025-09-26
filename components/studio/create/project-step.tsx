"use client";

import { motion } from "framer-motion";
import { Plus, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectStepProps {
  createMode: 'new-project' | 'existing-project' | null;
  setCreateMode: (mode: 'new-project' | 'existing-project' | null) => void;
  selectedProject: string;
  setSelectedProject: (projectId: string) => void;
  projectData: {
    name: string;
    description: string;
    genre: string;
    concept: string;
    banner: string;
  };
  setProjectData: (data: any) => void;
  projects: any[];
  isMobile: boolean;
}

export function ProjectStep({
  createMode,
  setCreateMode,
  selectedProject,
  setSelectedProject,
  projectData,
  setProjectData,
  projects,
  isMobile
}: ProjectStepProps) {
  const stepVariants = {
    initial: { opacity: 0, x: isMobile ? 20 : 0, y: isMobile ? 0 : 20 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: isMobile ? -20 : 0, y: isMobile ? 0 : -20 }
  };

  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {!isMobile && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Path</h2>
          <p className="text-white/60">Select how you want to organize your collection</p>
        </div>
      )}

      {isMobile && (
        <h3 className="text-xl font-bold text-white mb-4">Choose Your Path</h3>
      )}

      <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-6"}>
        <Card
          className={`bg-black/40 border-2 cursor-pointer transition-all ${
            !isMobile && 'hover:border-white/40'
          } ${
            createMode === 'existing-project' ? 'border-[rgb(163,255,18)]' : 'border-white/20'
          }`}
          onClick={() => setCreateMode('existing-project')}
        >
          <CardHeader>
            {!isMobile && (
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-purple-500" />
              </div>
            )}
            <CardTitle className="text-white flex items-center gap-2">
              {isMobile && <Layers className="w-5 h-5" />}
              {isMobile ? "Use Existing Project" : "Use Existing Project"}
            </CardTitle>
            <CardDescription className="text-white/60">
              {isMobile
                ? "Add collection to one of your existing projects"
                : "Add this collection to one of your existing projects"
              }
            </CardDescription>
          </CardHeader>
          {createMode === 'existing-project' && (
            <CardContent>
              {!isMobile && <Label className="text-white mb-2 block">Select Project</Label>}
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="bg-black/40 border-white/20 text-white">
                  <SelectValue placeholder={isMobile ? "Select a project" : "Choose a project"} />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/20">
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id} className="text-white hover:bg-white/10">
                      {isMobile ? (
                        project.name
                      ) : (
                        <div>
                          <p className="font-semibold">{project.name}</p>
                          <p className="text-xs text-white/60">{project.collections || 0} collections</p>
                        </div>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          )}
        </Card>

        <Card
          className={`bg-black/40 border-2 cursor-pointer transition-all ${
            !isMobile && 'hover:border-white/40'
          } ${
            createMode === 'new-project' ? 'border-[rgb(163,255,18)]' : 'border-white/20'
          }`}
          onClick={() => setCreateMode('new-project')}
        >
          <CardHeader>
            {!isMobile && (
              <div className="w-12 h-12 bg-[rgb(163,255,18)]/20 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-[rgb(163,255,18)]" />
              </div>
            )}
            <CardTitle className="text-white flex items-center gap-2">
              {isMobile && <Plus className="w-5 h-5" />}
              Create New Project
            </CardTitle>
            <CardDescription className="text-white/60">
              {isMobile
                ? "Start fresh with a brand new project"
                : "Start fresh with a brand new project for this collection"
              }
            </CardDescription>
          </CardHeader>
          {createMode === 'new-project' && (
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project-name" className="text-white">Project Name *</Label>
                <Input
                  id="project-name"
                  value={projectData.name}
                  onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                  placeholder={isMobile ? "My Amazing Project" : "Enter project name"}
                  className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <Label htmlFor="project-description" className="text-white">Description *</Label>
                <Textarea
                  id="project-description"
                  value={projectData.description}
                  onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                  placeholder="Describe your project..."
                  className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                  rows={isMobile ? 3 : 4}
                />
              </div>
              {!isMobile && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project-genre" className="text-white mb-2 block">Genre</Label>
                    <Input
                      id="project-genre"
                      value={projectData.genre}
                      onChange={(e) => setProjectData({...projectData, genre: e.target.value})}
                      placeholder="Art, Gaming, etc."
                      className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-concept" className="text-white mb-2 block">Concept</Label>
                    <Input
                      id="project-concept"
                      value={projectData.concept}
                      onChange={(e) => setProjectData({...projectData, concept: e.target.value})}
                      placeholder="Main theme"
                      className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </motion.div>
  );
}