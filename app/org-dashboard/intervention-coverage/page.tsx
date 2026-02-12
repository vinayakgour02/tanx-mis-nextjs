'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Search, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddStateDialog } from '@/app/org-dashboard/intervention-coverage/components/AddStateDialog';
import { AddDistrictDialog } from '@/app/org-dashboard/intervention-coverage/components/AddDistrictDialog';
import { AddBlockDialog } from '@/app/org-dashboard/intervention-coverage/components/AddBlockDialog';
import { AddGramPanchayatDialog } from '@/app/org-dashboard/intervention-coverage/components/AddGramPanchayatDialog';
import { AddVillageDialog } from '@/app/org-dashboard/intervention-coverage/components/AddVillageDialog';
import { usePermissions } from '@/hooks/use-permissions';

interface State {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    district: number;
  };
}

interface District {
  id: string;
  name: string;
  stateId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  state?: {
    name: string;
  };
  _count?: {
    block: number;
  };
}

interface Block {
  id: string;
  name: string;
  districtId: string;
  areaType: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  district?: {
    name: string;
    state?: {
      name: string;
    };
  };
  _count?: {
    grampanchaya: number;
  };
}

interface GramPanchayat {
  id: string;
  name: string;
  blockId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  block?: {
    name: string;
    district?: {
      name: string;
      state?: {
        name: string;
      };
    };
  };
  _count?: {
    village: number;
  };
}

interface Village {
  id: string;
  name: string;
  gramPanchayatId: string;
  createdAt: string;
  updatedAt: string;
  gramPanchayat?: {
    name: string;
    block?: {
      name: string;
      district?: {
        name: string;
        state?: {
          name: string;
        };
      };
    };
  };
}

type CoverageLevel = 'state' | 'district' | 'block' | 'gramPanchayat' | 'village';
type CoverageData = State | District | Block | GramPanchayat | Village;

export default function InterventionCoveragePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [filteredData, setFilteredData] = useState<CoverageData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [level, setLevel] = useState<CoverageLevel>('state');
  const [selectedParentId, setSelectedParentId] = useState<string>('all');
  const [parentOptions, setParentOptions] = useState<{ value: string; label: string }[]>([]);
  
  // Dialog states
  const [isAddStateDialogOpen, setIsAddStateDialogOpen] = useState(false);
  const [isAddDistrictDialogOpen, setIsAddDistrictDialogOpen] = useState(false);
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);
  const [isAddGramPanchayatDialogOpen, setIsAddGramPanchayatDialogOpen] = useState(false);
  const [isAddVillageDialogOpen, setIsAddVillageDialogOpen] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalStates: 0,
    totalDistricts: 0,
    totalBlocks: 0,
    totalGramPanchayats: 0,
    totalVillages: 0,
  });

  const { can } = usePermissions();

