import { Skeleton } from "./Skeleton";

const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white/90 dark:bg-[#1A1A1A] border border-purple-100 dark:border-gray-600/30 rounded-lg p-2 h-full flex flex-col justify-between">
      <div>
        {/* Image + floating share/shortlist buttons */}
        <div className="relative mb-3">
          <Skeleton className="w-full h-44 rounded-md" />
          <div className="absolute bottom-1 right-1 flex gap-1">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2 mb-3" />
        <div className="space-y-2 mb-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        {/* Bedrooms / bathrooms / category — mirrors card grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Skeleton className="h-8 rounded-2xl" />
          <Skeleton className="h-8 rounded-2xl" />
          <Skeleton className="h-7 rounded-xl col-span-2" />
        </div>
      </div>
      <div className="flex justify-between items-center mt-auto">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

export function CommentCardSkeleton() {
  return (
    <div className="rounded-xl p-5 bg-white/90 dark:bg-[#1A1A1A] border border-purple-100 dark:border-gray-600/30">
      <Skeleton className="h-6 w-24 mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

export function FAQCardSkeleton() {
  return (
    <div className="bg-white/90 dark:bg-[#1A1A1A] border border-purple-100 dark:border-gray-600/30 rounded-xl p-5">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md mt-4" />
    </div>
  );
}

export function PropertyDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-300 dark:bg-black/30">
      <div className="bg-gray-200 dark:bg-black/50">
        <div className={`${PAGE_CONTAINER} pt-4`}>
          <Skeleton className="h-4 w-28" />
          <div className="pb-5 pt-3 sm:pt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-9 w-3/4 sm:h-10 sm:w-1/2" />
            <Skeleton className="mt-3 h-4 w-2/3 sm:w-1/3" />
          </div>
        </div>
        <section className={`${PAGE_CONTAINER} pb-8`}>
          <div className="overflow-hidden rounded-3xl sm:rounded-[28px]">
            <Skeleton className="aspect-4/3 w-full rounded-none sm:hidden" />
            <div className="hidden h-[360px] grid-cols-4 grid-rows-2 gap-2 sm:grid lg:h-[440px]">
              <Skeleton className="col-span-2 row-span-2 rounded-none" />
              <Skeleton className="rounded-none" />
              <Skeleton className="rounded-none" />
              <Skeleton className="rounded-none" />
              <Skeleton className="rounded-none" />
            </div>
          </div>
        </section>
      </div>

      <section
        className={`${PAGE_CONTAINER} grid grid-cols-1 gap-x-16 pb-28 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-10 xl:gap-x-24`}
      >
        <div className="min-w-0">
          <div className="border-b border-gray-600/50 py-8">
            <Skeleton className="h-7 w-2/3 sm:w-1/2" />
            <div className="mt-3 flex gap-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          <div>
            <div className="border-b border-gray-600/50 py-8">
              <Skeleton className="mb-4 h-7 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="mt-3 h-4 w-24" />
            </div>
            <div className="border-b border-gray-600/50 py-8">
              <Skeleton className="mb-5 h-7 w-32" />
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
              <Skeleton className="mt-6 h-12 w-44 rounded-lg" />
            </div>
            <div className="border-b border-gray-600/50 py-8">
              <Skeleton className="mb-4 h-7 w-52" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="mt-5 h-10 w-36 rounded-lg" />
            </div>
            <div className="border-b border-gray-600/50 py-8">
              <Skeleton className="mb-6 h-7 w-40" />
              <div className="border-t border-gray-200 py-7 first:border-t-0 first:pt-0 dark:border-white/10">
                <Skeleton className="mb-4 h-6 w-32" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
                <Skeleton className="mt-5 h-10 w-32 rounded-lg" />
              </div>
              <div className="border-t border-gray-200 py-7 dark:border-white/10">
                <Skeleton className="mb-4 h-6 w-36" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
                <Skeleton className="mt-5 h-10 w-40 rounded-lg" />
              </div>
            </div>
            <div className="border-b border-gray-600/50 py-8">
              <Skeleton className="mb-5 h-7 w-44" />
              <div className="space-y-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
            <div className="border-b border-gray-600/50 py-8">
              <Skeleton className="mb-2 h-7 w-36" />
              <Skeleton className="mb-5 h-4 w-2/3" />
              <Skeleton className="h-[280px] w-full rounded-xl sm:h-[400px]" />
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 pt-8">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)] dark:border-gray-600/30 dark:bg-[#1A1A1A]">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="mt-5 h-12 w-full rounded-lg" />
              <Skeleton className="mt-3 h-12 w-full rounded-lg" />
              <Skeleton className="mx-auto mt-4 h-4 w-32" />
            </div>
          </div>
        </aside>
      </section>

      <section className="bg-gray-200 dark:bg-black/50">
        <div className={`${PAGE_CONTAINER} border-t border-gray-600/50 py-10 dark:border-gray-600/50`}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="w-full space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="hidden h-10 w-24 shrink-0 rounded-lg md:block" />
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white dark:border-gray-600/30 dark:bg-[#1A1A1A] lg:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="space-y-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-11 w-11 rounded-lg" />
            <Skeleton className="h-11 min-w-0 flex-1 rounded-lg sm:w-32 sm:flex-none" />
            <Skeleton className="h-11 min-w-0 flex-1 rounded-lg sm:w-24 sm:flex-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileDropdownSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <Skeleton className="h-8 w-full rounded-lg" />

      {/* Form Fields Skeleton */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>

        <div className="space-y-1">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-8 w-full" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 items-start animate-pulse">
      {/* Left column */}
      <div className="space-y-4">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col items-center text-center">
          <Skeleton className="w-16 h-16 rounded-full mb-3" />
          <Skeleton className="h-4 w-32 mb-1" />
        </div>

        {/* Basic Info Card */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
          <Skeleton className="h-3 w-16 mb-2" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-4">
        {/* Personal Information Card */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800/60 pb-2 last:border-0"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800/60 pb-2 last:border-0"
              >
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
