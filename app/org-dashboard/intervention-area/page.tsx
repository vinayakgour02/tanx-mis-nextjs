'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { InterventionArea } from '@prisma/client';
import { DataTable } from './data-table';
import { AddInterventionDialog } from './add-intervention-dialog';
import { columns } from './columns';

type InterventionAreaWithProject = InterventionArea & {
  project: {
    name: string;
    code: string | null;
  };
};

export default function InterventionAreaPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [data, setData] = useState<InterventionAreaWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInterventionAreas();
  }, []);

  const fetchInterventionAreas = async () => {
    try {
      const response = await fetch('/api/intervention-areas/master-intervention');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching intervention areas:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Intervention Areas</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Intervention Area
        </Button>
      </div>

      <DataTable columns={columns} data={data} />
      
      <AddInterventionDialog 
        open={isDialogOpen} 
        admin={true}
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  );
}
