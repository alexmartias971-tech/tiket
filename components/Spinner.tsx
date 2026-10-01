export function Spinner({ label = "Chargement" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-ink-soft">
      <span className="h-5 w-5 rounded-full border-2 border-lagoon border-t-transparent animate-spin" />
      <span>{label}…</span>
    </div>
  );
}
