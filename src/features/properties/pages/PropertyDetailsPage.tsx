import Navbar from "../../../shared/components/Layout/Navbar";
import { useParams, Link } from "react-router";
import { Helmet } from "react-helmet-async";
import {
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiShare2,
  FiArrowLeft,
  FiArrowRight,
  FiX,
  FiMail,
  FiCalendar,
  FiCreditCard,
  FiFlag,
} from "react-icons/fi";
import * as Dialog from "@radix-ui/react-dialog";
import { usePropertyStore } from "../store/usePropertyStore";
import { useState, useEffect, useCallback } from "react";
import { FaBed, FaBath, FaHome, FaBolt } from "react-icons/fa";
import Footer from "../../../shared/components/Layout/Footer";
import BookInspectionModal from "../../inspections/components/BookInspectionModal";
import PropertyPaymentModal from "../components/PropertyPaymentModal";
import ServiceRatingModal from "../components/ServiceRatingModal";
import ReportAgentModal from "../components/ReportAgentModal";
import InquiryModal from "../components/InquiryModal";
import PropertyCard from "../components/PropertyCard";
import {
  PropertyDetailsSkeleton,
  PropertyCardSkeleton,
} from "../../../shared/components/ui/Skeletons";
import { toast } from "sonner";
import { formatCurrency } from "../../../shared/lib/utils";

import { useAuthStore } from "../../auth/store/useAuthStore";

