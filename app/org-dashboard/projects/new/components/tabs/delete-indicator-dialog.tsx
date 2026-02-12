"use client";

import React, { useState } from "react";
import { toast } from "sonner";

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

interface DeleteIndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  indicator: any;
  projectId?: string; // Add projectId for API calls
}

export function DeleteIndicatorDialog({
  open,
  onOpenChange,
  onConfirm,
  indicator,
  projectId,
}: DeleteIndicatorDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      // If indicator has an ID, make API call to delete it
      if (indicator?.id && projectId) {
        const response = await fetch(`/api/indicators/${indicator.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete indicator');
        }
      }
      
      // Always call onConfirm to update the local state
      onConfirm();
      onOpenChange(false);
      toast.success('Indicator deleted successfully!');
    } catch (error) {
      console.error("Error deleting indicator:", error);
      toast.error('Failed to delete indicator. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Indicator</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the indicator "{indicator?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}