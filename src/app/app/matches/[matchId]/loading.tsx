export default function Loading() {
  return (
    <div className="grid animate-pulse gap-6">
      <div className="border-border bg-card/95 rounded-[28px] border p-6 shadow-[0_18px_38px_rgba(31,24,24,0.06)] backdrop-blur">
        <div className="space-y-4">
          <div className="bg-muted h-4 w-24 rounded-full" />
          <div className="bg-muted h-10 w-1/2 rounded-2xl" />
        </div>
      </div>

      <div className="border-border bg-card/95 rounded-[28px] border p-6 shadow-[0_18px_38px_rgba(31,24,24,0.06)] backdrop-blur">
        <div className="bg-muted h-8 w-28 rounded-2xl" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="border-border rounded-2xl border p-4">
            <div className="bg-muted h-4 w-12 rounded-full" />
            <div className="bg-muted mt-3 h-6 w-4/5 rounded-2xl" />
          </div>
          <div className="border-border rounded-2xl border p-4">
            <div className="bg-muted h-4 w-12 rounded-full" />
            <div className="bg-muted mt-3 h-6 w-4/5 rounded-2xl" />
          </div>
          <div className="border-border rounded-2xl border p-4">
            <div className="bg-muted h-4 w-12 rounded-full" />
            <div className="bg-muted mt-3 h-6 w-4/5 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="border-border bg-card/95 rounded-[28px] border p-6 shadow-[0_18px_38px_rgba(31,24,24,0.06)] backdrop-blur">
        <div className="bg-muted h-8 w-24 rounded-2xl" />
        <div className="border-border mt-5 rounded-2xl border p-4">
          <div className="bg-muted h-4 w-1/3 rounded-full" />
          <div className="bg-muted mt-3 h-4 w-1/2 rounded-full" />
        </div>
        <div className="bg-muted mt-6 h-11 w-44 rounded-full" />
      </div>
    </div>
  );
}
