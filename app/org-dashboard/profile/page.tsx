'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { OrganizationProfileForm } from './components/OrganizationProfileForm';
import { ExportOrganizationData } from '@/components/organizations/ExportOrganizationData';
import { MISLoading } from '@/components/loader';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/use-permissions';

interface ProfileCompletion {
  percentage: number;
  missingFields: string[];
}

export default function OrganizationProfilePage() {
  const { data: session } = useSession();
  const { can } = usePermissions();
const canEdit = can("organization", "write");
  const [profileData, setProfileData] = useState<any>(null);
  const [completion, setCompletion] = useState<ProfileCompletion>({
    percentage: 0,
    missingFields: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ((session?.user as any)?.organizationId) {
      fetchProfileData();
    }
  }, [session]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/organizations/profile');
      const data = await response.json();
      setProfileData(data);
      calculateCompletion(data);
    } catch (error) {
      toast.error('Failed to fetch organization profile');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCompletion = (data: any) => {
    const requiredFields = [
      'name',
      'type',
      'email',
      'phone',
      'address',
      'pinCode',
      'district',
      'state',
      'country',
      'headName',
      'headEmail',
      'registrationNumber',
      'panNumber',
    ];

    const optionalFields = [
      'website',
      'linkedin',
      'headDesignation',
      'headPhone',
      'description',
      'history',
      'foundingPurpose',
      'establishedDate',
      'visionStatement',
      'mission',
      'coreValues',
      'legalStructure',
      'registrationDate',
      'registrationDoc',
      'panDoc',
      'tinNumber',
      'tinDoc',
      'certificate12A',
      'certificate12ADoc',
      'certificate80G',
      'certificate80GDoc',
      'csrNumber',
      'csrDoc',
      'fcraNumber',
      'fcraDoc',
    ];

    const missingRequired = requiredFields.filter(field => !data?.[field]);
    const filledOptional = optionalFields.filter(field => data?.[field]);

    const totalFields = requiredFields.length + optionalFields.length;
    const filledFields = requiredFields.length - missingRequired.length + filledOptional.length;
    const percentage = Math.round((filledFields / totalFields) * 100);

    setCompletion({
      percentage,
      missingFields: missingRequired,
    });
  };

  if (isLoading) {
    return <MISLoading />;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Profile</h1>
            <p className="text-muted-foreground">
              Manage your organization's information and settings
            </p>
          </div>
        </div>
        <Separator />
      </div>

      {/* Profile Completion Card */}
      <Card className="p-6 bg-card">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Profile Completion</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Complete your profile to unlock all features
              </p>
            </div>
            <div className="bg-primary/10 px-4 py-2 rounded-full">
              <span className="text-xl font-bold text-primary">{completion.percentage}%</span>
            </div>
          </div>
          
          <Progress value={completion.percentage} className="h-2" />
          
          {completion.missingFields.length > 0 && (
            <Alert variant="default" className="bg-warning/10 border-warning">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">Incomplete Profile</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Please complete the following required fields to achieve 100% profile completion:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {completion.missingFields.map((field) => (
                    <li key={field} className="text-sm">
                      {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Profile Form */}
      <Card className="p-8 bg-card">
        <OrganizationProfileForm 
          initialData={profileData} 
          canEdit={canEdit}
          onSuccess={() => {
            fetchProfileData();
            toast.success('Profile updated successfully');
          }} 
        />
      </Card>

      {/* Export Data Section */}
      {/* {profileData && (
        <ExportOrganizationData 
          organizationId={(session?.user as any)?.organizationId}
          organizationName={profileData.name}
        />
      )} */}
    </div>
  );
} 