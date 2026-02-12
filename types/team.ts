export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  memberships: Array<{
    joinedAt: Date;
    ngoRole?: string | null;
    donorRole?: string | null;
    permissions: Array<{
      resource: string;
      action: string;
    }>;
  }>;
} 