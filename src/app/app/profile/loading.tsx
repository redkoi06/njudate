export default function Loading() {
  return (
    <div className="grid animate-pulse gap-6">
      <div className="border-border bg-card/95 rounded-[28px] border p-6 shadow-[0_18px_38px_rgba(31,24,24,0.06)] backdrop-blur">
        <div className="space-y-4">
          <div className="bg-muted h-4 w-20 rounded-full" />
          <div className="bg-muted h-10 w-3/4 rounded-2xl" />
          <div className="bg-muted h-4 w-full rounded-full" />
          <div className="bg-muted h-4 w-5/6 rounded-full" />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <div className="bg-muted h-4 w-16 rounded-full" />
            <div className="bg-muted h-12 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <div className="bg-muted h-4 w-16 rounded-full" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted h-12 rounded-2xl" />
              <div className="bg-muted h-12 rounded-2xl" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-muted h-4 w-16 rounded-full" />
            <div className="bg-muted h-12 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <div className="bg-muted h-4 w-16 rounded-full" />
            <div className="bg-muted h-12 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <div className="bg-muted h-4 w-16 rounded-full" />
            <div className="bg-muted h-12 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <div className="bg-muted h-4 w-20 rounded-full" />
            <div className="bg-muted h-12 w-full rounded-2xl" />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="bg-muted h-11 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}
