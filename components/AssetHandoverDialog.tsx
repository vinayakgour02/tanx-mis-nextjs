"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserCheck, UploadCloud, Loader2, FileText, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { uploadToCloudinary } from "@/lib/cloudinary-client";

interface AssetHandoverDialogProps {
  assetId: string;
  assetName: string;
  availableQuantity: number;
  onSuccess?: () => void;
}

export function AssetHandoverDialog({
  assetId,
  assetName,
  availableQuantity,
  onSuccess,
}: AssetHandoverDialogProps) {
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    personName: "",
    mobileNumber: "",
    remarks: "",
    imageUrl: "",
  });

  /* -------------------------------- File Upload -------------------------------- */

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const result = await uploadToCloudinary(file, "asset_handovers");

      setFormData((prev) => ({
        ...prev,
        imageUrl: result.url,
      }));
    } catch (err) {
      console.error(err);
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* -------------------------------- Submit -------------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.backendToken) return;

    if (availableQuantity <= 0) {
      setError("No asset available for handover");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/asset-handovers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.backendToken}`,
          },
          body: JSON.stringify({
            assetId,
            personName: formData.personName,
            mobileNumber: formData.mobileNumber,
            imageUrl: formData.imageUrl,
            EvidenceCoordinate: null, // optional
            status: "ISSUED",
            remarks: formData.remarks,
            handoverDate: new Date().toISOString(),
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Handover failed");
      }

      /* Reset */
      setFormData({
        personName: "",
        mobileNumber: "",
        remarks: "",
        imageUrl: "",
      });

      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------- UI -------------------------------- */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={availableQuantity <= 0}
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Assign
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Hand Over Asset</DialogTitle>

          <DialogDescription>
            Assigning{" "}
            <span className="font-semibold text-slate-800">{assetName}</span>.
            Available: {availableQuantity}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Error */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {/* Person Name */}
          <div className="space-y-2">
            <Label>Recipient Name</Label>

            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

              <Input
                required
                placeholder="John Doe"
                className="pl-10"
                value={formData.personName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personName: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <Label>Mobile Number</Label>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

              <Input
                type="tel"
                placeholder="9876543210"
                className="pl-10"
                value={formData.mobileNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobileNumber: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Upload */}
          <div className="space-y-2">
            <Label>Proof (Image)</Label>

            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleFileChange}
              />

              {uploading && (
                <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
              )}
            </div>

            {formData.imageUrl && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <UploadCloud className="w-3 h-3" />
                Uploaded
              </p>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label>Remarks</Label>

            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

              <Textarea
                rows={3}
                className="pl-10 resize-none"
                placeholder="Condition / notes..."
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    remarks: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading || uploading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Handover"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
