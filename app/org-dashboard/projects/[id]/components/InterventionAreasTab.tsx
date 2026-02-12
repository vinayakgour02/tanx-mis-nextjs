'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectInterventionDialog } from './ProjectInterventionDialog';

interface InterventionArea {
  id: string;
  serialNumber: number;
  state?: {
    name: string;
  };
  district?: {
    name: string;
  };
  blockName?: {
    name: string;
  };
  gramPanchayat?: {
    name: string;
  };
  villageName?: {
    name: string;
  };
  type?: string; // RURAL or URBAN
  status: 'APPROVED' | 'PLANNED' | 'REJECTED';
  selectedForYear?: number;
  date: string;
}

interface MasterInterventionArea {
  id: string;
  state: string;
  district: string;
  type: string;
  project?: {
    name: string;
    code: string;
  };
}

interface InterventionAreasTabProps {
  projectId: string;
}

export function InterventionAreasTab({ projectId }: InterventionAreasTabProps) {
  const [interventionAreas, setInterventionAreas] = useState<InterventionArea[]>([]);
  const [masterInterventionAreas, setMasterInterventionAreas] = useState<MasterInterventionArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    await Promise.all([
      fetchInterventionAreas(),
      fetchMasterInterventionAreas()
    ]);
  };

  const fetchMasterInterventionAreas = async () => {
    try {
      const response = await fetch('/api/intervention-areas/master-intervention');
      if (!response.ok) throw new Error('Failed to fetch master intervention areas');
      const data = await response.json();
      setMasterInterventionAreas(data);
    } catch (error) {
      console.error('Error fetching master intervention areas:', error);
      toast.error('Failed to load master intervention areas');
    }
  };

  const fetchInterventionAreas = async () => {
    try {
      const response = await fetch(`/api/intervention-areas?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch intervention areas');
      const data = await response.json();
      setInterventionAreas(data);
    } catch (error) {
      console.error('Error fetching intervention areas:', error);
      toast.error('Failed to load intervention areas');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: InterventionArea['status']) => {
    const colors = {
      APPROVED: 'text-green-600',
      PLANNED: 'text-blue-600',
      REJECTED: 'text-red-600',
    };
    return colors[status];
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('Are you sure you want to delete this intervention area? This action cannot be undone.')) {
      return;
    }

    setDeletingId(areaId);
    try {
      const response = await fetch(`/api/intervention-areas?id=${areaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete intervention area');
      }

      toast.success('Intervention area deleted successfully');
      await fetchInterventionAreas(); // Refresh the list
    } catch (error) {
      console.error('Error deleting intervention area:', error);
      toast.error('Failed to delete intervention area');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Intervention Areas</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Area
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serial No.</TableHead>
            <TableHead>Village</TableHead>
            <TableHead>Gram Panchayat</TableHead>
            <TableHead>Block</TableHead>
            <TableHead>District</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interventionAreas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No intervention areas found
              </TableCell>
            </TableRow>
          ) : (
            interventionAreas.map((area) => (
              <TableRow key={area.id}>
                <TableCell>{area.serialNumber}</TableCell>
                <TableCell>{area.villageName?.name || 'N/A'}</TableCell>
                <TableCell>{area.gramPanchayat?.name || 'N/A'}</TableCell>
                <TableCell>{area.blockName?.name || 'N/A'}</TableCell>
                <TableCell>{area.district?.name || 'N/A'}</TableCell>
                <TableCell>{area.state?.name || 'N/A'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    area.type === 'RURAL' 
                      ? 'bg-green-100 text-green-800' 
                      : area.type === 'URBAN'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {area.type || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>{area.selectedForYear}</TableCell>
                <TableCell className={getStatusColor(area.status)}>
                  {area.status.charAt(0) + area.status.slice(1).toLowerCase()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteArea(area.id)}
                    disabled={deletingId === area.id}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    {deletingId === area.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ProjectInterventionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        projectId={projectId}
        masterInterventionAreas={masterInterventionAreas}
        onAreaAdded={fetchInterventionAreas}
      />
    </div>
  );
} 