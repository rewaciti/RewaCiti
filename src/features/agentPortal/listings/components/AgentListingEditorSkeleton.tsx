import { ArrowRight, ImagePlus, Info, X } from "lucide-react";
import { EDITOR_TABS } from "@/features/agentPortal/common/utils/agentListingUtils";

const SkeletonBar = ({ className = "" }: { className?: string }) => (
  <span className={`block animate-pulse rounded-[5px] bg-[#f3f4f6] dark:bg-[#232323] ${className}`} aria-hidden="true" />
);

const detailCardClass = "rounded-[9px] border border-[#e5e7eb] bg-white p-[17px] dark:border-white/10 dark:bg-[#1a1a1a]";
const sideCardClass = "rounded-[9px] border border-[#e5e7eb] bg-white p-[17px] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:p-[13px]";
const sideHeadingClass = "[&>div>h3]:m-0 [&>div>h3]:text-[13px] [&>div>h3]:font-bold [&>div>h3]:text-[#111827] dark:[&>div>h3]:text-white [&>div>p]:mt-1 [&>div>p]:text-[10px] [&>div>p]:text-[#4b5563] dark:[&>div>p]:text-[#9ca3af] [&>h3]:m-0 [&>h3]:text-[13px] [&>h3]:font-bold [&>h3]:text-[#111827] dark:[&>h3]:text-white [&>strong]:text-xs [&>strong]:text-[#111827] dark:[&>strong]:text-white";

