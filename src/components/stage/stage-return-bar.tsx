import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { safeStageReturn } from "@/lib/stage-return";

/** Pasek powrotu, gdy ktoś wyszedł z podpunktu do Plików albo Social. */
export function StageReturnBar({ back }: { back?: string | null }) {
  const href = safeStageReturn(back);
  if (!href) return null;

  return (
    <Link
      href={href}
      className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[var(--vairo)]/40 bg-[var(--vairo)]/10 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[var(--vairo)]/16"
    >
      <ArrowLeft className="size-4 text-[var(--vairo)]" />
      Wróć do etapu i odhacz
    </Link>
  );
}
