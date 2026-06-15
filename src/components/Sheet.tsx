"use client";

import { ReactNode, useEffect } from "react";

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-line bg-background pb-[max(1.5rem,env(safe-area-inset-bottom))] pop no-scrollbar">
        <div className="sticky top-0 z-10 flex justify-center bg-background pt-3 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-line" />
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
