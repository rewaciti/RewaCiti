import { Skeleton } from "./Skeleton";

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white/90 dark:bg-[#1A1A1A] border border-purple-100 dark:border-gray-600/30 rounded-xl p-2">
      <Skeleton className="w-full h-70 rounded-lg mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Skeleton className="h-8 rounded-2xl" />
        <Skeleton className="h-8 rounded-2xl" />
        <Skeleton className="h-8 rounded-2xl" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32 rounded-lg" />
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
        {/* Header Section */}
        <div className="md:flex gap-3 items-center px-4 py-6">
          <div className="flex flex-col flex-1">
            <Skeleton className="h-8 w-2/3 mb-2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <div className="md:flex justify-between md:items-center w-full mt-4 md:mt-0 gap-4">
            <Skeleton className="h-8 w-48 rounded-sm" />
            <div className="flex gap-4 items-center mt-4 md:mt-0">
              <div className="flex flex-col items-start">
                <Skeleton className="h-3 w-12 mb-1 hidden md:block" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <section className="px-4 pb-10">
          <div className="p-2 border border-gray-600/30 rounded-xl">
            {/* Thumbnail Row */}
            <div className="flex gap-2 overflow-x-auto mb-6 p-1 border border-gray-600/30 rounded-xl bg-black/20">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-30 w-30 md:flex-1 rounded-lg" />
              ))}
            </div>
            {/* Main Image Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Skeleton className="w-full h-[70vh] rounded-xl" />
              <Skeleton className="w-full h-[70vh] rounded-xl hidden md:block" />
            </div>
            {/* Controls */}
            <div className="flex justify-center items-center mt-4 gap-4 bg-black/20 p-1 rounded-full w-fit mx-auto">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-2 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </section>

        {/* Description & Features Section */}
        <section className="md:flex justify-between gap-6 px-4 mb-10 md:flex-row flex-col space-y-6 md:space-y-0">
          <div className="px-4 py-10 border border-gray-600/30 rounded-xl flex-1 h-fit dark:bg-[#1A1A1A] bg-white">
            <Skeleton className="h-8 w-1/4 mb-4" />
            <div className="space-y-2 mb-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="grid grid-cols-3 gap-6 border-t border-gray-600/30 pt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full border-l border-gray-600/30 pl-4" />
              <Skeleton className="h-12 w-full border-l border-gray-600/30 pl-4" />
            </div>
          </div>
          <div className="px-4 py-6 dark:bg-[#1A1A1A] bg-white border border-gray-600/30 rounded-xl flex-1 space-y-4">
            <Skeleton className="h-8 w-1/2 mb-4" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </section>

        {/* Inquiry Section */}
        <section className="md:flex justify-between px-4 pb-20 gap-6">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="p-6 dark:bg-[#1A1A1A] bg-white border border-gray-600/30 rounded-xl flex-2 space-y-6">
            <Skeleton className="h-8 w-1/3 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-12 w-40 rounded-lg" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
