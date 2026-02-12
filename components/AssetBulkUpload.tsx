"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Download, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AssetBulkUpload({ onSuccess }: { onSuccess: () => void }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleDownloadTemplate = async () => {
    try {
      const orgId = session?.user?.organizationId;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/bulk-template?organizationId=${orgId}`,
        {
          headers: { Authorization: `Bearer ${session?.user.backendToken}` },
        }
      );
      
      if (!res.ok) throw new Error("Failed to download");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Asset_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError("Failed to download template.");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !session?.user?.organizationId) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('organizationId', session.user.organizationId);
    console.log("formData content:", Object.fromEntries(formData.entries()));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/bulk-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.backendToken}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSuccessMsg(data.message);
      setTimeout(() => {
        setOpen(false);
        setFile(null);
        setSuccessMsg("");
        onSuccess();
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-orange-700 border-orange-200 hover:bg-orange-50">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Bulk Upload
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] border-orange-100">
        <DialogHeader>
          <DialogTitle>Bulk Upload Assets</DialogTitle>
          <DialogDescription>
            Add multiple assets at once using an Excel sheet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          
          {/* Step 1: Download */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center">
              <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">1</span>
              Download Template
            </h4>
            <p className="text-xs text-slate-500">
              Get the Excel file with pre-filled Project and Donor dropdowns.
            </p>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              className="w-full mt-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" /> Download Excel Template
            </Button>
          </div>

          {/* Step 2: Upload */}
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-semibold text-slate-800 flex items-center">
                <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Upload Filled File
              </Label>
              <Input 
                id="file" 
                type="file" 
                accept=".xlsx, .xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer file:text-orange-700 file:font-semibold hover:file:bg-orange-50"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMsg && (
              <Alert className="py-2 border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{successMsg}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!file || loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload Assets
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}