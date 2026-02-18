"use client"

import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Settings, LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // * Make sure you have this component
import Image from "next/image"

export function Header() {
  const { data: session } = useSession()
  const user = session?.user as any
  const router = useRouter()

  // Helper to get initials if no image is present
  const getInitials = (name: string) => {
    return name
      ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
      : "U"
  }


  const formatRole = (role?: string) => {
    if (!role) return ""

    return role
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }


  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumb / Brand Area */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-lg">
                <Image
                  src="/sia.png"
                  alt="SIA Logo"
                  width={250}
                  height={250}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                SIA MIS DASHBOARD
              </span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Spacer */}
      <div className="ml-auto" />

      {/* Profile Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Replaced simple icon with an interactive Avatar button */}
          <button className="flex items-center gap-2 outline-none rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatRole(user?.role)}
              </p>

            </div>

            <Avatar className="h-9 w-9 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/org-dashboard/profile")} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/org-dashboard/settings")} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="text-red-600 focus:text-red-600 cursor-pointer bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}