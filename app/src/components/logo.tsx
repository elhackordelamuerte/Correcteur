import Link from "next/link";

// Logotype : serif italique et point de stylo rouge
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="font-display text-2xl font-medium italic tracking-tight">
      Copia<span className="text-pen">.</span>
    </Link>
  );
}
