'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { hasPermission, Permission } from '@/lib/roles';
import { createTeam } from '@/lib/firebase/teams';
import { useProjectStore } from '@/stores/project-store';
import { getTeamProjects, createProject } from '@/lib/firebase/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, FolderKanban, Users, Calendar, Loader2 } from 'lucide-react';
import { PROJECT_COLORS, formatDate } from '@/lib/utils';

export default function ProjectsPage() {
  const { user, currentTeam, setCurrentTeam, teams, setTeams, memberRole, memberPermissions } = useAuthStore();
  const { projects, setProjects } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
  });
  const [teamEnsuring, setTeamEnsuring] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Ensure a team exists for the user so project creation works.
  useEffect(() => {
    const ensureTeam = async () => {
      if (!user) return;
      // Already have a team selected
      if (currentTeam) return;
      // If we have teams array populated with at least one team, select first
      if (teams && teams.length > 0) {
        setCurrentTeam(teams[0]);
        return;
      }
      // Avoid duplicate attempts
      if (teamEnsuring) return;
      setTeamEnsuring(true);
      setTeamError(null);
      try {
        const defaultName = user.displayName ? `${user.displayName.split(' ')[0]}'s Team` : 'My Team';
        const newTeam = await createTeam(defaultName, 'Auto-created default team', user.id);
        setTeams([newTeam]);
        setCurrentTeam(newTeam);
      } catch (e: unknown) {
        const err = e as { message?: string };
        setTeamError(err.message || 'Failed to auto-create team');
      } finally {
        setTeamEnsuring(false);
      }
    };
    ensureTeam();
  }, [user, currentTeam, teams, setCurrentTeam, setTeams, teamEnsuring]);

  useEffect(() => {
    const loadProjects = async () => {
      if (currentTeam) {
        const teamProjects = await getTeamProjects(currentTeam.id);
        setProjects(teamProjects);
      }
      setLoading(false);
    };
    loadProjects();
  }, [currentTeam, setProjects]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !user) return;
    // If somehow no team yet, attempt creation again inline
    if (!currentTeam) {
      try {
        setTeamEnsuring(true);
        const fallbackTeam = await createTeam('My Team', 'Fallback team for project creation', user.id);
        setTeams([fallbackTeam]);
        setCurrentTeam(fallbackTeam);
      } catch (e) {
        console.error('Unable to create fallback team for project:', e);
        setTeamEnsuring(false);
        return;
      } finally {
        setTeamEnsuring(false);
      }
    }
    if (!currentTeam) return;

    setCreating(true);
    try {
      const project = await createProject(
        currentTeam.id,
        newProject.name,
        newProject.description,
        newProject.color,
        user.id
      );
      setProjects([project, ...projects]);
      setNewProject({ name: '', description: '', color: PROJECT_COLORS[0] });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your team projects
          </p>
          {!currentTeam && !loading && (
            <p className="text-sm text-orange-600 mt-2">
              {teamEnsuring ? 'Creating default team...' : 'No team found. A default team will be created automatically.'}
            </p>
          )}
          {teamError && (
            <p className="text-sm text-red-600 mt-2">{teamError}</p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={
                !currentTeam ||
                teamEnsuring ||
                !hasPermission(memberRole || undefined, (memberPermissions as Permission[] | undefined), 'projects.create')
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to organize your tasks and collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter project description"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newProject.color === color
                          ? 'ring-2 ring-offset-2 ring-primary scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewProject({ ...newProject, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-muted-foreground text-center mt-1 mb-4">
              Get started by creating your first project to organize your work.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: project.color + '20' }}
                    >
                      <FolderKanban
                        className="h-5 w-5"
                        style={{ color: project.color }}
                      />
                    </div>
                  </div>
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {project.memberIds.length} members
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(project.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
