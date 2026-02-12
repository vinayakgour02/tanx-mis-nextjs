'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppSidebar } from "./components/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { Header } from "./components/Header";
import { MISLoading } from "@/components/loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  if (status === 'loading') {
    return <MISLoading/>;
  }

  const role = (session?.user as any)?.role;
  const hasNgoRole = role && (
    role === 'ngo_admin' ||
    role === 'mel' ||
    role === 'program_department' ||
    role === 'project_manager_ngo' ||
    role === 'me_officer' ||
    role === 'field_agent'
  );

  if (!session ) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
} 