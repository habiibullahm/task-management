import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useTeamStore } from '@/stores/team.store';
import { handleApiError } from '@/services/api';
import { copyWithToast } from '@/lib/clipboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TeamMemberRole } from '@/types';
import type { TeamMemberRole as TeamMemberRoleType } from '@/types';

const ROLE_OPTIONS: TeamMemberRoleType[] = [
  TeamMemberRole.OWNER,
  TeamMemberRole.ADMIN,
  TeamMemberRole.MEMBER,
];

const ADDABLE_ROLES: TeamMemberRoleType[] = [TeamMemberRole.ADMIN, TeamMemberRole.MEMBER];

function formatRole(role: TeamMemberRoleType): string {
  switch (role) {
    case TeamMemberRole.OWNER:
      return 'Owner';
    case TeamMemberRole.ADMIN:
      return 'Admin';
    default:
      return 'Member';
  }
}

export function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    currentTeam,
    teamMembers,
    isLoading,
    error,
    fetchTeam,
    fetchTeamMembers,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    updateTeamMemberRole,
    clearError,
  } = useTeamStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState<TeamMemberRoleType>(TeamMemberRole.MEMBER);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchTeam(id);
    fetchTeamMembers(id);
  }, [id, fetchTeam, fetchTeamMembers]);

  useEffect(() => {
    if (currentTeam && currentTeam.id === id) {
      setName(currentTeam.name);
      setDescription(currentTeam.description ?? '');
    }
  }, [currentTeam, id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const myMembership = useMemo(
    () => teamMembers.find((m) => m.userId === user?.id),
    [teamMembers, user?.id]
  );
  const isOwner = myMembership?.role === TeamMemberRole.OWNER;
  const canManage =
    myMembership?.role === TeamMemberRole.OWNER || myMembership?.role === TeamMemberRole.ADMIN;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      await updateTeam(id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success('Team updated');
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to update team'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Delete this team? This cannot be undone.')) return;

    try {
      await deleteTeam(id);
      toast.success('Team deleted');
      navigate('/teams');
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to delete team'));
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!memberUserId.trim()) {
      toast.error('User ID is required');
      return;
    }

    setAddingMember(true);
    try {
      await addTeamMember(id, {
        userId: memberUserId.trim(),
        role: memberRole,
      });
      toast.success('Member added');
      setMemberUserId('');
      setMemberRole(TeamMemberRole.MEMBER);
      await fetchTeam(id);
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to add member'));
    } finally {
      setAddingMember(false);
    }
  };

  const handleRoleChange = async (membershipId: string, role: TeamMemberRoleType) => {
    if (!id) return;
    try {
      await updateTeamMemberRole(id, membershipId, role);
      toast.success('Role updated');
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to update role'));
    }
  };

  const handleRemoveMember = async (membershipId: string, label: string) => {
    if (!id) return;
    if (!window.confirm(`Remove ${label} from this team?`)) return;

    try {
      await removeTeamMember(id, membershipId);
      toast.success('Member removed');
      await fetchTeam(id);
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to remove member'));
    }
  };

  if (!id) {
    return null;
  }

  const showLoading = isLoading && !currentTeam;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-2xl font-bold">
              Task Management
            </Link>
            <span className="text-sm text-muted-foreground">Team</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <Button variant="outline" onClick={() => navigate('/teams')}>
              All Teams
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
        {showLoading ? (
          <p className="text-muted-foreground">Loading team…</p>
        ) : !currentTeam ? (
          <Card>
            <CardHeader>
              <CardTitle>Team not found</CardTitle>
              <CardDescription>This team may have been deleted or you lack access.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/teams')}>Back to Teams</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{canManage ? 'Edit team' : currentTeam.name}</CardTitle>
                <CardDescription>
                  {canManage
                    ? 'Update team details. Only owners and admins can edit.'
                    : currentTeam.description || 'No description'}
                </CardDescription>
              </CardHeader>
              {canManage ? (
                <form onSubmit={handleSave}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap justify-between gap-2">
                    {isOwner ? (
                      <Button type="button" variant="destructive" onClick={handleDelete}>
                        Delete Team
                      </Button>
                    ) : (
                      <span />
                    )}
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                  </CardFooter>
                </form>
              ) : null}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  {canManage
                    ? 'Add members with their User ID from Settings → Profile (Copy).'
                    : 'People on this team.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {canManage ? (
                  <form
                    onSubmit={handleAddMember}
                    className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="memberUserId">User ID</Label>
                      <Input
                        id="memberUserId"
                        value={memberUserId}
                        onChange={(e) => setMemberUserId(e.target.value)}
                        placeholder="00000000-0000-0000-0000-000000000000"
                        aria-label="User ID to add"
                      />
                    </div>
                    <div className="space-y-2 sm:w-36">
                      <Label htmlFor="memberRole">Role</Label>
                      <select
                        id="memberRole"
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value as TeamMemberRoleType)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {ADDABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {formatRole(role)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" disabled={addingMember}>
                      {addingMember ? 'Adding…' : 'Add member'}
                    </Button>
                  </form>
                ) : null}

                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members found.</p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {teamMembers.map((member) => {
                      const label =
                        member.user
                          ? `${member.user.firstName} ${member.user.lastName}`
                          : member.userId;
                      const email = member.user?.email;
                      return (
                        <li
                          key={member.id}
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium">{label}</p>
                            {email ? (
                              <p className="text-sm text-muted-foreground">{email}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground font-mono">
                                {member.userId}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {isOwner ? (
                              <select
                                aria-label={`Role for ${label}`}
                                value={member.role}
                                onChange={(e) =>
                                  handleRoleChange(
                                    member.id,
                                    e.target.value as TeamMemberRoleType
                                  )
                                }
                                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role}>
                                    {formatRole(role)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {formatRole(member.role)}
                              </span>
                            )}
                            {canManage && member.userId !== user?.id ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id, label)}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {user?.id ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your User ID</CardTitle>
                  <CardDescription>
                    Copy and send this to a team owner so they can add you. Also available under{' '}
                    <Link to="/settings" className="underline underline-offset-2">
                      Settings
                    </Link>
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={user.id}
                      className="font-mono text-xs sm:text-sm"
                      aria-label="Your user ID"
                      onFocus={(e) => e.target.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyWithToast(user.id, 'User ID copied')}
                    >
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
