'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Pencil, 
  Search, 
  ShieldCheck, 
  UserX 
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Custom Components
import { AddTeamMemberDialog } from './components/AddTeamMemberDialog';
import { TeamMemberDetailsDialog } from './components/TeamMemberDetailsDialog';
import { EditTeamMemberDialog } from './components/EditTeamMemberDialog';

// Hooks & Types
import type { TeamMember } from '@/types/team';
import { usePermissions } from '@/hooks/use-permissions';

export default function TeamPage() {
  // State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog States
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Permissions
  const { can } = usePermissions();

  const canCreate = can("organization.team", "write") || can("organization.team", "create") || can("organization.team", "admin");
  const canEdit = can("organization.team", "write") || can("organization.team", "update") || can("organization.team", "admin");
  const canDelete = can("organization.team", "write") || can("organization.team", "delete") || can("organization.team", "admin");
  const canToggleStatus = canEdit;

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/org/team');
      if (!response.ok) throw new Error('Failed to fetch team members');
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      toast.error('Failed to load team members');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleTeamMemberAdded = (newMember: TeamMember) => {
    const memberWithDefaults: TeamMember = {
      ...newMember,
      memberships: newMember.memberships ?? [],
      status: newMember.status ?? 'PENDING'
    };
    setTeamMembers((prev) => [...prev, memberWithDefaults]);
    toast.success('Team member added successfully');
  };

  const handleTeamMemberUpdated = (updatedMember: TeamMember) => {
    setTeamMembers((prev) => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const toggleUserStatus = async (member: TeamMember, nextActive: boolean) => {
    try {
      setSavingId(member.id);
      const nextStatus: TeamMember['status'] = nextActive ? 'ACTIVE' : 'INACTIVE';
      
      const resp = await fetch('/api/org/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id, status: nextStatus }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error((data as any).error || 'Failed to update status');
      }

      const updated = (await resp.json()) as TeamMember;
      handleTeamMemberUpdated(updated);
      toast.success(`User ${nextActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      const response = await fetch(`/api/org/team?userId=${memberToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete team member');
      
      setTeamMembers((prev) => prev.filter((member) => member.id !== memberToDelete.id));
      toast.success('Team member deleted successfully');
    } catch (error) {
      toast.error('Failed to delete team member');
    } finally {
      setMemberToDelete(null);
    }
  };

  // Filter Logic
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return teamMembers;
    const lowerQuery = searchQuery.toLowerCase();
    return teamMembers.filter(m => 
      m.firstName?.toLowerCase().includes(lowerQuery) || 
      m.lastName?.toLowerCase().includes(lowerQuery) || 
      m.email.toLowerCase().includes(lowerQuery)
    );
  }, [teamMembers, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-4" />
        <p>Loading your team...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8 bg-slate-50/50 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your organization members, roles, and access permissions.
          </p>
        </div>
        {canCreate && (
          <AddTeamMemberDialog onSuccess={handleTeamMemberAdded} />
        )}
      </div>

      {/* Main Content Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-orange-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500 hidden sm:block">
              Showing <span className="font-medium text-slate-900">{filteredMembers.length}</span> members
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[300px] pl-6">User Details</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead className="hidden md:table-cell">Permissions</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <UserX className="h-10 w-10 mb-2 opacity-20" />
                      <p>No team members found.</p>
                      {searchQuery && <p className="text-xs mt-1">Try adjusting your search terms.</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow 
                    key={member.id} 
                    className="cursor-pointer hover:bg-orange-50/30 transition-colors group"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('button, [role="switch"]')) return;
                      setSelectedMember(member);
                      setDetailsOpen(true);
                    }}
                  >
                    {/* User Column */}
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-slate-200">
                          <AvatarImage src={member.avatar ?? undefined} />
                          <AvatarFallback className="bg-orange-100 text-orange-700 font-medium">
                            {(member.firstName?.[0] ?? '').toUpperCase()}
                            {(member.lastName?.[0] ?? '').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="text-sm text-slate-500 font-normal">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role Column */}
                    <TableCell>
                      {member.memberships && member.memberships.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {[member.memberships[0].ngoRole, member.memberships[0].donorRole].filter(Boolean).map((role, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 font-normal capitalize"
                            >
                              {role?.toString().replace(/_/g, ' ').toLowerCase()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">No Role</span>
                      )}
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={`
                            capitalize font-medium border
                            ${member.status === 'ACTIVE' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-orange-50 text-orange-700 border-orange-200'}
                          `}
                        >
                          {member.status?.toLowerCase() ?? 'pending'}
                        </Badge>
                        <Switch
                          checked={member.status === 'ACTIVE'}
                          disabled={savingId === member.id || !canToggleStatus}
                          className="data-[state=checked]:bg-orange-600"
                          onCheckedChange={(checked) => {
                            if (!canToggleStatus) return;
                            toggleUserStatus(member, checked);
                          }}
                        />
                      </div>
                    </TableCell>

                    {/* Permissions Column */}
                    <TableCell className="hidden md:table-cell max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {(member.memberships?.[0]?.permissions || []).slice(0, 2).map((permission, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-[10px] text-slate-500 border-slate-200 bg-white"
                          >
                            {permission?.resource}: {permission?.action}
                          </Badge>
                        ))}
                        {(member.memberships?.[0]?.permissions?.length || 0) > 2 && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                            +{member.memberships![0].permissions.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-orange-50 hover:text-orange-600"
                            onClick={() => {
                              setMemberToEdit(member);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setMemberToDelete(member)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TeamMemberDetailsDialog
        member={selectedMember}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <EditTeamMemberDialog
        member={memberToEdit as any}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setMemberToEdit(null);
        }}
        onSuccess={(updated) => handleTeamMemberUpdated(updated as any)}
      />

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-slate-900">{memberToDelete?.firstName} {memberToDelete?.lastName}</span>? 
              This will remove their access to the platform immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMember} 
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}