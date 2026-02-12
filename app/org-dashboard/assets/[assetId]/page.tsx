"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AssetDialog } from "@/components/assets/AssetDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCcw, 
  MapPin, 
  IndianRupee, 
  Box, 
  Building2, 
  Smartphone,
  History,
  Clock,
  Briefcase,
  X,
  ZoomIn,
  Calendar
} from "lucide-react";

// Helper to format currency
const formatCurrency = (amount: string | number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount));
};

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function AssetDetail() {
  const { assetId } = useParams();
  const { data: session } = useSession();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State for Image Zoom Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getAssetDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${session?.user.backendToken}` },
      });
      const json = await res.json();
      if (json.success) {
        setAsset(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch asset", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (session) getAssetDetails(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, assetId]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCcw className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-gray-500">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (!asset) return <div className="p-8 text-center text-red-500">Asset not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen relative">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{asset.assetName}</h1>
            <Badge variant={asset.VariableQuantity > 0 ? "default" : "destructive"} className={asset.VariableQuantity > 0 ? "bg-green-600 hover:bg-green-700" : ""}>
              {asset.VariableQuantity > 0 ? "Available" : "Out of Stock"}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            {/* <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-700">{asset.id}</span>
            <span>•</span> */}
            <span>{asset.description}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <AssetDialog asset={asset} onSuccess={getAssetDetails} />
          <Button variant="outline" size="sm" onClick={getAssetDetails} className="bg-white">
            <RefreshCcw className="w-4 h-4 mr-2"/> Refresh
          </Button>
        </div>
      </div>

      {/* --- KEY METRICS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project Name (Simple View) */}
        <Card className="border-orange-100 shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Associated Project</CardTitle>
            <Briefcase className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold leading-tight line-clamp-2" title={asset.project?.name}>
              {asset.project?.name || "No Project Assigned"}
            </div>
          </CardContent>
        </Card>

        {/* Cost */}
        <Card className="border-orange-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Unit Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(asset.purchaseValue)}</div>
            <p className="text-xs text-gray-500">Purchased: {formatDate(asset.purchaseDate)}</p>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card className="border-orange-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Inventory</CardTitle>
            <Box className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{asset.VariableQuantity}</span>
              <span className="text-sm text-gray-400">/ {asset.quantity} units</span>
            </div>
            <p className="text-xs text-gray-500">In Stock</p>
          </CardContent>
        </Card>

        {/* Location & Donor */}
        <Card className="border-orange-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Location & Donor</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{asset.location || "N/A"}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
               <Building2 className="w-3 h-3 mr-1" />
               {asset.donor?.name || "Internal"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- HANDOVER HISTORY (Full Width) --- */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-orange-600" />
            Handover History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {asset.handovers && asset.handovers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {asset.handovers.map((ho: any) => (
                <div key={ho.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6">
                  
                  {/* Image Thumbnail with Zoom Trigger */}
                  <div className="flex-shrink-0">
                     {ho.imageUrl ? (
                       <div 
                        className="group relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border bg-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-all"
                        onClick={() => setPreviewImage(ho.imageUrl)}
                       >
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img 
                           src={ho.imageUrl} 
                           alt="Proof" 
                           className="object-cover w-full h-full"
                         />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 w-6 h-6 drop-shadow-md" />
                         </div>
                       </div>
                     ) : (
                       <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-gray-100 flex items-center justify-center border">
                         <Box className="w-8 h-8 text-gray-300" />
                       </div>
                     )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                            <p className="font-bold text-gray-900 text-lg">{ho.personName}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Smartphone className="w-4 h-4 mr-1.5" />
                                {ho.mobileNumber}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {ho.status === "RETURNED" ? 
                                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Returned</Badge>
                                : 
                                <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">Active</Badge>
                            }
                            <span className="text-xs text-gray-400">{formatDate(ho.date)}</span>
                        </div>
                    </div>

                    {ho.remarks && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic inline-block">
                            "{ho.remarks}"
                        </p>
                    )}

                    <div className="flex flex-wrap gap-4 pt-2">
                        {ho.EvidenceCoordinate && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${ho.EvidenceCoordinate}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                            >
                              <MapPin className="w-3.5 h-3.5 mr-1" />
                              View Coordinates
                            </a>
                        )}
                        {
                          ho.handoverDate && (
                            <div className="inline-flex items-center text-xs text-gray-500">
                              <Calendar className="w-3.5 h-3.5 mr-1" />
                              Handover on: {formatDate(ho.handoverDate)}
                            </div>
                          )
                        }
                        {ho.ReturnedAt && (
                            <div className="inline-flex items-center text-xs text-gray-500">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                Returned on: {formatDate(ho.ReturnedAt)}
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Box className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No History</h3>
                <p className="text-gray-500">No handover records found for this asset.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- IMAGE ZOOM MODAL --- */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewImage(null)}
        >
            <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
            <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={previewImage} 
                    alt="Evidence Zoom" 
                    className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                />
            </div>
        </div>
      )}

    </div>
  );
}