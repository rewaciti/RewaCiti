import Navbar from "../../../shared/components/Layout/Navbar";
import { useParams, Link } from "react-router";
import { FiMapPin, FiChevronLeft, FiChevronRight, FiChevronDown} from "react-icons/fi";
import { usePropertyStore } from "../store/usePropertyStore";
import { useState, useEffect, useRef } from "react";
import { FaBed, FaBath, FaHome, FaBolt  } from "react-icons/fa";
import Footer from "../../../shared/components/Layout/Footer";
import axios from "axios";
import BookInspectionModal from "../../inspections/components/BookInspectionModal";
import PropertyPaymentModal from "../components/PropertyPaymentModal";
import ReportAgentModal from "../components/ReportAgentModal";
import { PropertyDetailsSkeleton } from "../../../shared/components/ui/Skeletons";
import { toast } from "sonner";
import { formatCurrency } from "../../../shared/lib/utils";

const slugify = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-");

function PropertyDetails() {
  const { name } = useParams();
  const { properties, fetchProperties, loading } = usePropertyStore();
  const property = properties.find((p) => slugify(p.name) === name);

  const price = property?.pricing.TotalCost ?? 0;
  const images = property?.images ?? [];

  const hasBedrooms = !!property && property.bedrooms !== 0;
  const hasBathrooms = !!property && !!property.bathrooms && property.bathrooms !== 0 && property.bathrooms !== "0";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState(window.innerWidth < 768 ? 1 : 2);

  const visibleImages = images.slice(currentIndex, currentIndex + step);

  const nextImages = () => {
    if (currentIndex + step < images.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevImages = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (properties.length === 0) {
      fetchProperties();
    }
  }, [properties.length, fetchProperties]);

  // FORM STATES
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    if (!property) return;

    setIsSubmitting(true);

    const fullName = `${firstName} ${lastName}`.trim();

    const propertyUrl = window.location.href;

    const payload = {
      companyId: "69b4712ce95a2df514b1c789",
      pipelineId: "69b49c7541d35d158e336621",
      title: `${fullName} interested in ${property.name} (₦${formatCurrency(price)})`,
      name: fullName,
      amount: price,
      email: email,
      phone: phone,
      address: `${property.location.area}, ${property.location.city}, ${property.location.state}`,
      note: message,
      ownerId: property.createdBy,
      customData: [
        {
          label: "Property",
          value: property.name,
        },
        {
          label: "Property Link",
          value: propertyUrl,
        },
        {
          label: "Category",
          value: property.category,
        },
        {
          label: "Location",
          value: `${property.location.area}, ${property.location.city}`,
        },
        {
          label: "Agent ID",
          value: property.createdBy,
        },
        {
          label: "Property ID",
          value: property.id,
        },
        ...(property.caretakerContact?.whatsapp ? [{ label: "Caretaker WhatsApp", value: property.caretakerContact.whatsapp }] : []),
        ...(property.caretakerContact?.phone ? [{ label: "Caretaker Phone", value: property.caretakerContact.phone }] : [])
      ]
    };

    try {
     await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      toast.success("Message sent successfully!");
      // reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setAgreed(false);

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };




  useEffect(() => {
    const handleResize = () => {
      setStep(window.innerWidth < 768 ? 1 : 2);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-gray-300 dark:bg-black/30">
      <Navbar />

      {loading && properties.length === 0 ? (
        <PropertyDetailsSkeleton />
      ) : !property ? (
        <div className="bg-black/30 min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-4">Property Not Found</h1>
            <p className="text-gray-400">The property you're looking for doesn't exist.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-auto">
            {/* Name, Location & Price Section */}
            <div className="md:flex gap-3 items-center px-4 py-6 whitespace-nowrap">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold mb-1 text-gray-900 dark:text-white max-w-[90%]">{property?.name}</h1>
          </div>

          <div className="md:flex justify-between md:items-center w-full mt-4 md:mt-0">
            {/* Location */}
            <a
              href={
                property?.geo_location?.lat !== 0 && property.geo_location?.lat !== null &&
                property?.geo_location?.lng !== 0 && property?.geo_location?.lng !== null
                  ? `https://www.google.com/maps/search/?api=1&query=${property.geo_location.lat},${property.geo_location.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      property
                        ? [
                            property.location.area,
                            property.location.city,
                            property.location.state,
                          ].join(", ")
                        : ""
                    )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm border dark:text-gray-400 text-gray-900 border-gray-600/30 rounded-sm px-2 py-1 inline-flex items-center gap-2 hover:text-[#703BF7] hover:border-[#703BF7] transition-colors"
            >
              <FiMapPin className="" />
              {property &&
                [
                  property.location.area,
                  property.location.city,
                  property.location.state,
                ].join(", ")}
            </a>

            {/* Price & Action */}
            <div className="flex gap-4 items-center justify-between mt-4 md:mt-0">
              <div className="flex flex-col items-start">
                <p className="text-xs text-gray-800 dark:text-gray-400 flex">Price ({property?.duration})</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">₦{formatCurrency(price)}</p>
              </div>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="bg-[#703BF7] hover:bg-[#5c2fe0] text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg hover:shadow-[#703BF7]/20 flex items-center gap-2 cursor-pointer"
                >
                  Actions
                  <FiChevronDown
                    className={`transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-9 mt-2 w-64 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border border-gray-600/30 rounded-xl shadow-2xl z-100 overflow-hidden flex flex-col">
                    
                    <button
                      onClick={() => {
                        setIsPaymentModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#703BF7] dark:hover:bg-[#703BF7] hover:text-white transition-all duration-300 group first:rounded-t-xl cursor-pointer"
                    >
                      <div className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white group-hover:text-white">
                        <span>💳</span> Pay for Property
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-white/80">Complete property purchase & rating</div>
                    </button>

                    <button
                      onClick={() => {
                        setIsInspectionModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#703BF7] dark:hover:bg-[#703BF7] hover:text-white transition-all duration-300 border-t border-gray-600/30 group cursor-pointer"
                    >
                      <div className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white group-hover:text-white">
                        <span>📅</span> Book a Visit
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-white/80">Non-refundable inspection fee applies</div>
                    </button>

                    <button
                      onClick={() => {
                        setIsReportModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-all duration-300 border-t border-gray-600/30 group last:rounded-b-xl cursor-pointer"
                    >
                      <div className="text-sm font-medium flex items-center gap-2 text-red-500 group-hover:text-white">
                        <span>🚩</span> Report Agent
                      </div>
                      <div className="text-[10px] text-red-400 group-hover:text-white/80">Report unprofessional behavior</div>
                    </button>

                  </div>
                )}
              </div>
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
      />

      <ReportAgentModal
        property={property}
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
      />

      <section className="px-4 pb-10 ">
        <div className="p-2 border border-gray-600/30 rounded-xl">
          {/* Thumbnail Row */}
          <div className="flex gap-2 overflow-x-auto mb-6 p-1 border border-gray-600/30 rounded-xl bg-black/20">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                onClick={() => setCurrentIndex(index)}
                className={`h-30 w-30 md:w-full dark:bg-[#1A1A1A] bg-white object-cover rounded-lg cursor-pointer border ${
                  index === currentIndex ? "border-[#703BF7]" : "border-gray-600/30"
                }`}
              />
            ))}
          </div>
  
          {/* Main Image Display */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {visibleImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  className="w-full dark:bg-[#1A1A1A] bg-white h-[70vh] object-cover rounded-xl"
                />
              ))}
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
              <div className="flex gap-1">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-3 h-0.5 border-t-3 ${
                      idx === currentIndex ? "border-[#703BF7]" : "border-gray-400 border-t"
                    }`}
                  />
                ))}
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
        </div>
      </section>

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
                            "youtube.com/embed/"
                          )
                        : property.videoUrl
                    }
                    title="Property Video Tour"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
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

      <section className="md:flex justify-between gap-6 px-4 mb-10 md:flex-row flex-col space-y-6 md:space-y-0">
      <div className="px-4 py-10 border border-gray-600/30 rounded-xl flex-1 h-fit dark:bg-[#1A1A1A] bg-white">
          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Description</h2>
            <p className="text-gray-800 dark:text-gray-400 leading-relaxed">
              {property?.description}</p>
          </div>
  
          {/* Property Details */}
          <div className="flex flex-wrap gap-6 border-t border-gray-600/30 pt-2 justify-between">
            {hasBedrooms && (
              <div className="flex flex-col px-2 ">
                <span className="text-gray-800 dark:text-gray-400 mt-1 flex items-center gap-1"><FaBed/>Bedrooms</span>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">{property?.bedrooms}</span> 
              </div>
            )}
            
            {hasBathrooms && (
              <div className="flex flex-col border-l border-gray-600/30 px-2">
                 <span className="text-gray-800 dark:text-gray-400 mt-1 flex items-center gap-1"><FaBath /> Bathrooms</span>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">{property?.bathrooms}</span>
              </div>
            )}

             <div className={`flex flex-col px-2 ${(hasBedrooms || hasBathrooms) ? 'sm:border-l border-gray-600/30' : ''}`}>
               <span className="text-gray-800 dark:text-gray-400 mt-1 flex  items-center gap-1"><FaHome/>Category</span>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">{property?.category}</span>
            </div>
          </div>

          {/* Specifications & Attributes */}
          {property?.attributes && property.attributes.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-600/30">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.attributes.map((attr, index) => (
                  <div key={index} className="flex flex-col border-[#703BF7] border-l pl-3 py-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{attr.label}</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Key Features & Rules */}
      {( (property?.keyFeatures && property.keyFeatures.length > 0) || (property?.rules && property.rules.length > 0) ) && (
        <div className="flex-1 px-4 py-6 dark:bg-[#1A1A1A] bg-white border border-gray-600/30 rounded-xl space-y-6 h-fit">
          {property?.keyFeatures && property.keyFeatures.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">Key Features and Amenities</h2>
              <ul className="space-y-4">
                {property.keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 border-[#703BF7] border-l pl-2 bg-linear-to-r from-black/20 to-neutral p-2">
                    <span className="text-gray-700 dark:text-300"><FaBolt /></span>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {property?.rules && property.rules.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">Property Rules</h2>
              <ul className="space-y-4">
                {property.rules.map((rule, index) => (
                  <li key={index} className="flex items-center gap-2 border-red-500 border-l pl-2 bg-linear-to-r from-red-500/10 to-transparent p-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      </section>

      <section className="md:flex justify-between px-4">
        <div className="flex-1 flex flex-col space-y-3 z-10 mb-6 ">
          <img
            src="/logo/Abstract Design (1).png"
            alt="Icon"
            className="w-13 h-13 object-contain"
          />

          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Inquire About {property?.name} </h1>

          <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
           Interested in this property? Fill out the form below, and our real estate experts will get back to you with more details, including scheduling a viewing and answering any questions you may have.
          </p>
        </div>

        <div className=" p-6 dark:bg-[#1A1A1A] bg-white border border-gray-600/30 rounded-xl text-white flex-2">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Send Us a Message</h2>

          <form onSubmit={handleSubmit} className="space-y-5 dark:bg-[#1A1A1A] bg-white">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300">First Name</label>
                <input
                  type="text"
                  placeholder="Enter First Name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
                />
              </div>

              <div>
                <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300">Last Name</label>
                <input
                  type="text"
                  placeholder="Enter Last Name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  placeholder="Enter your Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
                />
              </div>

              <div>
                <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  placeholder="Enter Phone Number"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
                />
              </div>
            </div>

            {/* Selected Property */}
            <div>
              <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300">Selected Property</label>
              <input
                type="text"
                value={`${property?.name}, ${property?.location?.area},${property?.location?.city},${property?.location?.state}`}
                readOnly
                className="w-full border border-gray-600/30 rounded-md px-4 py-2 text-s focus:outline-none text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300">Message</label>
              <textarea
                rows={4}
                placeholder="Enter your Message here..."
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Agreement */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <p className="text-gray-900 dark:text-white text-sm">
                I agree with the{" "}
                <Link to="/terms" className="hover:text-[#703BF7] text-gray-900 dark:text-white text-sm underline dark:hover:text-[#703BF7]">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="hover:text-[#703BF7] text-gray-900 dark:text-white text-sm underline dark:hover:text-[#703BF7]">
                  Privacy Policy
                </Link>
              </p>
            </div>

              {/* Submit Button */}
            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                  type="submit"
                  disabled={!agreed || isSubmitting}
                  className={`px-4 py-3 rounded-lg font-medium transition
                    ${agreed && !isSubmitting
                      ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white" 
                      : "bg-gray-400 cursor-not-allowed text-gray-200"
                    }`}
                >
                  {isSubmitting ? "Sending..." : "Send Your Message"}
              </button>
            </div>
          </form>
        </div>
      </section>
        </>
      )}
      <div className="pt-5"><Footer/></div>
    </div>
  );
}

export default PropertyDetails;
