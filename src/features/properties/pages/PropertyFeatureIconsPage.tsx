import { Helmet } from "react-helmet-async";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import {
  Ban,
  propertyFeatureIconGroups,
  type PropertyFeatureIconItem,
} from "../components/propertyFeatureIcons";

function FeatureIconCard({ item }: { item: PropertyFeatureIconItem }) {
  const Icon = item.icon;

  return (
    <div className="flex min-h-24 items-center gap-4 rounded-xl border border-gray-600/20 bg-white p-4 dark:bg-[#1A1A1A]">
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#703BF7]/10 text-[#703BF7] dark:bg-[#703BF7]/20">
        <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
        {item.prohibited && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 text-white dark:border-[#1A1A1A]">
            <Ban aria-hidden="true" size={12} strokeWidth={2} />
          </span>
        )}
      </span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
        {item.label}
      </span>
    </div>
  );
}

export default function PropertyFeatureIconsPage() {
  return (
    <>
      <Helmet>
        <title>Property Features & Amenities Icon Reference | RewaCiti</title>
        <meta
          name="description"
          content="Browse the icon reference for property amenities, house rules, bills, and fees."
        />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-[#121212] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#703BF7]">
              Design reference
            </p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Property features & amenities
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              A reusable collection of thin-line icons for property amenities,
              house rules, and bills. Red ban badges mark prohibited or
              restricted rules.
            </p>
          </header>

          <div className="space-y-12">
            {propertyFeatureIconGroups.map((group) => {
              const headingId = group.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-");

              return (
              <section key={group.title} aria-labelledby={headingId}>
                <div className="mb-5">
                  <h2
                    id={headingId}
                    className="text-2xl font-semibold text-gray-900 dark:text-white"
                  >
                    {group.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {group.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((item) => (
                    <FeatureIconCard key={item.label} item={item} />
                  ))}
                </div>
              </section>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
