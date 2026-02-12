import { Organization } from "@/types/organization";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

interface OrganizationsTableProps {
  organizations: Organization[];
  onReview: (organization: Organization) => void;
}

export function OrganizationsTable({ organizations, onReview }: OrganizationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Registration</TableHead>
          <TableHead>Legal Structure</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Documents</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell className="font-medium">{org.name}</TableCell>
            <TableCell>{org.type}</TableCell>
            <TableCell>{org.email || '-'}</TableCell>
            <TableCell>
              <div className="text-sm">
                <p>{org.registrationNumber || '-'}</p>
                <p className="text-muted-foreground">
                  {org.registrationDate 
                    && format(new Date(org.registrationDate), 'MMM d, yyyy')
                  }
                </p>
              </div>
            </TableCell>
            <TableCell>{org.legalStructure || '-'}</TableCell>
            <TableCell>
              <Badge
                variant={org.isActive ? 'success' : 'secondary'}
              >
                {org.isActive ? 'Active' : 'Pending'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                {org.registrationDoc && (
                  <Badge variant="outline">Registration</Badge>
                )}
                {org.panDoc && (
                  <Badge variant="outline">PAN</Badge>
                )}
                {(org.certificate12ADoc || org.certificate80GDoc) && (
                  <Badge variant="outline">Tax Certificates</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReview(org)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {org.isActive ? 'View Details' : 'Review & Approve'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 