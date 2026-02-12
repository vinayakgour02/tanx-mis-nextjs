'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

interface ViewInterventionDialogProps {
  intervention: any; // your intervention object
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function ViewInterventionDialog({
  intervention,
  open,
  onOpenChange,
  onDeleted,
}: ViewInterventionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this intervention?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/intervention/${intervention.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete intervention');
      toast.success('Intervention deleted successfully');
      onDeleted();
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete intervention');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {intervention.name}
            <Badge>{intervention.activityType}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Intervention Summary */}
        <div className="grid gap-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Objective</h3>
              <p className="text-sm text-muted-foreground">
                {intervention.objective?.description}
              </p>
              <Badge variant="outline">{intervention.objective?.level}</Badge>
            </CardContent>
          </Card>

          {/* <Card> */}
            {/* <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Indicator</h3>
              <p className="text-sm">{intervention.indicator?.name}</p>
              {/* <div className="text-xs text-muted-foreground">
                {intervention.indicator?.definition}
              </div> */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{intervention.indicator?.type}</Badge>
                <Badge variant="secondary">{intervention.indicator?.frequency}</Badge>
                <Badge variant="secondary">{intervention.indicator?.unitOfMeasure}</Badge>
              </div>
            {/* </CardContent> */} 
          {/* </Card> */}

          {/* Sub Interventions */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Sub-Interventions</h3>
              {intervention.SubIntervention?.length > 0 ? (
                <div className="space-y-4">
                  {intervention.SubIntervention.map((sub: any) => (
                    <div key={sub.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{sub.name}</h4>
                        {sub.description && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {sub.description}
                          </span>
                        )}
                      </div>
                      {sub.Indicator && (
                        <div className="ml-4 p-2 bg-muted/50 rounded">
                          <h5 className="text-sm font-medium text-muted-foreground">Indicator:</h5>
                          <p className="text-sm">{sub.Indicator.name}</p>
                          {sub.Indicator.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {sub.Indicator.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sub-interventions available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className='text-white'
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