function PropertyDetails() {
  const { slug } = useParams<{ slug: string }>();
  const {
    properties,
    fetchProperties,
    loading,
    toggleShortlist,
    shortlistedProperties,
    relatedProperties,
    relatedPropertiesLoading,
    totalRelatedProperties,
    fetchRelatedProperties,
    fetchCategories,
  } = usePropertyStore();
  const property = properties.find((p) => p.slug === slug);

  const isShortlisted = property
    ? shortlistedProperties.some((p) => p.id === property.id)
    : false;

  const handleShortlist = async () => {
    if (!property) return;

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      toast.error("Please log in to access your wishlist.");
      return;
    }

    toast.success(
      isShortlisted ? "Removed from shortlist" : "Added to shortlist",
    );
    void toggleShortlist(property);
  };

  const handleShare = async () => {
    if (!property) return;
    const description = property.description;
    const url = window.location.href;
    const address = `${property.location.area}, ${property.location.city_town}, ${property.location.state} state.`;
    const coverImageUrl = property.img || property.images?.[0] || "";
    const shareText = `${description}\n\nName: ${property.name}\nAddress: ${address}\nCategory: ${property.category}\nImage: ${coverImageUrl}\nURL: ${url}`;

    if (navigator.share) {
      try {
        const shareData = {
          title: property.name,
          text: shareText,
          url,
        };

        if (coverImageUrl && typeof File !== "undefined") {
          try {
            const response = await fetch(coverImageUrl);
            const blob = await response.blob();

            if (blob.size) {
              const shareFile = new File(
                [blob],
                `${property.slug || property.name}.jpg`,
                {
                  type: blob.type || "image/jpeg",
                },
              );

              await navigator.share({
                ...shareData,
                files: [shareFile],
              });
              return;
            }
          } catch (imageError) {
            console.error("Error preparing share image:", imageError);
          }
        }

        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const price = property?.pricing.TotalCost ?? 0;
  const images = property?.images ?? [];

  const hasBedrooms = !!property && property.bedrooms !== 0;
  const hasBathrooms =
    !!property &&
    !!property.bathrooms &&
    property.bathrooms !== 0 &&
    property.bathrooms !== "0";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState(window.innerWidth < 768 ? 1 : 2);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    setLightboxIndex(0);
    setIsLightboxOpen(false);
  }, [slug, property?.id]);

  const nextImages = useCallback(() => {
    if (currentIndex + step < images.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, images.length, step]);

  const prevImages = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const nextLightboxImage = useCallback(() => {
    if (lightboxIndex < images.length - 1) {
      setLightboxIndex((prev) => prev + 1);
    }
  }, [lightboxIndex, images.length]);

  const prevLightboxImage = useCallback(() => {
    if (lightboxIndex > 0) {
      setLightboxIndex((prev) => prev - 1);
    }
  }, [lightboxIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === "ArrowRight") {
          nextLightboxImage();
        } else if (e.key === "ArrowLeft") {
          prevLightboxImage();
        } else if (e.key === "Escape") {
          setIsLightboxOpen(false);
        }
      } else {
        if (e.key === "ArrowRight") {
          nextImages();
        } else if (e.key === "ArrowLeft") {
          prevImages();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    nextImages,
    prevImages,
    nextLightboxImage,
    prevLightboxImage,
    isLightboxOpen,
  ]);

  // Swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      if (isLightboxOpen) {
        nextLightboxImage();
      } else {
        nextImages();
      }
    } else if (isRightSwipe) {
      if (isLightboxOpen) {
        prevLightboxImage();
      } else {
        prevImages();
      }
    }
  };

  useEffect(() => {
    if (properties.length === 0) {
      fetchProperties();
    }
  }, [properties.length, fetchProperties]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [paymentUserData, setPaymentUserData] = useState<
    { name: string; email: string; phone: string } | undefined
  >(undefined);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  useEffect(() => {
    if (isInspectionModalOpen || isPaymentModalOpen || isInquiryModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isInspectionModalOpen, isPaymentModalOpen, isInquiryModalOpen]);

  const [relatedPage, setRelatedPage] = useState(1);
  const [showAllRelated, setShowAllRelated] = useState(false);
  const [sameAgentOnly, setSameAgentOnly] = useState(false);
  const RELATED_ITEMS_PER_PAGE = 4;

  const totalRelatedPages = Math.ceil(
    totalRelatedProperties / RELATED_ITEMS_PER_PAGE,
  );

  const currentRelatedProperties = relatedProperties;

  const handleRelatedNext = () => {
    if (relatedPage < totalRelatedPages) {
      setRelatedPage((prev) => prev + 1);
    }
  };

  const handleRelatedPrev = () => {
    if (relatedPage > 1) {
      setRelatedPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (property) {
      const limit = showAllRelated ? 100 : RELATED_ITEMS_PER_PAGE;
      const page = showAllRelated ? 1 : relatedPage;
      fetchRelatedProperties(property, sameAgentOnly, page, limit);
    }
  }, [
    property,
    sameAgentOnly,
    relatedPage,
    showAllRelated,
    fetchRelatedProperties,
  ]);

  useEffect(() => {
    const handleResize = () => {
      setStep(window.innerWidth > 640 ? 2 : 1);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setRelatedPage(1);
    setShowAllRelated(false);
  }, [sameAgentOnly, property?.id]);

  return (
    <div className="bg-gray-300 dark:bg-black/30">
      <Helmet>
        <title>
          {property
            ? `${property.name} | RewaCiti`
            : "Property Details | RewaCiti"}
        </title>
        <meta
          name="description"
          content={
            property
              ? `Explore ${property.name} with details on location, pricing, amenities, and contact support from RewaCiti.`
              : "View property details on RewaCiti."
          }
        />
        <meta
          property="og:title"
          content={
            property
              ? `${property.name} | RewaCiti`
              : "Property Details | RewaCiti"
          }
        />
        <meta
          property="og:description"
          content={
            property
              ? `Discover ${property.name} in ${property.location.area}, ${property.location.city_town}, ${property.location.state}.`
              : "View property details on RewaCiti."
          }
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      <Navbar />

      {loading && properties.length === 0 ? (
        <PropertyDetailsSkeleton />
      ) : !property ? (
        <div className="dark:bg-black/30 bg-gray min-h-[70vh] flex items-center justify-center">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold dark:text-white text-gray-800">
              Property Not Found
            </h1>
            <p className="dark:text-gray-400 text-gray-600 ">
              The property you're looking for is no more more available or there
              is a poor internet connection, please explore other properties ar
              check your internet connection.
            </p>
            <Link to="/Properties">
              <button className="bg-[#703BF7] hover:bg-[#9677df] text-white px-4 py-2 rounded text-sm cursor-pointer">
                Browse Properties
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-auto">
            {/* Name, Location & Price Section */}
            <div className="px-4 py-5 sm:flex sm:justify-between sm:items-center sm:gap-6 sm:py-6">
              {/* Name & Location */}
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                  <span className="wrap-break-words">{property?.name}</span>{" "}
                  <a
                    href={
                      property?.geo_location?.lat !== 0 &&
                      property?.geo_location?.lat !== null &&
                      property?.geo_location?.lng !== 0 &&
                      property?.geo_location?.lng !== null
                        ? `https://www.google.com/maps/search/?api=1&query=${property.geo_location.lat},${property.geo_location.lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            property
                              ? [
                                  property.location.area,
                                  property.location.city_town ||
                                    property.location.city,
                                  property.location.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ") +
                                  (property.location.state ? " state." : "")
                              : "",
                          )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-normal border dark:text-gray-400 text-gray-900 border-gray-600/30 rounded-sm px-2 py-1 inline-flex items-center gap-2 hover:text-[#703BF7] hover:border-[#703BF7] transition-colors align-middle"
                  >
                    <FiMapPin className="shrink-0" />

                    <span>
                      {property &&
                        [
                          property.location.area,
                          property.location.city_town || property.location.city,
                          property.location.state,
                        ]
                          .filter(Boolean)
                          .join(", ") +
                          (property.location.state ? " state." : "")}
                    </span>
                  </a>
                </div>
              </div>

              {/* Price + Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-4 mt-5 sm:mt-0 shrink-0">
                {/* Action Icons */}
                <div className="flex items-center gap-2">
                  {/* Share */}
                  <button
                    onClick={handleShare}
                    aria-label="Share property"
                    className="bg-white dark:bg-[#1A1A1A] border border-gray-600/30 hover:border-[#703BF7] hover:text-[#703BF7] text-gray-900 dark:text-white w-9 h-9 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <FiShare2 className="text-lg transition-all" />
                  </button>

                  {/* Love */}
                  <button
                    onClick={handleShortlist}
                    aria-label={
                      isShortlisted
                        ? "Remove from shortlist"
                        : "Shortlist property"
                    }
                    className="bg-white dark:bg-[#1A1A1A] border border-gray-600/30 hover:border-[#703BF7] hover:text-[#703BF7] text-gray-900 dark:text-white w-9 h-9 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <FiHeart
                      className={`text-lg transition-all ${
                        isShortlisted ? "fill-current text-[#703BF7]" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Price */}
                <div className="flex flex-col items-end">
                  <p className="text-xs text-gray-800 dark:text-gray-400">
                    Price ({property?.duration})
                  </p>

                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    ₦{formatCurrency(price)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <BookInspectionModal
            property={property}
            open={isInspectionModalOpen}
            onOpenChange={setIsInspectionModalOpen}
          />

          <PropertyPaymentModal
            property={property}
            open={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
            onPaymentSuccess={(userData) => {
              setPaymentUserData(userData);
              setIsRatingModalOpen(true);
            }}
          />

          <ServiceRatingModal
            property={property}
            open={isRatingModalOpen}
            onOpenChange={setIsRatingModalOpen}
            userData={paymentUserData}
          />

          <ReportAgentModal
            property={property}
            open={isReportModalOpen}
            onOpenChange={setIsReportModalOpen}
          />

          <InquiryModal
            property={property}
            open={isInquiryModalOpen}
            onOpenChange={setIsInquiryModalOpen}
          />

          <section className="px-4 pb-10 ">
            <div className="p-2 border border-gray-600/30 rounded-xl">
              {/* Thumbnail Row */}
              <div className="flex gap-2 overflow-x-auto mb-6 p-1 border border-gray-600/30 rounded-xl bg-black/20 no-scrollbar">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-30 w-30 md:w-full dark:bg-[#1A1A1A] bg-white object-cover rounded-lg cursor-pointer border ${
                      index === currentIndex
                        ? "border-[#703BF7]"
                        : "border-gray-600/30"
                    }`}
                  />
                ))}
              </div>

              {/* Main Image Display */}
              <div
                className="relative overflow-hidden rounded-xl"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${currentIndex * (100 / step)}%)`,
                  }}
                >
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="w-full sm:w-1/2 shrink-0 px-1 relative cursor-pointer"
                      onClick={() => {
                        setLightboxIndex(index);
                        setIsLightboxOpen(true);
                      }}
                    >
                      <img
                        src={img}
                        className={`w-full dark:bg-[#1A1A1A] bg-white md:object-cover rounded-xl ${step === 1 ? "h-[55vh] sm:h-[65vh] lg:h-[70vh]" : "h-[45vh] sm:h-[55vh] lg:h-[70vh]"}`}
                        alt={`Property image ${index + 1}`}
                      />

                      <div className="absolute left-5 bottom-4 bg-black/60 dark:bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium select-none">
                        Click to view real size image
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center items-center mt-4 gap-4 bg-black/20 p-1 rounded-full w-fit mx-auto">
                <button
                  onClick={prevImages}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-full border border-gray-600 disabled:opacity-30 bg-gray-600"
                >
                  <FiChevronLeft size={15} />
                </button>

                {/* Progress Indicators */}
                <div className="flex items-center gap-3">
                  {images.length <= 5 ? (
                    <div className="flex gap-1">
                      {images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-3 h-0.5 border-t-3 ${
                            idx === currentIndex
                              ? "border-[#703BF7]"
                              : "border-gray-400 border-t"
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {currentIndex + 1} / {images.length}
                      </span>
                      <div className="w-20 h-1 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#703BF7] transition-all duration-300"
                          style={{
                            width: `${((currentIndex + 1) / images.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={nextImages}
                  disabled={currentIndex >= images.length - step}
                  className="p-2 rounded-full border border-gray-600 disabled:opacity-30 bg-gray-600"
                >
                  <FiChevronRight size={15} />
                </button>
              </div>
            </div>
          </section>

          {/* Lightbox Dialog */}
          <Dialog.Root open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-white/95 dark:bg-black/95 z-50 backdrop-blur-sm dialog-overlay-animate" />
              <Dialog.Content className="fixed inset-0 z-100 flex items-center justify-center outline-none lightbox-content-animate">
                <div className="relative w-full h-full flex items-center justify-center">
                  <Dialog.Title className="sr-only">
                    Property Image Gallery
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Full-screen view of {property.name} images. Use arrow keys
                    or swipe to navigate.
                  </Dialog.Description>
                  {/* Close Button */}
                  <Dialog.Close asChild>
                    <button className="absolute top-6 right-6 z-50 p-3 bg-gray-200/80 dark:bg-black/50 text-gray-900 dark:text-white rounded-full hover:bg-[#703BF7] dark:hover:bg-[#703BF7] hover:text-white transition-all shadow-xl cursor-pointer">
                      <FiX size={24} />
                    </button>
                  </Dialog.Close>

                  {/* Navigation Arrows */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevLightboxImage();
                    }}
                    disabled={lightboxIndex === 0}
                    className="absolute left-6 z-50 p-4 bg-gray-200/80 dark:bg-black/50 text-gray-900 dark:text-white rounded-full hover:bg-[#703BF7] dark:hover:bg-[#703BF7] hover:text-white disabled:opacity-10 transition-all shadow-xl cursor-pointer hidden md:flex"
                  >
                    <FiChevronLeft size={32} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextLightboxImage();
                    }}
                    disabled={lightboxIndex === images.length - 1}
                    className="absolute right-6 z-50 p-4 bg-gray-200/80 dark:bg-black/50 text-gray-900 dark:text-white rounded-full hover:bg-[#703BF7] hover:text-white disabled:opacity-10 transition-all shadow-xl cursor-pointer hidden md:flex"
                  >
                    <FiChevronRight size={32} />
                  </button>

                  {/* Mobile Arrows */}
                  <div className="absolute bottom-10 flex gap-10 md:hidden z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevLightboxImage();
                      }}
                      disabled={lightboxIndex === 0}
                      className="p-4 bg-gray-200/80 dark:bg-black/50 text-gray-900 dark:text-white rounded-full hover:bg-[#703BF7] dark:hover:bg-[#703BF7] hover:text-white disabled:opacity-10 transition-all shadow-xl cursor-pointer"
                    >
                      <FiChevronLeft size={24} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextLightboxImage();
                      }}
                      disabled={lightboxIndex === images.length - 1}
                      className="p-4 bg-gray-200/80 dark:bg-black/50 text-gray-900 dark:text-white rounded-full hover:bg-[#703BF7] dark:hover:bg-[#703BF7] hover:text-white disabled:opacity-10 transition-all shadow-xl cursor-pointer"
                    >
                      <FiChevronRight size={24} />
                    </button>
                  </div>

                  {/* Image Container */}
                  <div
                    className="w-full h-full overflow-hidden relative flex items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    <div
                      className="flex transition-transform duration-500 ease-out w-full h-full items-center"
                      style={{
                        transform: `translateX(-${lightboxIndex * 100}%)`,
                      }}
                    >
                      {images.map((img, index) => (
                        <div
                          key={index}
                          className="w-full h-full shrink-0 flex items-center justify-center p-4"
                        >
                          <img
                            src={img}
                            alt={`Property Image ${index + 1}`}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Counter */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-200/80 dark:bg-black/50 text-gray-900 dark:text-white px-6 py-2 rounded-full text-sm font-semibold tracking-wider border border-gray-300 dark:border-white/10 backdrop-blur-md">
                    {lightboxIndex + 1} / {images.length}
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <section>
            {/* Property Video Section */}
            {property?.videoUrl && (
              <div className="px-4 pb-10 ">
                <div className="p-2 border border-gray-600/30 rounded-xl">
                  <h2 className="text-2xl text-gray-900 dark:text-white font-semibold mb-4">
                    Property Video Tour
                  </h2>

                  <div className="relative w-full h-[70vh] aspect-video rounded-xl overflow-hidden border border-gray-600/30 ">
                    {property.videoUrl.includes("youtube.com") ||
                    property.videoUrl.includes("youtu.be") ? (
                      <iframe
                        src={
                          property.videoUrl.includes("watch?v=")
                            ? property.videoUrl.replace("watch?v=", "embed/")
                            : property.videoUrl.includes("youtu.be/")
                              ? property.videoUrl.replace(
                                  "youtu.be/",
                                  "youtube.com/embed/",
                                )
                              : property.videoUrl
                        }
                        title="Property Video Tour"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        className="w-full h-full"
                      ></iframe>
                    ) : (
                      <video
                        src={property.videoUrl}
                        controls
                        className="w-full h-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="md:flex justify-between md:gap-6  px-4 mb-10 md:flex-row flex-col space-y-6 md:space-y-0">
            <div className="px-4 py-10 border border-gray-600/30 rounded-xl flex-1 h-fit dark:bg-[#1A1A1A] bg-white">
              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  Description
                </h2>
                <p className="text-gray-800 dark:text-gray-400 leading-relaxed">
                  {property?.description}
                </p>
              </div>
              {/* Property Details */}
              <div className="flex flex-col gap-4 border-t border-gray-600/30 pt-2">
                <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-row sm:items-center sm:justify-start sm:gap-[20%] md:gap-[3%] lg:gap-[15%] xl:*:gap-[20%]">
                  {hasBedrooms && (
                    <div className="flex flex-col px-2">
                      <span className="text-gray-800 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <FaBed />
                        Bedrooms
                      </span>
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">
                        {property?.bedrooms}
                      </span>
                    </div>
                  )}

                  {hasBathrooms && (
                    <div className="flex flex-col border-l border-gray-600/30 px-2">
                      <span className="text-gray-800 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <FaBath /> Bathrooms
                      </span>
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">
                        {property?.bathrooms}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex flex-col px-2 ${hasBedrooms || hasBathrooms ? "sm:border-l border-gray-600/30" : ""}`}
                  >
                    <span className="text-gray-800 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <FaHome />
                      Category
                    </span>
                    <span className="text-xl font-semibold text-gray-900 dark:text-white">
                      {property?.category}
                    </span>
                  </div>
                </div>

                {property?.specifications &&
                  property.specifications.length > 0 && (
                    <div className="pt-4 border-t border-gray-600/30">
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                        Specifications
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {property.specifications.map((spec, index) => (
                          <div
                            key={index}
                            className="flex flex-col border-[#703BF7] border-l pl-3 py-1"
                          >
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                              {spec.label}
                            </span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              {spec.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {property?.rules && property.rules.length > 0 && (
                  <div className="mt-2 pt-8 border-t border-gray-600/30">
                    <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                      Property Rules
                    </h2>
                    <ul className="space-y-4">
                      {property.rules.map((rule, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 border-red-500 border-l pl-2 bg-linear-to-r from-red-500/10 to-transparent p-2"
                        >
                          <span className="text-red-500 font-bold">
                            <FaBolt />
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {rule}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {(property?.keyFeatures && property.keyFeatures.length > 0) ||
            (property?.specialNotes && property.specialNotes.length > 0) ? (
              <div className="flex-1 px-4 py-6 dark:bg-[#1A1A1A] bg-white border border-gray-600/30 rounded-xl h-fit space-y-6">
                {property?.keyFeatures && property.keyFeatures.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                      Key Features and Amenities
                    </h2>
                    <ul className="space-y-4">
                      {property.keyFeatures.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 border-[#703BF7] border-l pl-2 bg-linear-to-r from-black/20 to-neutral p-2"
                        >
                          <span className="text-gray-700 dark:text-300">
                            <FaBolt />
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {property?.specialNotes && property.specialNotes.length > 0 && (
                  <div className="py-4 pb-0">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      Special Notes
                    </h2>
                    <ul className="space-y-2">
                      {property.specialNotes.map((note, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 border-[#703BF7] border-l bg-linear-to-r from-black/20 to-neutral p-2"
                        >
                          <span className="text-gray-700 dark:text-300">
                            <FaBolt />
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {note}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </section>
          <hr className="my-2 border-gray-600/50 w-[98%] mx-auto" />

          <div className="fixed bottom-4 right-4 z-30">
            <button
              onClick={() => setIsInquiryModalOpen(true)}
              className="rounded-full bg-[#703BF7] hover:bg-[#9677df] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#703BF7]/30 transition-all duration-300 hover:-translate-y-1"
            >
              Make Inquiry
            </button>
          </div>
          {/* Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pb-6">
            {/* Inquire Button */}
            <button
              onClick={() => setIsInquiryModalOpen(true)}
              className="bg-[#703BF7] hover:bg-[#5c2fe0] text-white px-4 py-3.5 rounded-xl text-base font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-[#703BF7]/20"
            >
              <FiMail size={20} /> Inquire
            </button>

            {/* Book Visit Button */}
            <button
              onClick={() => setIsInspectionModalOpen(true)}
              className="bg-white dark:bg-[#1A1A1A] border border-gray-600/30 hover:border-[#703BF7] hover:text-[#703BF7] text-gray-900 dark:text-white px-4 py-3.5 rounded-xl text-base font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <FiCalendar size={20} /> Book a Visit
            </button>

            {/* Pay Button */}
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="bg-white dark:bg-[#1A1A1A] border border-gray-600/30 hover:border-[#703BF7] hover:text-[#703BF7] text-gray-900 dark:text-white px-4 py-3.5 rounded-xl text-base font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <FiCreditCard size={20} /> Pay for Property
            </button>

            {/* Report Agent Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-white dark:bg-[#1A1A1A] hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-600/30 hover:border-red-500 text-gray-900 dark:text-white hover:text-red-500 px-4 py-3.5 rounded-xl text-base font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <FiFlag size={20} /> Report Agent
            </button>
          </div>

          {/* Related Properties Section */}
          {property && (
            <section className="p-4 ">
              <div className="mb-8 space-y-3">
                <img
                  src="/logo/Abstract Design (1).png"
                  alt="Icon"
                  className="w-13 object-contain"
                />
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
                    Related Properties
                  </h2>
                  <div className="flex items-center gap-1 flex-col">
                    <span
                      className={`text-sm font-medium ${sameAgentOnly ? "text-[#703BF7]" : "text-gray-700 dark:text-gray-400"}`}
                    >
                      Same agent
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sameAgentOnly}
                      onClick={() => setSameAgentOnly((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${sameAgentOnly ? "bg-[#703BF7]" : "bg-gray-400 dark:bg-gray-600"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${sameAgentOnly ? "translate-x-5" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                  {(totalRelatedProperties > RELATED_ITEMS_PER_PAGE ||
                    showAllRelated) && (
                    <button
                      onClick={() => setShowAllRelated(!showAllRelated)}
                      className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center shrink-0 hidden md:block"
                    >
                      {showAllRelated ? "Show Less" : "View All"}
                    </button>
                  )}
                </div>
                <p className="text-gray-800 dark:text-gray-400">
                  {sameAgentOnly
                    ? `These are other listings posted by the same agent as ${property.name}.`
                    : `You might also be interested in these similar ${property.category}s at ${property.location.city_town} .`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {relatedPropertiesLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <PropertyCardSkeleton key={index} />
                    ))
                  : currentRelatedProperties.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
              </div>

              {!relatedPropertiesLoading &&
                (totalRelatedProperties > RELATED_ITEMS_PER_PAGE ||
                  showAllRelated) && (
                  <>
                    <hr className="my-4 border-gray-600/50" />

                    {/* Pagination */}
                    <div className="flex justify-between items-center text-white">
                      <p className="text-sm text-black dark:text-white">
                        {showAllRelated
                          ? "All Properties"
                          : `${relatedPage} of ${totalRelatedPages || 1}`}
                      </p>

                      <button
                        onClick={() => setShowAllRelated(!showAllRelated)}
                        className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center w-[120px] md:hidden"
                      >
                        {showAllRelated ? "View Less" : "View All"}
                      </button>

                      <div className="flex gap-4">
                        <button
                          onClick={handleRelatedPrev}
                          disabled={
                            showAllRelated ||
                            relatedPropertiesLoading ||
                            relatedPage === 1
                          }
                          className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
                        >
                          <FiArrowLeft size={20} />
                        </button>

                        <button
                          onClick={handleRelatedNext}
                          disabled={
                            showAllRelated ||
                            relatedPropertiesLoading ||
                            relatedPage >= totalRelatedPages
                          }
                          className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
                        >
                          <FiArrowRight size={20} />
                        </button>
                      </div>
                    </div>
                  </>
                )}

              {!relatedPropertiesLoading && relatedProperties.length === 0 && (
                <p className="text-gray-500 italic">
                  {sameAgentOnly
                    ? "No properties from this agent were found."
                    : "No related properties found at the moment."}
                </p>
              )}
            </section>
          )}
        </>
      )}
      <div className="pt-5">
        <Footer />
      </div>
    </div>
  );
}

export default PropertyDetails;
