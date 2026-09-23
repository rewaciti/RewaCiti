import { Skeleton } from "./Skeleton";

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
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 mb-3">
          <Skeleton className="h-8 rounded-2xl" />
          <Skeleton className="h-8 rounded-2xl" />
          <Skeleton className="h-7 rounded-xl col-span-2 xl:col-span-1" />
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
    <div className="bg-gray-300 dark:bg-black/30 min-h-screen">
      <div className="mx-auto">
        {/* Header Section — mirrors Name/Location pill + share/heart + price */}
        <div className="px-4 py-5 sm:flex sm:justify-between sm:items-center sm:gap-6 sm:py-6">
          {/* Title + location pill */}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-2/3 sm:w-1/2" />
            <Skeleton className="h-7 w-48 rounded-sm" />
          </div>

          {/* Share/heart + price */}
          <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 shrink-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-7 w-28 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div>
        {/* Gallery Section */}
        <section className="px-4 pb-10">
          <div className="p-2 border border-gray-600/30 rounded-xl">
            {/* Thumbnail Row — matches h-25 w-30 md:w-40 thumbs */}
            <div className="flex gap-2 overflow-x-auto mb-3 p-1 border border-gray-600/30 rounded-xl bg-black/20">
              {[...Array(5)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[100px] w-[120px] md:w-40 shrink-0 rounded-lg"
                />
              ))}
            </div>
            {/* Main Image Display — 2-up on sm+, like the live flex track */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Skeleton className="w-full h-[55vh] sm:h-[55vh] lg:h-[70vh] rounded-xl" />
              <Skeleton className="w-full h-[45vh] sm:h-[55vh] lg:h-[70vh] rounded-xl hidden sm:block" />
            </div>
            {/* Controls */}
            <div className="flex justify-center items-center mt-4 gap-4 bg-black/20 p-1 rounded-full w-fit mx-auto">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-2 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </section>

        {/* Property Video Tour placeholder */}
        <section className="px-4 pb-10">
          <div className="p-2 border border-gray-600/30 rounded-xl">
            <Skeleton className="h-7 w-48 mb-4" />
            <Skeleton className="w-full h-[40vh] md:h-[70vh] rounded-xl" />
          </div>
        </section>

        {/* Description & Features Section */}
        <section className="md:flex justify-between md:gap-1.5 px-4 mb-5 md:flex-row flex-col space-y-6 md:space-y-0">
          <div className="px-4 py-10 border border-gray-600/30 rounded-xl flex-1 h-fit dark:bg-[#1A1A1A] bg-white">
            <Skeleton className="h-7 w-32 mb-3" />
            <div className="space-y-2 mb-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            {/* Bedrooms / bathrooms / category row */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center gap-4 border-t border-gray-600/30 pt-2">
              <div className="space-y-1.5 px-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-1.5 px-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-1.5 px-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
          <div className="px-4 py-6 dark:bg-[#1A1A1A] bg-white border border-gray-600/30 rounded-xl flex-1 h-fit space-y-4">
            <Skeleton className="h-7 w-48 mb-1" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        </section>

        {/* Related Properties Section Skeleton */}
        <section className="p-4 mb-8">
          <div className="mb-8 space-y-3">
            <Skeleton className="h-8 w-12 rounded" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <div className="hidden xl:block">
              <PropertyCardSkeleton />
            </div>
          </div>
        </section>

        {/* Actions Bottom Bar Skeleton (mirrors price summary + 4 buttons) */}
        <div className="sticky bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-t border-gray-300/30 dark:border-gray-800/80 py-2 px-4 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
          <div className="max-w-6xl mx-auto">
            {/* Price / visitation summary */}
            <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-gray-300/30 dark:border-gray-800/60">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="space-y-1.5 flex flex-col items-end">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Skeleton className="h-12 rounded-xl w-full" />
              <Skeleton className="h-12 rounded-xl w-full" />
              <Skeleton className="h-12 rounded-xl w-full" />
              <Skeleton className="h-12 rounded-xl w-full" />
            </div>
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
