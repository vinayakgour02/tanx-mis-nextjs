"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Loader2 } from "lucide-react";

export function AssetDialog({ asset, onSuccess }: { asset?: any; onSuccess: () => void }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [donors, setDonors] = useState([]);
  const [projects, setProjects] = useState([]);

  const [formData, setFormData] = useState({
    assetName: asset?.assetName || "",
    description: asset?.description || "",
    purchaseDate: asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : "",
    purchaseValue: asset?.purchaseValue || 0,
    quantity: asset?.quantity || 1,
    location: asset?.location || "",
    projectId: asset?.projectId || "none",
    donorId: asset?.donorId || "none",
    status: asset?.status || "AVAILABLE",
  });

  useEffect(() => {
    if (open && session?.user?.backendToken) {
      const fetchData = async () => {
        const headers = { Authorization: `Bearer ${session.user.backendToken}` };
        const orgId = session.user.organizationId;
        try {
          const [donorRes, projectRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/donors?organizationId=${orgId}`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects?organizationId=${orgId}`, { headers }),
          ]);
          const donorData = await donorRes.json();
          const projectData = await projectRes.json();
          setDonors(donorData.data || []);
          setProjects(projectData.data || []);
        } catch (err) {
          console.error("Failed to load select data", err);
        }
      };
      fetchData();
    }
  }, [open, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = asset 
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/${asset.id}`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/assets`;
    
    const method = asset ? "PUT" : "POST";

    const payload = {
      ...formData,
      organizationId: session?.user.organizationId,
      projectId: formData.projectId === "none" ? null : formData.projectId,
      donorId: formData.donorId === "none" ? null : formData.donorId,
      purchaseValue: Number(formData.purchaseValue),
      quantity: Number(formData.quantity),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.backendToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setOpen(false);
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {asset ? (
          <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
            <Edit className="w-4 h-4 mr-2" /> Update Asset
          </Button>
        ) : (
          <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all active:scale-95">
            <Plus className="w-4 h-4 mr-2" /> New Asset
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-orange-100 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {asset ? "Update Asset Details" : "Register New Asset"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="assetName" className="text-gray-600 text-xs font-bold uppercase tracking-wider">Asset Name</Label>
              <Input 
                id="assetName" 
                placeholder="e.g. Dell Latitude 5420"
                className="focus-visible:ring-orange-500 border-gray-200"
                value={formData.assetName} 
                onChange={(e) => setFormData({...formData, assetName: e.target.value})}
                required 
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description" className="text-gray-600 text-xs font-bold uppercase tracking-wider">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Serial numbers, hardware specs..."
                className="focus-visible:ring-orange-500 min-h-[70px] border-gray-200"
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate" className="text-gray-600 text-xs font-bold uppercase tracking-wider">Purchase Date</Label>
              <Input 
                type="date"
                id="purchaseDate" 
                className="focus-visible:ring-orange-500 border-gray-200"
                value={formData.purchaseDate} 
                onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchaseValue" className="text-gray-600 text-xs font-bold uppercase tracking-wider">Value (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₹</span>
                <Input 
                  type="number"
                  id="purchaseValue" 
                  className="focus-visible:ring-orange-500 pl-7 border-gray-200"
                  value={formData.purchaseValue} 
                  onChange={(e) => setFormData({...formData, purchaseValue: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-gray-600 text-xs font-bold uppercase tracking-wider">Quantity</Label>
              <Input 
                type="number"
                id="quantity" 
                className="focus-visible:ring-orange-500 border-gray-200"
                value={formData.quantity} 
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-gray-600 text-xs font-bold uppercase tracking-wider">Location</Label>
              <Input 
                id="location" 
                placeholder="Office Floor 3"
                className="focus-visible:ring-orange-500 border-gray-200"
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            {/* Fixed Width Selects with Truncation */}
            <div className="space-y-1.5 overflow-hidden">
              <Label className="text-gray-600 text-xs font-bold uppercase tracking-wider">Project</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(v) => setFormData({...formData, projectId: v})}
              >
                <SelectTrigger className="focus:ring-orange-500 border-gray-200 w-full overflow-hidden">
                  <div className="truncate text-left pr-2">
                    <SelectValue placeholder="Select Project" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-w-[250px]">
                  <SelectItem value="none">None (General)</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="truncate">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 overflow-hidden">
              <Label className="text-gray-600 text-xs font-bold uppercase tracking-wider">Donor</Label>
              <Select 
                value={formData.donorId} 
                onValueChange={(v) => setFormData({...formData, donorId: v})}
              >
                <SelectTrigger className="focus:ring-orange-500 border-gray-200 w-full overflow-hidden">
                  <div className="truncate text-left pr-2">
                    <SelectValue placeholder="Select Donor" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-w-[250px]">
                  <SelectItem value="none">None (Internal)</SelectItem>
                  {donors.map((d: any) => (
                    <SelectItem key={d.id} value={d.id} className="truncate">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 border-gray-200 hover:bg-gray-50" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {asset ? "Update Asset" : "Register Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}