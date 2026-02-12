"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { 
  Search, Eye, Box, MapPin, RefreshCcw, 
  TrendingUp, Layers, DollarSign, Calendar, 
  Briefcase, HeartHandshake, IndianRupee
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AssetDialog } from "@/components/assets/AssetDialog";
import { Progress } from "@/components/ui/progress";

export default function AssetsPage() {
  const { data: session } = useSession();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAssets = async () => {
    if (!session?.user?.organizationId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/assets?organizationId=${session.user.organizationId}&search=${search}`,
        {
          headers: { Authorization: `Bearer ${session.user.backendToken}` },
        }
      );
      const json = await res.json();
      setAssets(json.data || []);
    } catch (error) {
      console.error("Failed to fetch assets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, [session, search]);

  // Calculate Statistics using useMemo for performance
  const stats = useMemo(() => {
    return assets.reduce(
      (acc, curr: any) => ({
        totalValue: acc.totalValue + (parseFloat(curr.purchaseValue) || 0),
        totalItems: acc.totalItems + (curr.quantity || 0),
        availableItems: acc.availableItems + (curr.VariableQuantity || 0),
      }),
      { totalValue: 0, totalItems: 0, availableItems: 0 }
    );
  }, [assets]);

  // Format Currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format Date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Asset Inventory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Overview of organization assets, donors, and utilization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AssetDialog onSuccess={fetchAssets} />
            <Button variant="outline" size="sm" onClick={fetchAssets} className="h-9">
               <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Inventory</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.totalItems}</h3>
                <p className="text-xs text-slate-400"> across {assets.length} unique entries</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Value</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</h3>
                <p className="text-xs text-slate-400">Recorded purchase value</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Available Stock</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.availableItems}</h3>
                <p className="text-xs text-slate-400">
                   {stats.totalItems > 0 ? ((stats.availableItems / stats.totalItems) * 100).toFixed(0) : 0}% utilization rate
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search assets by name, project, or donor..."
            className="pl-10 max-w-sm bg-white border-slate-200 focus:ring-orange-500/20 focus:border-orange-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Enhanced Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow className="hover:bg-slate-50">
                <TableHead className="w-[300px] font-semibold text-slate-600">Asset Details</TableHead>
                <TableHead className="font-semibold text-slate-600">Context</TableHead>
                <TableHead className="font-semibold text-slate-600">Purchase Info</TableHead>
                <TableHead className="w-[200px] font-semibold text-slate-600">Stock & Location</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCcw className="w-4 h-4 animate-spin" /> Loading data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Box className="w-12 h-12 text-slate-200" />
                      <p className="text-slate-500 font-medium">No assets found</p>
                      <p className="text-xs text-slate-400">Adjust search or add new inventory.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset: any) => {
                  // Calculate stock percentage
                  const stockPercent = asset.quantity > 0 
                    ? (asset.VariableQuantity / asset.quantity) * 100 
                    : 0;
                  
                  return (
                    <TableRow 
                      key={asset.id} 
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Column 1: Asset Basic Info */}
                      <TableCell className="py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">
                            {asset.assetName}
                          </span>
                          <span className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {asset.description || "No description provided"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 2: Context (Project/Donor) */}
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-2">
                          {asset.project?.name && (
                            <div className="flex items-start gap-1.5 text-xs text-slate-600">
                              <Briefcase className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                              <span className="line-clamp-1" title={asset.project.name}>
                                {asset.project.name}
                              </span>
                            </div>
                          )}
                          {asset.donor?.name && (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 text-[10px] px-2">
                                <HeartHandshake className="w-3 h-3 mr-1" />
                                {asset.donor.name}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Column 3: Value & Date */}
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            {formatCurrency(parseFloat(asset.purchaseValue))}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(asset.purchaseDate)}
                          </div>
                        </div>
                      </TableCell>

                      {/* Column 4: Stock & Location */}
                      <TableCell className="align-top">
                        <div className="space-y-3">
                          {/* Stock Bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Available</span>
                              <span className="font-medium text-slate-700">
                                {asset.VariableQuantity} / {asset.quantity}
                              </span>
                            </div>
                            <Progress value={stockPercent} className="h-1.5 bg-slate-100" />
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {asset.location || "Unassigned"}
                          </div>
                        </div>
                      </TableCell>

                      {/* Column 5: Actions */}
                      <TableCell className="text-right align-top">
                        <Link href={`/org-dashboard/assets/${asset.id}`}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}