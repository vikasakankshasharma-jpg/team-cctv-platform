export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <div className="h-10 w-48 animate-pulse rounded-full bg-gray-200"></div>
        <div className="h-4 w-64 animate-pulse rounded-full bg-gray-200"></div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex h-48 flex-col justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200"></div>
              <div className="flex flex-col gap-2">
                <div className="h-5 w-32 animate-pulse rounded-full bg-gray-200"></div>
                <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200"></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-4 w-full animate-pulse rounded-full bg-gray-200"></div>
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
