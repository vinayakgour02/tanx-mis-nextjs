"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { ProgramFormDialog } from "./create-program-dialog";
import { ProgramViewDialog } from "./ProgramViewDialog";
import { toast } from "sonner";
import { deleteProgram } from "../actions";
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

type SerializedProgram = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  baseline: string | null;
  target: string | null;
  status: string;
  priority: string;
  sector: string | null;
  theme: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProgramsListProps = {
  programs: SerializedProgram[];
};

export function ProgramsList({ programs }: ProgramsListProps) {
  const [selectedProgram, setSelectedProgram] = useState<SerializedProgram | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(programs);

  // for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<SerializedProgram | null>(null);

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteProgram(id);
        setItems((prev) => prev.filter((p) => p.id !== id));
        toast.success("Program deleted successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete program");
      }
    });
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Theme</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((program) => (
            <TableRow key={program.id}>
              <TableCell className="font-medium">{program.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{program.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant=
                  "outline"
                  className={`${program.priority === "HIGH" ? 'bg-green-500' : program.priority === "MEDIUM" ? 'bg-yellow-500' : 'bg-amber-500'}`}
                >
                  {program.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {program.budget
                  ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "INR",
                  }).format(Number(program.budget))
                  : "-"}
              </TableCell>
              <TableCell>
                {program.startDate ? format(new Date(program.startDate), "MMM d, yyyy") : "-"}
              </TableCell>
              <TableCell>
                {program.endDate ? format(new Date(program.endDate), "MMM d, yyyy") : "-"}
              </TableCell>
              <TableCell>{program.sector || "-"}</TableCell>
              <TableCell>{program.theme || "-"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedProgram(program);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedProgram(program);
                        setIsEditOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        setProgramToDelete(program);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                No programs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Program Dialog */}
      {selectedProgram && (
        <ProgramFormDialog
          initialData={selectedProgram}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}

      {viewOpen && selectedProgram && (
        <ProgramViewDialog
          open={viewOpen}
          onOpenChange={setViewOpen}
          program={selectedProgram}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{programToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (programToDelete) handleDelete(programToDelete.id);
                setDeleteDialogOpen(false);
              }}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
