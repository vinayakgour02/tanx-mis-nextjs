'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Eye, Filter as FilterIcon, Pencil, X as XIcon, Search, Plus, Activity, Target, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CreateInterventionDialog } from './component/CreateProgramActivity';
import { ViewInterventionDialog } from './component/ViewInterventionDialog';
import { InterventionTemplateDownloader } from './component/InterventionTemplateDownloader';
import { BulkInterventionUploader } from './component/BulkInterventionUploader';

interface Program {
  id: string;
  name: string;
}

interface SubIntervention {
  id: string;
  name: string;
  description?: string;
  indicatorId?: string;
  Indicator?: {
    id: string;
    name: string;
    description?: string;
  };
}

interface Intervention {
  id: string;
  name: string;
  objectiveId: string;
  indicatorId: string;
  programs: Program[];
  SubIntervention: SubIntervention[];
  objective?: {
    id: string;
    description: string;
  };
  indicator?: {
    id: string;
    name: string;
  };
}

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [editIntervention, setEditIntervention] = useState<Intervention | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // filters & search
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchInterventions();
    fetchprograms();
  }, []);

  const fetchInterventions = async () => {
    try {
      setError(null);
      const response = await fetch('/api/intervention');
      if (!response.ok) throw new Error('Failed to fetch interventions');
      const data = await response.json();
      console.log(data);
      setInterventions(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch interventions';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchprograms = async () => {
    try {
      const response = await fetch('/api/programs');
      const data = await response.json();
      setPrograms(data);
    } catch (error) {
      toast.error('Failed to fetch programs');
    }
  };

  // filter + search logic
  const filteredInterventions = useMemo(() => {
    return interventions.filter((i) => {
      const programMatch =
        selectedProgram === 'all' ||
        i.programs.some((p) => p.id === selectedProgram);

      const searchMatch =
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.SubIntervention.some((s) =>
          s.name.toLowerCase().includes(search.toLowerCase())
        ) ||
        i.programs.some((p) =>
          p.name.toLowerCase().includes(search.toLowerCase())
        );

      return programMatch && searchMatch;
    });
  }, [interventions, selectedProgram, selectedType, search]);

  const clearFilters = () => {
    setSelectedProgram('all');
    setSelectedType('all');
    setSearch('');
  };

  const hasActiveFilters =
    search.trim() !== '' || selectedProgram !== 'all' || selectedType !== 'all';

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSubInterventions = interventions.reduce((sum, i) => sum + i.SubIntervention.length, 0);
    const programsWithInterventions = new Set(interventions.flatMap(i => i.programs.map(p => p.id))).size;
    return {
      totalInterventions: interventions.length,
      totalSubInterventions,
      programsWithInterventions,
      avgSubInterventionsPerIntervention: interventions.length > 0 ? (totalSubInterventions / interventions.length).toFixed(1) : '0'
    };
  }, [interventions]);

  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    </TableRow>
  );

  const handleRefresh = () => {
    setIsLoading(true);
    fetchInterventions();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-lg">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Activity Interventions
            </h1>
            <p className="text-slate-600">Manage and monitor program interventions and activities</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <BulkInterventionUploader/>

            <InterventionTemplateDownloader />

            <CreateInterventionDialog
              programs={programs}
              onInterventionSaved={fetchInterventions}
            />
          </div>

        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Interventions</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalInterventions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Sub-Interventions</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalSubInterventions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Programs</p>
                <p className="text-2xl font-bold text-slate-800">{stats.programsWithInterventions}</p>
              </div>
            </div>
          </Card>

          {/* <Card className="p-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Avg. Activities</p>
                <p className="text-2xl font-bold text-slate-800">{stats.avgSubInterventionsPerIntervention}</p>
              </div>
            </div>
          </Card> */}
        </div>

        {/* Search + Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FilterIcon className="h-5 w-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Search & Filter</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search interventions, activities, or programs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>

              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-sm text-slate-600">
                  Showing <span className="font-semibold text-blue-600">{filteredInterventions.length}</span> of <span className="font-semibold">{interventions.length}</span> interventions
                </div>
                <div className="flex gap-2">
                  {search && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      Search: "{search}"
                    </Badge>
                  )}
                  {selectedProgram !== 'all' && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      Program: {programs.find(p => p.id === selectedProgram)?.name}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Enhanced Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Intervention</TableHead>
                  <TableHead className="font-semibold text-slate-700">Sub-Interventions</TableHead>
                  <TableHead className="font-semibold text-slate-700">Programs</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                  </>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Alert variant="destructive" className="my-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : filteredInterventions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-slate-100 rounded-full">
                          <Target className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-slate-700">No interventions found</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first intervention to get started'}
                          </p>
                        </div>
                        {!hasActiveFilters && (
                          <CreateInterventionDialog
                            programs={programs}
                            onInterventionSaved={fetchInterventions}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInterventions.map((i, index) => (
                    <TableRow
                      key={i.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Target className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{i.name}</p>
                            {i.objective?.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {i.objective.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {i.SubIntervention.length > 0 ? (
                          <div className="space-y-2">
                            {i.SubIntervention.slice(0, 3).map((si, idx) => (
                              <div key={si.id ?? idx} className="flex items-center justify-between p-2 bg-slate-50 ">
                                <span className="text-sm font-medium text-slate-700">{si.name}</span>
                                {si.Indicator && (
                                  <Badge variant="outline" className="text-xs bg-white rounded-none">
                                    {si.Indicator.name.length > 20
                                      ? `${si.Indicator.name.substring(0, 20)}...`
                                      : si.Indicator.name}
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {i.SubIntervention.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIntervention(i)}
                                className="w-full text-xs text-blue-600 hover:bg-blue-50"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                View {i.SubIntervention.length - 3} more activities
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                              <Activity className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-500">No activities yet</span>
                            </div>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {i.programs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {i.programs.map((p) => (
                              <Badge key={p.id} className="bg-green-50 text-green-700 hover:bg-green-100 rounded-none">
                                {p.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            Not assigned
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIntervention(i)}
                            className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditIntervention(i);
                              setIsEditDialogOpen(true);
                            }}
                            className="hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Detail Modal */}
        {selectedIntervention && (
          <ViewInterventionDialog
            intervention={selectedIntervention}
            open={!!selectedIntervention}
            onOpenChange={(isOpen) => {
              if (!isOpen) setSelectedIntervention(null);
            }}
            onDeleted={fetchInterventions}
          />
        )}

        {/* Edit Modal */}
        {editIntervention && (
          <CreateInterventionDialog
            programs={programs}
            onInterventionSaved={() => {
              fetchInterventions();
              setEditIntervention(null);
              setIsEditDialogOpen(false);
            }}
            initialData={editIntervention}
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setEditIntervention(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}