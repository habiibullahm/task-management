import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useTeamStore } from '@/stores/team.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TeamListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { teams, isLoading, error, fetchTeams, clearError } = useTeamStore();

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-2xl font-bold">
              Task Management
            </Link>
            <span className="text-sm text-muted-foreground">Teams</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">My Teams</h2>
            <p className="text-muted-foreground">
              Create teams and manage members for collaboration.
            </p>
          </div>
          <Button onClick={() => navigate('/teams/new')}>Create Team</Button>
        </div>

        {isLoading && teams.length === 0 ? (
          <p className="text-muted-foreground">Loading teams…</p>
        ) : teams.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No teams yet</CardTitle>
              <CardDescription>
                Create a team to invite others and collaborate on work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/teams/new')}>Create your first team</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                role="link"
                tabIndex={0}
                aria-label={`Open team ${team.name}`}
                onClick={() => navigate(`/teams/${team.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/teams/${team.id}`);
                  }
                }}
              >
                <CardHeader>
                  <CardTitle className="truncate">{team.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {team.description?.trim() || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {team.members?.length ?? 0} member
                    {(team.members?.length ?? 0) === 1 ? '' : 's'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
