'use client';

import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { ProgramFormDialog } from "./create-program-dialog";
import { Button } from "@/components/ui/button";

export function ProgramsHeaderActions() {
  const { can } = usePermissions();
  const [open, setOpen] = useState(false);

  if (!can("programs", "admin")) return null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Program</Button>
      <ProgramFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
