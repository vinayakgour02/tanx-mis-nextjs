import { Organization } from "@/types/organization";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface OrganizationDialogProps {
  organization: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  onStatusChange: (orgId: string, newStatus: boolean) => void;
}

export function OrganizationDialog({
  organization,
  open,
  onOpenChange,
  isLoading,
  onStatusChange,
}: OrganizationDialogProps) {
  if (!organization) return null;

  const renderDocumentLink = (url: string | null, label: string) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        {label}
        <ExternalLink className="h-4 w-4" />
      </a>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Organization Details</DialogTitle>
          {!organization.isActive && (
            <DialogDescription className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              Review all details before approving. This will create an admin account.
            </DialogDescription>
          )}
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="legal">Legal & Tax</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <h4 className="font-semibold">Name</h4>
              <p>{organization.name}</p>
            </div>
            <div>
              <h4 className="font-semibold">Type</h4>
              <p>{organization.type}</p>
            </div>
            <div>
              <h4 className="font-semibold">Description</h4>
              <p>{organization.description || '-'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Status</h4>
              <Badge variant={organization.isActive ? 'success' : 'secondary'}>
                {organization.isActive ? 'Active' : 'Pending Approval'}
              </Badge>
            </div>
          </TabsContent>

          <TabsContent value="legal" className="space-y-4">
            <div>
              <h4 className="font-semibold">Legal Structure</h4>
              <p>{organization.legalStructure || '-'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Registration Details</h4>
              <p>Number: {organization.registrationNumber || '-'}</p>
              <p>Date: {organization.registrationDate 
                ? format(new Date(organization.registrationDate), 'PPP')
                : '-'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Tax Information</h4>
              <p>PAN: {organization.panNumber || '-'}</p>
              <p>TIN: {organization.tinNumber || '-'}</p>
              <p>12A: {organization.certificate12A || '-'}</p>
              <p>80G: {organization.certificate80G || '-'}</p>
            </div>
            {organization.hasAuditedFinancials && (
              <Badge variant="success">Has Audited Financials</Badge>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div>
              <h4 className="font-semibold">Contact Information</h4>
              <p>Email: {organization.email || '-'}</p>
              <p>Phone: {organization.phone || '-'}</p>
              <p>Website: {organization.website || '-'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Address</h4>
              <p>{organization.address || '-'}</p>
              <p>
                {[
                  organization.district,
                  organization.state,
                  organization.pinCode
                ].filter(Boolean).join(', ') || '-'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Head of Organization</h4>
              <p>Name: {organization.headName || '-'}</p>
              <p>Designation: {organization.headDesignation || '-'}</p>
              <p>Email: {organization.headEmail || '-'}</p>
              <p>Phone: {organization.headPhone || '-'}</p>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Registration Documents</h4>
              {renderDocumentLink(organization.registrationDoc || null, 'Registration Certificate')}
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Tax Documents</h4>
              {renderDocumentLink(organization.panDoc || null, 'PAN Card')}
              {renderDocumentLink(organization.tinDoc || null, 'TIN Document')}
              {renderDocumentLink(organization.certificate12ADoc || null, '12A Certificate')}
              {renderDocumentLink(organization.certificate80GDoc || null, '80G Certificate')}
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Other Documents</h4>
              {renderDocumentLink(organization.csrDoc || null, 'CSR Registration')}
              {renderDocumentLink(organization.fcraDoc || null, 'FCRA Registration')}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          {!organization.isActive && (
            <Button
              onClick={() => onStatusChange(organization.id, true)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Approving...' : 'Approve Organization'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 