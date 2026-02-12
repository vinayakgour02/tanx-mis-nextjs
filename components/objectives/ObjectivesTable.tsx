'use client';

import * as React from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState
} from '@tanstack/react-table';
import { ChevronDown, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditObjectiveForm } from './EditObjectiveForm';
import { deleteObjective } from '@/app/actions/objectives';

interface Objective {
  id: string;
  code: string;
  type: 'Project' | 'Program' | 'Organization';
  level: string;
  description: string;
  createdAt: Date;
  project?: string | null;
  program?: string | null;
  projectId?: string | null;
  programId?: string | null;
  organizationId?: string | null;
}


interface DataTableProps {
  data: Objective[];
  scope: 'organization' | 'program' | 'project';
  projects: { id: string; name: string }[];
  programs: { id: string; name: string }[];
  organizationId?: string;
  onRefresh?: () => void;
}

export function DataTable({ data, scope, projects, programs, organizationId, onRefresh }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
console.log(scope)
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this objective?')) return;
    try {
      await deleteObjective(id);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete objective:', err);
    }
  };

  const columns: ColumnDef<Objective>[] = [
    // {
    //   accessorKey: 'program',
    //   header: 'Program',
    //   cell: ({ row }) => row.getValue('program') || '-',

    // },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => (
        <Badge>{row.getValue('level')}</Badge>
      ),
    },
{
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue('description')}>
          {row.getValue('description')}
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('code')}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('type')}</Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'PPP'),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const objective = row.original;
        return (
          <div className="flex items-center gap-2">
            {/* Edit Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Objective</DialogTitle>
                </DialogHeader>
                <EditObjectiveForm
                  scope={scope}
                  objective={{
                    ...objective,
                    programId: programs.find(p => p.name === objective.program)?.id ?? null,
                    projectId: projects.find(p => p.name === objective.project)?.id ?? null,
                  }}
                  organizationId={organizationId}
                  projects={projects}
                  programs={programs}
                  onSuccess={onRefresh}
                />
              </DialogContent>
            </Dialog>

            {/* Delete */}
            <Button
              size="icon"
              variant="destructive"
              onClick={() => handleDelete(objective.id)}
            >
              <Trash className="h-4 w-4 text-white " />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 py-4 px-6">
        <Input
          placeholder="Search all columns..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4 px-6">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
