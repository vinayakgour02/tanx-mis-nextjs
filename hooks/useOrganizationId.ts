"use client";

import { useSession } from "next-auth/react";

export function useOrganizationId() {
  const { data: session, status } = useSession();

  const organizationId = session?.user?.organizationId ?? null;

  return {
    organizationId,
    loading: status === "loading",
    authenticated: status === "authenticated",
  };
}
