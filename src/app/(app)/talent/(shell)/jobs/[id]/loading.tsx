export default function TalentJobDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <div className="mb-5 h-4 w-28 animate-pulse rounded-full bg-edge" />
      <section className="rounded-[28px] border border-edge bg-surface p-5 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="h-6 w-36 animate-pulse rounded-full bg-edge" />
            <div className="mt-5 h-12 w-4/5 animate-pulse rounded-xl bg-edge" />
            <div className="mt-3 h-5 w-2/3 animate-pulse rounded-full bg-edge" />
            <div className="mt-8 h-28 animate-pulse rounded-2xl bg-edge" />
          </div>
          <div className="h-52 animate-pulse rounded-2xl bg-edge" />
        </div>
      </section>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-edge bg-surface"
          />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-96 animate-pulse rounded-2xl border border-edge bg-surface" />
        <div className="h-80 animate-pulse rounded-2xl border border-edge bg-surface" />
      </div>
    </div>
  );
}
