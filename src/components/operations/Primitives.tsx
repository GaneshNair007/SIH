import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal">{eyebrow}</p>}
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
      {action && <Link className="btn-primary shrink-0" href={action.href}>{action.label}</Link>}
    </div>
  );
}

export function StatCard({ label, value, note, tone = "teal" }: { label: string; value: string | number; note: string; tone?: "teal" | "amber" | "red" | "neutral" }) {
  const toneClass = tone === "red" ? "text-red-700" : tone === "amber" ? "text-amber-700" : tone === "neutral" ? "text-charcoal" : "text-teal";
  return (
    <div className="card min-w-0">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-light">{note}</p>
    </div>
  );
}

export function StatusPill({ value }: { value: string | null | undefined }) {
  const normalized = value || "UNKNOWN";
  const danger = ["CRITICAL", "COMPROMISED", "INVALID", "EXPIRED", "OPEN"].includes(normalized);
  const warning = ["HIGH", "ELEVATED", "WARNING", "LOW", "ESCALATED"].includes(normalized);
  return <span className={`badge ${danger ? "badge-critical" : warning ? "badge-elevated" : normalized === "ACTIVE" || normalized === "HIGH" ? "badge-teal" : "badge-neutral"}`}>{normalized.replaceAll("_", " ")}</span>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-canvas px-6 py-12 text-center">
      <p className="font-medium text-charcoal">{title}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </div>
  );
}

export function RecordLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="font-medium text-charcoal underline decoration-border-strong underline-offset-4 hover:text-teal">{children}</Link>;
}

