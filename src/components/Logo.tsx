import Link from "next/link";
import { appName } from "@/lib/brand";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white transition-transform duration-500 group-hover:rotate-[135deg]">
        <span className="h-2.5 w-2.5 rounded-sm bg-black" />
      </span>
      <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white">
        {appName}
      </span>
    </Link>
  );
}