const canCreateCoverage =
  can("organization.intervention-areas", "write") ||
  can("organization.intervention-areas", "create") ||
  can("organization.intervention-areas", "admin");


  useEffect(() => {
    const levelParam = searchParams.get('level') as CoverageLevel;
    const parentIdParam = searchParams.get('parentId');
    
    if (levelParam && ['state', 'district', 'block', 'gramPanchayat', 'village'].includes(levelParam)) {
      setLevel(levelParam);
    }
    
    if (parentIdParam) {
      setSelectedParentId(parentIdParam);
    } else {
      setSelectedParentId('all');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [level, selectedParentId]);

  useEffect(() => {
    fetchParentOptions();
  }, [level]);

  useEffect(() => {
    const filtered = coverageData.filter((item) => {
      const name = (item as any).name?.toLowerCase() || '';
      return name.includes(searchTerm.toLowerCase());
    });
    setFilteredData(filtered);
  }, [coverageData, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/${level}s`;
      if (selectedParentId && selectedParentId !== 'all' && level !== 'state') {
        const parentParam = getParentParamName(level);
        url += `?${parentParam}=${selectedParentId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      setCoverageData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load intervention coverage data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/intervention-coverage/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchParentOptions = async () => {
    if (level === 'state') {
      setParentOptions([]);
      return;
    }
    
    try {
      const parentLevel = getParentLevel(level);
      const response = await fetch(`/api/${parentLevel}s`);
      
      if (response.ok) {
        const data = await response.json();
        const options = data.map((item: any) => ({
          value: item.id,
          label: item.name,
        }));
        setParentOptions(options);
      }
    } catch (error) {
      console.error('Error fetching parent options:', error);
    }
  };

  const getParentLevel = (currentLevel: CoverageLevel): string => {
    switch (currentLevel) {
      case 'district': return 'state';
      case 'block': return 'district';
      case 'gramPanchayat': return 'block';
      case 'village': return 'gramPanchayat';
      default: return '';
    }
  };

  const getParentParamName = (currentLevel: CoverageLevel): string => {
    switch (currentLevel) {
      case 'district': return 'stateId';
      case 'block': return 'districtId';
      case 'gramPanchayat': return 'blockId';
      case 'village': return 'gramPanchayatId';
      default: return '';
    }
  };

  const getTableHeaders = () => {
    const baseHeaders = ['Name'];
    
    switch (level) {
      case 'state':
        return [...baseHeaders, 'Districts Count'];
      case 'district':
        return ['State', ...baseHeaders, 'Blocks Count'];
      case 'block':
        return ['State', 'District', ...baseHeaders, 'Area Type', 'Gram Panchayats Count'];
      case 'gramPanchayat':
        return ['State', 'District', 'Block', ...baseHeaders, 'Villages Count'];
      case 'village':
        return ['State', 'District', 'Block', 'Gram Panchayat', ...baseHeaders];
      default:
        return baseHeaders;
    }
  };

  const renderTableCell = (item: CoverageData, header: string) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString();
    };

    switch (header) {
      case 'Name':
        return (item as any).name;
      case 'Districts Count':
        return (item as State)?._count?.district || 0;
      case 'Blocks Count':
        return (item as District)?._count?.block || 0;
      case 'Gram Panchayats Count':
        return (item as Block)?._count?.grampanchaya || 0;
      case 'Villages Count':
        return (item as GramPanchayat)?._count?.village || 0;
      case 'Area Type':
        return (item as Block)?.areaType || 'N/A';
      case 'State':
        if (level === 'district') return (item as District)?.state?.name || 'N/A';
        if (level === 'block') return (item as Block)?.district?.state?.name || 'N/A';
        if (level === 'gramPanchayat') return (item as GramPanchayat)?.block?.district?.state?.name || 'N/A';
        if (level === 'village') return (item as Village)?.gramPanchayat?.block?.district?.state?.name || 'N/A';
        return 'N/A';
      case 'District':
        if (level === 'block') return (item as Block)?.district?.name || 'N/A';
        if (level === 'gramPanchayat') return (item as GramPanchayat)?.block?.district?.name || 'N/A';
        if (level === 'village') return (item as Village)?.gramPanchayat?.block?.district?.name || 'N/A';
        return 'N/A';
      case 'Block':
        if (level === 'gramPanchayat') return (item as GramPanchayat)?.block?.name || 'N/A';
        if (level === 'village') return (item as Village)?.gramPanchayat?.block?.name || 'N/A';
        return 'N/A';
      case 'Gram Panchayat':
        if (level === 'village') return (item as Village)?.gramPanchayat?.name || 'N/A';
        return 'N/A';
      default:
        return 'N/A';
    }
  };

  const handleLevelChange = (newLevel: CoverageLevel) => {
    setLevel(newLevel);
    setSelectedParentId('all');
    router.push(`/org-dashboard/intervention-coverage?level=${newLevel}`);
  };

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    if (parentId === 'all') {
      router.push(`/org-dashboard/intervention-coverage?level=${level}`);
    } else {
      router.push(`/org-dashboard/intervention-coverage?level=${level}&parentId=${parentId}`);
    }
  };

  const canAddAtCurrentLevel = () => {
    // All levels can now be added
    return true;
  };

  const handleAddClick = () => {
    if (level === 'state') {
      setIsAddStateDialogOpen(true);
    } else if (level === 'district') {
      setIsAddDistrictDialogOpen(true);
    } else if (level === 'block') {
      setIsAddBlockDialogOpen(true);
    } else if (level === 'gramPanchayat') {
      setIsAddGramPanchayatDialogOpen(true);
    } else if (level === 'village') {
      setIsAddVillageDialogOpen(true);
    }
  };

  const refreshData = () => {
    fetchData();
    fetchStats();
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Intervention Coverage</h1>
        <p className="text-muted-foreground">
          Manage and view intervention coverage across states, districts, blocks, gram panchayats, and villages.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">States</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Districts</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDistricts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocks</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBlocks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gram Panchayats</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGramPanchayats}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Villages</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVillages}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Coverage Level</label>
            <Select value={level} onValueChange={handleLevelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select coverage level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="state">States</SelectItem>
                <SelectItem value="district">Districts</SelectItem>
                <SelectItem value="block">Blocks</SelectItem>
                <SelectItem value="gramPanchayat">Gram Panchayats</SelectItem>
                <SelectItem value="village">Villages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {level !== 'state' && parentOptions.length > 0 && (
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Filter by {getParentLevel(level).charAt(0).toUpperCase() + getParentLevel(level).slice(1)}
              </label>
              <Select value={selectedParentId} onValueChange={handleParentChange}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${getParentLevel(level)}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {getParentLevel(level)}s</SelectItem>
                  {parentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${level}s...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

         {canCreateCoverage && (
  <div className="flex items-end">
    <Button onClick={handleAddClick} className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Add {level.charAt(0).toUpperCase() + level.slice(1)}
    </Button>
  </div>
)}

        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {level.charAt(0).toUpperCase() + level.slice(1)}s
            {selectedParentId && selectedParentId !== 'all' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Filtered)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {filteredData.length} {level}(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {getTableHeaders().map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={getTableHeaders().length} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={getTableHeaders().length} className="text-center py-8 text-muted-foreground">
                      No {level}s found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={(item as any).id}>
                      {getTableHeaders().map((header) => (
                        <TableCell key={header}>
                          {renderTableCell(item, header)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddStateDialog
        open={isAddStateDialogOpen}
        onOpenChange={setIsAddStateDialogOpen}
        onSuccess={refreshData}
      />

      <AddDistrictDialog
        open={isAddDistrictDialogOpen}
        onOpenChange={setIsAddDistrictDialogOpen}
        onSuccess={refreshData}
      />

      <AddBlockDialog
        open={isAddBlockDialogOpen}
        onOpenChange={setIsAddBlockDialogOpen}
        onSuccess={refreshData}
      />

      <AddGramPanchayatDialog
        open={isAddGramPanchayatDialogOpen}
        onOpenChange={setIsAddGramPanchayatDialogOpen}
        onSuccess={refreshData}
      />

      <AddVillageDialog
        open={isAddVillageDialogOpen}
        onOpenChange={setIsAddVillageDialogOpen}
        onSuccess={refreshData}
      />
    </div>
  );
}