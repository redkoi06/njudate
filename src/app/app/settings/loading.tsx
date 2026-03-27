export default function Loading() {
  return (
    <div className="grid animate-pulse gap-6">
      <div className="border-border bg-card/95 rounded-[28px] border p-6 shadow-[0_18px_38px_rgba(31,24,24,0.06)] backdrop-blur">
        <div className="bg-muted h-4 w-16 rounded-full" />
        <div className="bg-muted mt-4 h-10 w-1/2 rounded-2xl" />
      </div>

      <div className="border-border bg-card/95 rounded-[28px] border p-6 shadow-[0_18px_38px_rgba(31,24,24,0.06)] backdrop-blur">
        <div className="bg-muted h-8 w-32 rounded-2xl" />
        <div className="bg-muted mt-4 h-4 w-2/3 rounded-full" />
        <div className="border-border mt-8 flex items-center justify-between rounded-2xl border px-4 py-4">
          <div className="bg-muted h-4 w-40 rounded-full" />
          <div className="bg-muted h-6 w-10 rounded-full" />
        </div>
        <div className="mt-6 flex justify-end">
          <div className="bg-muted h-11 w-28 rounded-full" />
        </div>
      </div>

      <div className="border-border bg-card/95 rounded-[28px] border p-6 shadow-[0_18px_38px_rgba(31,24,24,0.06)] backdrop-blur">
        <div className="bg-muted h-8 w-24 rounded-2xl" />
        <div className="bg-muted mt-4 h-4 w-2/3 rounded-full" />
        <div className="bg-muted mt-2 h-4 w-3/4 rounded-full" />
        <div className="border-border mt-6 rounded-2xl border p-5">
          <div className="bg-muted h-5 w-24 rounded-full" />
          <div className="bg-muted mt-3 h-4 w-1/2 rounded-full" />
          <div className="bg-muted mt-3 h-4 w-3/4 rounded-full" />
          <div className="mt-5 flex justify-end">
            <div className="bg-muted h-11 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
