export default function Loading() {
  return (
    <div className="grid animate-pulse gap-6">
      <div className="border-border bg-card/95 rounded-[28px] border p-6 shadow-[0_18px_38px_rgba(31,24,24,0.06)] backdrop-blur">
        <div className="space-y-4">
          <div className="bg-muted h-4 w-24 rounded-full" />
          <div className="bg-muted h-10 w-2/3 rounded-2xl" />
          <div className="bg-muted h-4 w-full rounded-full" />
          <div className="bg-muted h-4 w-5/6 rounded-full" />
        </div>

        <div className="border-border mt-6 rounded-2xl border p-4">
          <div className="bg-muted h-4 w-1/2 rounded-full" />
          <div className="bg-muted mt-3 h-4 w-full rounded-full" />
          <div className="bg-muted mt-2 h-4 w-4/5 rounded-full" />
        </div>

        <div className="mt-8 space-y-5">
          <div className="border-border rounded-3xl border p-6">
            <div className="bg-muted h-5 w-1/3 rounded-full" />
            <div className="bg-muted mt-3 h-10 w-full rounded-2xl" />
            <div className="bg-muted mt-3 h-10 w-full rounded-2xl" />
            <div className="bg-muted mt-3 h-10 w-full rounded-2xl" />
          </div>
          <div className="border-border rounded-3xl border p-6">
            <div className="bg-muted h-5 w-1/4 rounded-full" />
            <div className="bg-muted mt-3 h-10 w-full rounded-2xl" />
            <div className="bg-muted mt-3 h-10 w-full rounded-2xl" />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <div className="bg-muted h-11 w-28 rounded-full" />
          <div className="bg-muted h-11 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
}
