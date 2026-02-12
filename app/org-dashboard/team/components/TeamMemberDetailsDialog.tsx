'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Shield, 
  CheckCircle2, 
  Clock, 
  User, 
  Fingerprint
} from 'lucide-react';

import type { TeamMember } from '@/types/team';

interface TeamMemberDetailsDialogProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamMemberDetailsDialog({
  member,
  open,
  onOpenChange,
}: TeamMemberDetailsDialogProps) {
  if (!member) return null;

  const formatRole = (role: string) => {
    return role.split('_').map(
      word => word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Group permissions by resource
  const groupedPermissions = member.memberships[0]?.permissions.reduce((acc, curr) => {
    if (!acc[curr.resource]) {
      acc[curr.resource] = [];
    }
    acc[curr.resource].push(curr.action);
    return acc;
  }, {} as Record<string, string[]>);

  const hasPermissions = Object.keys(groupedPermissions).length > 0;
  const roleName = member.memberships[0]?.ngoRole || member.memberships[0]?.donorRole;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0">
        
        {/* --- Header Section --- */}
        <div className="bg-slate-50/80 p-6 border-b border-slate-100 flex items-start gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
              <AvatarImage src={member.avatar ?? undefined} />
              <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-bold">
                {member.firstName[0]}
                {member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-[3px] border-white ${member.status === 'ACTIVE' ? 'bg-green-500' : 'bg-orange-500'}`} />
          </div>
          
          <div className="space-y-1.5 pt-1">
            <DialogTitle className="text-xl font-bold text-slate-900">
              {member.firstName} {member.lastName}
            </DialogTitle>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              <span>{member.email}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {roleName ? (
                <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200 font-medium px-2.5">
                  <User className="w-3 h-3 mr-1.5 text-slate-500" />
                  {formatRole(roleName)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-500 border-dashed">No Role Assigned</Badge>
              )}
              
              <Badge 
                variant="outline" 
                className={`${
                  member.status === 'ACTIVE' 
                    ? 'text-green-700 bg-green-50 border-green-200' 
                    : 'text-orange-700 bg-orange-50 border-orange-200'
                } capitalize pl-2 pr-2.5`}
              >
                {member.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3 mr-1.5" /> : <Clock className="w-3 h-3 mr-1.5" />}
                {member.status?.toLowerCase() ?? 'Pending'}
              </Badge>
            </div>
          </div>
        </div>

        {/* --- Body Section --- */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Access & Permissions
            </h3>
          </div>

          {!hasPermissions ? (
             <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <Fingerprint className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No specific permissions assigned.</p>
             </div>
          ) : (
            <ScrollArea className="h-[320px] pr-4 -mr-4">
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(groupedPermissions).map(([resource, actions], i) => (
                  <div 
                    key={resource} 
                    className="group flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-orange-100 hover:bg-orange-50/30 transition-colors"
                  >
                    <div className="sm:w-1/3 pt-1">
                      <span className="text-sm font-medium text-slate-700 capitalize flex items-center gap-2">
                        {resource.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="sm:w-2/3 flex flex-wrap gap-1.5">
                      {actions.map((action) => (
                        <PermissionBadge key={action} action={action} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        {/* --- Footer (Optional Metadata) --- */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-xs text-slate-400 flex justify-between">
          <span>User ID: <span className="font-mono">{member.id.slice(0, 8)}...</span></span>
          {member.memberships[0]?.joinedAt && (
             <span>Joined: {new Date(member.memberships[0].joinedAt).toLocaleDateString()}</span>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}

// Helper for styling specific actions visually
function PermissionBadge({ action }: { action: string }) {
  // Styles based on action type
  let styles = "bg-slate-100 text-slate-600 border-slate-200"; // default 'read' or others
  
  if (['write', 'create', 'update', 'edit'].some(v => action.includes(v))) {
    styles = "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (['delete', 'remove', 'destroy'].some(v => action.includes(v))) {
    styles = "bg-red-50 text-red-700 border-red-200";
  }
  if (['admin', 'manage'].some(v => action.includes(v))) {
    styles = "bg-purple-50 text-purple-700 border-purple-200";
  }

  return (
    <Badge variant="outline" className={`${styles} font-normal text-[11px] px-2 py-0.5 capitalize`}>
      {action}
    </Badge>
  );
}