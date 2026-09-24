"use client";

import { useState } from "react";
import { Star, MessageSquare, Loader2, HeartHandshake } from "lucide-react";
import { toast } from "sonner";

export function RateUsClient({ leadId, customerName }: { leadId: string, customerName: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Replace this with the actual Google Business link
  const GOOGLE_REVIEW_LINK = "https://g.page/r/your-google-business-id/review";

  const handleStarClick = (value: number) => {
    setRating(value);
    
    // Review Gating Logic
    if (value >= 4) {
      // 4 or 5 stars -> Send them straight to Google!
      handleSubmit(value, "Redirected to Google");
      window.location.href = GOOGLE_REVIEW_LINK;
    } else {
      // 1, 2, or 3 stars -> Show internal apology form
      setShowForm(true);
    }
  };

  const handleSubmit = async (finalRating: number = rating, finalComment: string = comment) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, rating: finalRating, comment: finalComment })
      });
      const data = await res.json();
      if (data.success) {
        setIsDone(true);
      } else {
        toast.error("Failed to submit feedback.");
      }
    } catch (e) {
      toast.error("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone && rating < 4) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-gray-900">Thank you for your feedback.</h3>
        <p className="text-gray-500 font-medium text-sm">
          We deeply apologize that your experience was not perfect. Our senior management team has been alerted and will contact you shortly to resolve this.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Star Selector */}
      {!showForm && (
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(val => (
            <Star 
              key={val}
              onClick={() => handleStarClick(val)}
              onMouseEnter={() => setHovered(val)}
              onMouseLeave={() => setHovered(0)}
              className={`w-12 h-12 cursor-pointer transition-all ${(hovered || rating) >= val ? 'fill-yellow-400 text-yellow-400 scale-110' : 'text-gray-200 hover:text-yellow-200'}`}
            />
          ))}
        </div>
      )}

      {/* Internal Apology Form for <= 3 Stars */}
      {showForm && !isDone && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left space-y-4">
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-rose-700 text-sm font-bold flex items-start gap-2">
            <span>⚠️</span>
            <p>We are so sorry we didn't meet your expectations. Please let us know exactly what went wrong so we can fix it immediately.</p>
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-2 uppercase tracking-widest">
              <MessageSquare className="w-3 h-3" /> Private Feedback
            </label>
            <textarea 
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="What could we have done better?"
              className="w-full text-sm p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-rose-400 font-medium resize-none bg-gray-50"
            ></textarea>
          </div>

          <button
            onClick={() => handleSubmit(rating, comment)}
            disabled={isSubmitting || !comment}
            className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
