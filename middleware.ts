import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname
    const isOrgDashboard = pathname.startsWith("/org-dashboard")

    // ❌ No token → not authenticated
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // ✅ Existing role check block (UNCHANGED)
    if (isOrgDashboard) {
      const hasNgoRole =
        token.role &&
        (
          token.role === "ngo_admin" ||
          token.role === "mel" ||
          token.role === "program_department" ||
          token.role === "project_manager_ngo" ||
          token.role === "me_officer" ||
          token.role === "field_agent"
        )

      // if (!hasNgoRole) {
      //   return NextResponse.redirect(new URL("/unauthorized", req.url))
      // }
    }

    // ======================================================
    // 🔐 ADDITIONAL MODULE ACCESS CHECKS (NEW)
    // ======================================================

    const orgId = token.organizationId
    // if (!orgId) {
    //   return NextResponse.redirect(new URL("/unauthorized", req.url))
    // }

    // Only check when hitting protected module pages
    const needsPeopleBank =
      pathname.startsWith("/org-dashboard/youth-bank")

    const needsAssetManagement =
      pathname.startsWith("/org-dashboard/assets")

    // if (needsPeopleBank || needsAssetManagement) {
    //   try {
    //     const res = await fetch(
    //       `https://mis.tanxinnovations.com"/api/org/hasAccesstoPeopleBank/${orgId}`,
    //       {
    //         headers: {
    //           cookie: req.headers.get("cookie") || "",
    //         },
    //       }
    //     )

    //     if (!res.ok) {
    //       return NextResponse.redirect(new URL("/unauthorized", req.url))
    //     }

    //     const org = await res.json()

    //     // 🚫 Youth Bank page protection
    //     if (needsPeopleBank && !org?.hasAccesstoPeopleBank) {
    //       return NextResponse.redirect(new URL("/unauthorized", req.url))
    //     }

    //     // 🚫 Asset Management page protection
    //     // if (needsAssetManagement && !org?.hasAccessToAssetManagement) {
    //     //   return NextResponse.redirect(new URL("/unauthorized", req.url))
    //     // }
    //   } catch (error) {
    //     console.error("Middleware module access error:", error)
    //     return NextResponse.redirect(new URL("/unauthorized", req.url))
    //   }
    // }

    // ✅ Allow request to continue
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/org-dashboard/:path*",
  ],
}
