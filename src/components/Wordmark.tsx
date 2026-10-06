import Link from "next/link";

export default function Wordmark({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-baseline gap-0.5 select-none" aria-label="کی نوبتمه؟">
      <span className={small ? "text-lg font-extrabold" : "text-2xl font-black"}>کی نوبتمه</span>
      <span className={`${small ? "text-lg" : "text-2xl"} font-black text-accent`}>؟</span>
    </Link>
  );
}
