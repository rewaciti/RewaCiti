import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiStar } from "react-icons/fi";
import { toast } from "sonner";
import axios from "axios";
import type { Property } from "../../../types";

interface ServiceRatingModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ServiceRatingModal: React.FC<ServiceRatingModalProps> = ({
  property,
  open,
  onOpenChange,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setIsSubmitting(true);

    try { 
      const feedbackPayload = {
        companyId: "69b4712ce95a2df514b1c789",
        pipelineId: "6a27f05df19944ca7f9a87dd",
        title: `FEEDBACK: ${property.name}`,
        note: `Rating: ${rating}/5\nFeedback: ${feedback}`,
        customData: [
          { label: "Property Name", value: property.name },
          { label: "Service Rating", value: `${rating} Stars` },
          { label: "Feedback", value: feedback },
          { label: "Property ID", value: property.id }
        ]
      };

      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", feedbackPayload);

      toast.success("Thank you for your feedback!");
      onOpenChange(false);
      setRating(0);
      setFeedback("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Thank you anyway!");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-6 rounded-xl shadow-2xl z-50">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold dark:text-white text-gray-900">
              Rate Our Service
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600">
                <FiX />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm dark:text-gray-300 text-gray-700 block text-center">
                How was your experience paying for this property?
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <FiStar
                      size={32}
                      className={`${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm dark:text-gray-300 text-gray-700 block">
                Additional Feedback (Optional)
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more about your experience..."
                className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
              ></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2 border border-gray-600/30 rounded-md text-sm font-medium dark:text-gray-300 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  rating > 0 && !isSubmitting
                    ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white"
                    : "bg-gray-400 cursor-not-allowed text-gray-200"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ServiceRatingModal;
