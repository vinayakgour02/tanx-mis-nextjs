'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, Users, Wallet, FileText, Bell, 
  CheckCircle2, AlertCircle, Building2, TrendingUp, MapPin 
} from 'lucide-react';
import { format } from 'date-fns';

// UI Components (Assumed standard shadcn paths)
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types matching our API Response
interface DashboardData {
  vitals: {
    activeProjects: number;
    totalBeneficiaries: number;
    fundsUtilized: number;
    fundsPlanned: number;
    budgetUtilizationPercentage: number;
    reportsThisMonth: number;
  };
  health: {
    compliance: Array<{ label: string; status: 'active' | 'warning'; meta: string }>;
    subscription: { name: string; endDate: string; status: string } | null;
  };
  activityStream: Array<{
    id: string;
    title: string;
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT';
    date: string;
    location: string;
    submittedBy: string;
  }>;
  actionItems: {
    pendingReportApprovals: number;
  };
}

export default function OrganizationDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.backendToken) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard/org-admin`,
          {
            headers: { Authorization: `Bearer ${session.user.backendToken}` },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error(err);
        setError('Could not load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (session) fetchData();
  }, [session]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg border border-red-200">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview for {session?.user?.name || 'Organization Admin'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white border-slate-200 text-slate-600">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {data?.actionItems.pendingReportApprovals ? (
               <Badge className="ml-2 bg-orange-600 hover:bg-orange-700 h-5 px-1.5">
                 {data.actionItems.pendingReportApprovals}
               </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      {/* --- ZONE A: VITALS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Projects" 
          value={data?.vitals.activeProjects || 0} 
          icon={<Building2 className="h-4 w-4 text-orange-600" />} 
          subtext="Currently operational"
        />
        <StatCard 
          title="Total Beneficiaries" 
          value={data?.vitals.totalBeneficiaries.toLocaleString() || '0'} 
          icon={<Users className="h-4 w-4 text-orange-600" />} 
          subtext="Directly impacted"
        />
        <StatCard 
          title="Funds Utilized" 
          value={`₹${(data?.vitals.fundsUtilized || 0).toLocaleString()}`} 
          icon={<Wallet className="h-4 w-4 text-orange-600" />} 
          subtext={`${data?.vitals.budgetUtilizationPercentage}% of planned budget`}
        />
        <StatCard 
          title="Reports Submitted" 
          value={data?.vitals.reportsThisMonth || 0} 
          icon={<FileText className="h-4 w-4 text-orange-600" />} 
          subtext="This month"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        
        {/* --- ZONE B: FINANCIAL & COMPLIANCE (Left 4 cols) --- */}
        <Card className="md:col-span-4 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Organization Health</CardTitle>
            <CardDescription>Financial utilization and compliance status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Financial Pulse */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Budget Utilization</span>
                <span className="text-slate-500">
                  ₹{(data?.vitals.fundsUtilized || 0) / 1000000}M / ₹{(data?.vitals.fundsPlanned || 0) / 1000000}M
                </span>
              </div>
              {/* BRAND COLOR: Progress bar */}
              <Progress value={data?.vitals.budgetUtilizationPercentage} className="h-2 bg-slate-100" />
            </div>

            <Separator />

            {/* Compliance Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {data?.health.compliance.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  {item.status === 'active' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.meta}</p>
                  </div>
                </div>
              ))}
              
              {/* Subscription Status */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-orange-100 bg-orange-50/30">
                <Building2 className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Current Plan</p>
                  <p className="text-xs text-slate-500">
                    {data?.health.subscription?.name || 'Free Tier'} 
                    {data?.health.subscription?.endDate && ` (Exp: ${format(new Date(data.health.subscription.endDate), 'MMM yyyy')})`}
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* --- ZONE C: ACTIVITY STREAM (Right 3 cols) --- */}
        <Card className="md:col-span-3 border-slate-200 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest field reports and updates.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[350px]">
              <div className="divide-y divide-slate-100">
                {data?.activityStream.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{report.title}</p>
                      <StatusBadge status={report.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center text-xs text-slate-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {report.location}
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <Users className="w-3 h-3 mr-1" />
                        {report.submittedBy}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {format(new Date(report.date), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                ))}
                
                {data?.activityStream.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No recent activity found.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon, subtext }: { title: string, value: string | number, icon: React.ReactNode, subtext?: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className="bg-orange-50 p-2 rounded-full">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
    PENDING: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100", // BRAND ALIGNED
    REJECTED: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
  };
  
  return (
    <Badge variant="outline" className={`${styles[status] || styles.DRAFT} text-[10px] uppercase`}>
      {status}
    </Badge>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-7 h-96">
        <Skeleton className="md:col-span-4 rounded-xl" />
        <Skeleton className="md:col-span-3 rounded-xl" />
      </div>
    </div>
  );
}