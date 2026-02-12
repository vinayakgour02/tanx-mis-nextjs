'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Loader2, Plus, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreatePlanDialog } from './components/create-plan-dialog';
import  PlanDetailsDialog  from './components/view-plan-dialog';
import { Badge } from '@/components/ui/badge';

interface Plan {
  id: string;
  projectId: string;
  activityId: string;
  interventionAreaId: string | null;
  startMonth: Date;
  endMonth: Date;
  monthlyTargets: any;
  status: string;
  location: string | null;
  project: { name: string };
  activity: { name: string };
  interventionArea?: {
    villageName?: { id: string; name: string };
    blockName?: { id: string; name: string };
    district?: { id: string; name: string };
    gramPanchayat?: { id: string; name: string };
    state?: { id: string; name: string };
  };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || plan.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">
           Track plans across projects and activities.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <Input
          placeholder="Search plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || statusFilter !== 'all') && (
          <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Loading / Error */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        /* Table */
        <div className="rounded-xl border bg-background overflow-x-auto">
  <Table>
    <TableHeader className="bg-muted/50 sticky top-0 z-10">
      <TableRow>
        <TableHead className="w-[300px]">Project</TableHead>
        <TableHead className="w-[180px]">Activity</TableHead>
        <TableHead>Location</TableHead>
        <TableHead className="w-[120px]">Start</TableHead>
        <TableHead className="w-[120px]">End</TableHead>
        <TableHead className="w-[110px]">Status</TableHead>
        <TableHead className="text-right w-[140px]">Actions</TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      {filteredPlans.length === 0 ? (
        <TableRow>
          <TableCell colSpan={7} className="py-12 text-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="text-sm font-medium">No plans found</span>
              <span className="text-xs">Try adjusting filters or create a new plan</span>
            </div>
          </TableCell>
        </TableRow>
      ) : (
        filteredPlans.map((plan) => (
          <TableRow
            key={plan.id}
            className="hover:bg-muted/40 transition-colors"
          >
            {/* Project */}
            <TableCell className="font-medium  max-w-[180px]">
              {plan.project.name}
            </TableCell>

            {/* Activity */}
            <TableCell className=" max-w-[180px]">
              {plan.activity.name}
            </TableCell>

            {/* Location */}
            <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
              {plan.interventionArea
                ? [
                    plan.interventionArea.villageName?.name,
                    plan.interventionArea.blockName?.name,
                    plan.interventionArea.district?.name,
                  ]
                    .filter(Boolean)
                    .join(', ')
                : plan.location || 'N/A'}
            </TableCell>

            {/* Dates */}
            <TableCell className="text-sm">
              {format(new Date(plan.startMonth), 'MMM yyyy')}
            </TableCell>
            <TableCell className="text-sm">
              {format(new Date(plan.endMonth), 'MMM yyyy')}
            </TableCell>

            {/* Status */}
            <TableCell>
              <Badge
                variant="outline"
                className={
                  plan.status.toLowerCase() === 'planned'
                    ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                    : plan.status.toLowerCase() === 'active'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-blue-200 bg-blue-50 text-blue-800'
                }
              >
                {plan.status}
              </Badge>
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedPlanId(plan.id)
                    setIsViewDialogOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>

      )}

      {/* Dialogs */}
      <CreatePlanDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchPlans}
      />

      <PlanDetailsDialog
        isOpen={isViewDialogOpen}
        planId={selectedPlanId || ''}
        onClose={() => setIsViewDialogOpen(false)}
      />

    </div>
  );
}
