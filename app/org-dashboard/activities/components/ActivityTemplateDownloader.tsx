"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { useOrganizationId } from "@/hooks/useOrganizationId";
import axios from "axios";
import { useSession } from "next-auth/react";

interface Project {
  id: string;
  name: string;
}

export function ActivityTemplateDownloader() {
  const { organizationId } = useOrganizationId();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");

  const { data: session, status } = useSession()
  useEffect(() => {
    if (!organizationId) return;
    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/activity-options?organizationId=${organizationId}`,
      {
          headers: {
            Authorization: `Bearer ${session?.user.backendToken}`,
          },
        }
    )
      .then(res => res.data.success && setProjects(res.data.data));
  }, [organizationId]);

 const handleDownload = async () => {
    if (!selectedProject) {
      toast.error("Please select a project before downloading.");
      return;
    }

    setLoading(true);
   try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/bulk-template?projectId=${selectedProject}&organizationId=${organizationId}`,
        { responseType: 'blob' }
      );
      
      // Create Blob Link to trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Project_Plan_Template.xlsx`);
      document.body.appendChild(link);
      link.click();

      link.remove();
      toast.success("Template downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Project</DialogTitle>
            <DialogDescription>
              Choose the project to download an Excel template for adding multiple activities.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={loading || !selectedProject}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
