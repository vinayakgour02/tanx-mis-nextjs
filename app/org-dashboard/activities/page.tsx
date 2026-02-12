'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  RefreshCw,
  Eye,
  Loader2,
  Trash2,
  Pencil,
  FileSpreadsheet,
  Database,
  LayoutGrid
} from 'lucide-react';
import { EditActivityDialog } from './components/EditActivityDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CreateActivityDialog } from './components/CreateActivityDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
import { ActivityTemplateDownloader } from './components/ActivityTemplateDownloader';
import { BulkActivityUploader } from './components/BulkActivityUploader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ViewActivityPlanDialog } from './components/ViewActivityPlanDialog';

// --- Types ---
interface Activity {
  id: string;
  projectId: string;
  indicatorId?: string;
  objectiveId?: string;
  code?: string;
  name: string;
  description?: string;
  type: string;
  startDate?: string;
  endDate?: string;
  status: string;
  objective?: { description: string };
  indicator?: { name: string };
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [editActivityId, setEditActivityId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setError(null);
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!deleteActivityId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/activities/${deleteActivityId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Activity deleted');
      fetchActivities();
    } catch (err) {
      toast.error('Failed to delete activity');
    } finally {
      setIsDeleting(false);
      setDeleteActivityId(null);
    }
  };

  const toggleStatus = async (activity: Activity) => {
    const newStatus = activity.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    // Optimistic Update
    setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, status: newStatus } : a));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error();
      toast.success(`Marked as ${newStatus}`);
    } catch {
      setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, status: activity.status } : a));
      toast.error('Update failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-col md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Project Activities & Planning</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor project tasks and progress.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchActivities} 
            className="hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/org-dashboard/activities/bulk-create')}
          >
            <Plus className="mr-2 h-4 w-4 text-orange-600" />
            Bulk Create
          </Button>
          
          <ActivityTemplateDownloader />
          <BulkActivityUploader />
          
          <CreateActivityDialog onActivityCreated={fetchActivities} />
          
          <Link href='/org-dashboard/activities/raw'>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all active:scale-95">
              <Database className="mr-2 h-4 w-4" />
              Raw Data
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-slate-700">Code</TableHead>
              <TableHead className="font-bold text-slate-700">Name</TableHead>
              <TableHead className="font-bold text-slate-700">Timing</TableHead>
              <TableHead className="font-bold text-slate-700">Focus Area</TableHead>
              <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
              <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-10 w-full opacity-50" /></TableCell>
                </TableRow>
              ))
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center opacity-40">
                    <LayoutGrid size={48} />
                    <p className="mt-2 font-medium">No activities found yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => (
                <TableRow key={activity.id} className="group transition-colors hover:bg-orange-50/30">
                  <TableCell>
                    <code className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {activity.code || activity.id.slice(0, 6).toUpperCase()}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col ]">
                      <span className="font-semibold text-slate-800">{activity.name}</span>
                      <span className="text-xs text-muted-foreground italic line-clamp-1">{activity.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">
                        {activity.startDate ? format(new Date(activity.startDate), 'MMM yyyy') : '—'}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Start Date</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-xs font-medium text-slate-600 line-clamp-1">
                      Obj: {activity.objective?.description ?? 'N/A'}
                    </p>
                    <p className="text-[10px] text-orange-600/70 truncate">
                      Ind: {activity.indicator?.name ?? 'N/A'}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      onClick={() => toggleStatus(activity)}
                      className={`cursor-pointer transition-all hover:ring-2 hover:ring-offset-2 hover:ring-orange-200 ${
                        activity.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 border-none' 
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-none'
                      }`}
                    >
                      {activity.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedActivity(activity.id)} className="h-8 w-8 hover:bg-white hover:text-orange-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditActivityId(activity.id)} className="h-8 w-8 hover:bg-white hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteActivityId(activity.id)} className="h-8 w-8 hover:bg-white hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialogs */}
      <AlertDialog open={!!deleteActivityId} onOpenChange={() => setDeleteActivityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-none bg-slate-100">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ViewActivityPlanDialog 
        activityId={selectedActivity} 
        open={!!selectedActivity} 
        onOpenChange={(open) => !open && setSelectedActivity(null)} 
      />

      <EditActivityDialog
        open={!!editActivityId}
        activityId={editActivityId}
        onOpenChange={(open) => !open && setEditActivityId(null)}
        onActivityUpdated={fetchActivities}
      />
    </div>
  );
}