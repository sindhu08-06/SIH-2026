import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, UserCheck, ThumbsUp } from 'lucide-react';
import { api } from '../../services/api';
import { Booking, Language } from '../../types';

interface BookerRatingModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted: (bookingId: string, rating: number, comment?: string) => void;
  lang: Language;
}

const BOOKER_TAGS = [
  'Prompt Payment & Access',
  'Accurate Job Scope',
  'Courteous & Respectful',
  'Safe Working Conditions',
  'Clear Directions & Contact',
  'Cooperative Spirit',
];

export const BookerRatingModal: React.FC<BookerRatingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onRatingSubmitted,
  lang,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const fullComment = [
      selectedTags.length > 0 ? `Highlights: ${selectedTags.join(', ')}` : '',
      comment.trim(),
    ]
      .filter(Boolean)
      .join(' — ');

    try {
      await api.rateBooker(booking.id, {
        rating,
        reviewComment: fullComment,
        tags: selectedTags,
      });

      setIsDone(true);
      setTimeout(() => {
        onRatingSubmitted(booking.id, rating, fullComment);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Submit booker rating error:', err);
      setErrorMsg(err.message || 'Failed to submit booker rating. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">Booker Rating Recorded!</h3>
            <p className="text-xs text-slate-600">
              Your feedback establishes mutual trust and protects all fellow cooperative workers.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Rate Customer / Booker
                </h3>
                <p className="text-xs text-slate-500">
                  {booking.customerName} • Booking #{booking.bookingCode}
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs text-blue-900">
              <p className="font-semibold">Mutual Trust & Safety Guarantee</p>
              <p className="text-[11px] text-blue-800/80 mt-0.5">
                Rating the booker helps fellow cooperative artisans recognize prompt payers and safe worksites.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Star Rating selector */}
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const filled = hoverRating ? starVal <= hoverRating : starVal <= rating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      className="p-1 rounded-lg hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          filled
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        } transition`}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-xs font-bold text-slate-700">
                {rating === 5 && '★★★★★ Exemplary Booker (Safe, Courteous & Prompt)'}
                {rating === 4 && '★★★★☆ Good Booker (Clear Scope & Respectful)'}
                {rating === 3 && '★★★☆☆ Neutral (Minor Delays or Access Confusion)'}
                {rating === 2 && '★★☆☆☆ Difficult (Delayed Access or Disputed Terms)'}
                {rating === 1 && '★☆☆☆☆ Safety or Payment Issue (Flagged to Board)'}
              </div>
            </div>

            {/* Quick tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Worksite & Patron Highlights
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BOOKER_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-100 border-blue-400 text-blue-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Artisan Notes on Customer (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Mention customer readiness, promptness with payment, or clarity of work..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-blue-600 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Booker Review...' : 'Submit Booker Rating'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