const AgentListingEditorSkeleton = ({ title }: { title?: string }) => (
  <div className="fixed inset-0 z-50 bg-[#d1d5db] font-sans text-[#111827] dark:bg-[#121212] dark:text-white" role="status" aria-live="polite" aria-label="Loading listing editor">
    <section className="flex h-full w-full flex-col overflow-hidden bg-[#d1d5db] text-[#111827] dark:bg-[#121212] dark:text-white">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-[13px] border-b border-[#e5e7eb] bg-white px-5 dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:px-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <h2 className="m-0 truncate text-lg font-bold text-[#111827] dark:text-white max-[700px]:text-base">{title ?? "New Property"}</h2>
          <SkeletonBar className="h-[24px] w-16 shrink-0 rounded-full" />
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center text-[#4b5563] opacity-60 dark:text-[#9ca3af]" aria-hidden="true">
          <X size={19} />
        </span>
      </header>

      <nav className="flex min-h-[41px] shrink-0 items-stretch justify-start gap-2 overflow-x-auto border-b border-[#e5e7eb] bg-white px-5 [scrollbar-width:none] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:gap-1 max-[700px]:px-3 [&::-webkit-scrollbar]:hidden" aria-hidden="true">
        {EDITOR_TABS.map(({ value, label, icon: Icon }, index) => (
          <span
            key={value}
            className={`relative flex min-h-10 min-w-max items-center gap-2 border px-[15px] text-sm max-[700px]:gap-1.5 max-[700px]:px-[9px] max-[700px]:text-[11px] ${index === 0 ? "border-[#e5e7eb] bg-white font-bold text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white" : "border-transparent bg-transparent text-[#4b5563] dark:text-[#9ca3af]"}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </span>
        ))}
      </nav>

      <div className="hidden shrink-0 border-b border-[#e5e7eb] bg-white px-3.5 py-2 dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:block" aria-hidden="true">
        <div className="flex items-center gap-2.5">
          <SkeletonBar className="h-3 w-16" />
          <SkeletonBar className="h-1.5 flex-1 rounded-full" />
          <SkeletonBar className="h-3 w-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-6 pb-8 max-[700px]:pt-3.5 max-[700px]:pb-5" aria-hidden="true">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_300px] items-start gap-[22px] px-4 sm:px-6 lg:px-10 max-[900px]:grid-cols-[minmax(0,1fr)_260px] max-[900px]:gap-3.5 max-[700px]:grid-cols-1">
          <div className="grid min-w-0 gap-3.5 p-0">
            <div className={detailCardClass}>
              <div className="mb-[7px] block text-xs font-semibold text-[#111827] dark:text-white">Listed for</div>
              <div className="mb-5 grid grid-cols-5 gap-2.5 max-[1000px]:grid-cols-3 max-[700px]:grid-cols-2 max-[700px]:gap-[7px]">
                {[0, 1, 2, 3, 4].map((item) => <SkeletonBar key={item} className="h-12 w-full" />)}
              </div>
              <SkeletonBar className="mb-2 h-3 w-20" />
              <SkeletonBar className="mb-4 h-11 w-full" />
              <SkeletonBar className="mb-2 h-3 w-28" />
              <SkeletonBar className="h-11 w-full" />
            </div>
            <div className={detailCardClass}>
              <div className="mb-[13px] flex items-center gap-[9px] text-[#703bf7] dark:text-[#b79bff]"><Info size={17} /><SkeletonBar className="h-3.5 w-24 bg-[#703bf7]/15 dark:bg-[#b79bff]/20" /></div>
              <SkeletonBar className="mb-2 h-3 w-24" />
              <SkeletonBar className="h-24 w-full" />
            </div>
          </div>

          <aside className="grid gap-[13px] max-[700px]:hidden">
            <div className={`${sideCardClass} ${sideHeadingClass}`}>
              <div className="flex items-start justify-between gap-2.5"><div><h3>Completeness</h3><p>Loading details…</p></div><SkeletonBar className="h-4 w-9" /></div>
              <SkeletonBar className="my-[15px] mb-[13px] h-[5px] w-full rounded-full" />
              <div className="grid gap-[11px]">
                {[0, 1, 2, 3].map((item) => <SkeletonBar key={item} className="h-3 w-full" />)}
              </div>
            </div>
            <div className={`${sideCardClass} ${sideHeadingClass}`}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 animate-pulse place-items-center rounded-[6px] bg-[#f3f4f6] text-[#703bf7] dark:bg-[#232323] dark:text-[#b79bff]" aria-hidden="true">
                  <ImagePlus size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3>Property photos</h3>
                  <SkeletonBar className="mt-1.5 h-3 w-20" />
                </div>
                <SkeletonBar className="h-7 w-14 rounded-[6px]" />
              </div>
            </div>
            <div className="flex items-start gap-[9px] rounded-md border border-[#703bf7]/10 bg-[#703bf7]/10 p-3 text-[#703bf7] dark:border-white/10 dark:bg-[#232323] dark:text-[#b79bff]">
              <Info className="shrink-0" size={17} />
              <SkeletonBar className="h-2.5 flex-1 bg-[#703bf7]/20 dark:bg-[#b79bff]/25" />
            </div>
          </aside>
        </div>
      </div>

      <footer className="flex min-h-[72px] shrink-0 items-center justify-between gap-3.5 border-t border-[#e5e7eb] bg-white px-[clamp(18px,4vw,58px)] py-[11px] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:min-h-16 max-[700px]:gap-[7px] max-[700px]:px-3 max-[700px]:py-2 max-[700px]:pb-[max(8px,env(safe-area-inset-bottom))]" aria-hidden="true">
        <span className="inline-flex min-h-10 items-center pr-[15px] text-[11px] font-semibold text-[#4b5563] opacity-60 dark:text-[#9ca3af] max-[700px]:pr-2">Cancel</span>
        <div className="flex items-center gap-[9px] max-[700px]:gap-1.5">
          <span className="inline-flex min-h-10 items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white px-[15px] text-[11px] font-semibold text-[#111827] opacity-60 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white max-[700px]:min-h-[37px] max-[700px]:px-[9px] max-[700px]:text-[10px]">Save as Draft</span>
          <span className="inline-flex min-h-10 items-center justify-center gap-[7px] rounded-[6px] border border-[#703bf7] bg-[#703bf7] px-[15px] text-[11px] font-semibold text-white opacity-60 max-[700px]:min-h-[37px] max-[700px]:px-[9px] max-[700px]:text-[10px]">Send for Approval <ArrowRight size={16} /></span>
        </div>
      </footer>
    </section>
  </div>
);

export default AgentListingEditorSkeleton;
