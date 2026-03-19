import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';

const STAR_COUNT = 5;

export function Feedback() {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const displayRating = hoverRating || rating;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setMessage({ type: 'error', text: 'Please select a rating from 1 to 5 stars.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post('/auth/feedback/', { rating, review: review.trim().slice(0, 5000) });
      setMessage({ type: 'success', text: 'Thank you! Your feedback has been submitted.' });
      setRating(0);
      setHoverRating(0);
      setReview('');
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: Record<string, string[]> } }).response?.data : null;
      const errMsg = res?.rating?.[0] ?? res?.review?.[0] ?? res?.detail ?? 'Failed to submit feedback.';
      setMessage({ type: 'error', text: typeof errMsg === 'string' ? errMsg : 'Failed to submit feedback.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Feedback</h1>
        <p className="text-sm text-text-muted mt-1">
          Share your review and help us improve. Your opinion matters.
        </p>
        <Link to="/reviews" className="text-sm text-primary-bright hover:underline mt-2 inline-block">
          View all reviews →
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--text)]">Rate your experience</h2>
          <p className="text-sm text-text-muted mt-1">Select 1 to 5 stars and optionally add a review.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star rating */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Rating (required)</label>
            <div className="flex items-center gap-1" role="group" aria-label="Star rating">
              {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
                  aria-label={`${star} star${star === 1 ? '' : 's'}`}
                  aria-pressed={rating === star}
                >
                  <svg
                    className={`w-10 h-10 transition-colors ${star <= displayRating ? 'text-amber-400' : 'text-text-dim'}`}
                    viewBox="0 0 24 24"
                    fill={star <= displayRating ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="sr-only">{star} star{star === 1 ? '' : 's'}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-dim mt-1.5">
              {displayRating ? `${displayRating} of ${STAR_COUNT} stars` : 'Click a star to rate'}
            </p>
          </div>

          {/* Review text */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Your review (optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell us what you think — what you like, what we could do better..."
              rows={5}
              maxLength={5000}
              className="w-full bg-surface-2 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-primary/50 resize-none"
            />
            <p className="text-[11px] text-text-dim mt-1">{review.length}/5000</p>
          </div>

          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}

          <Button onClick={handleSubmit} disabled={submitting || rating < 1}>
            {submitting ? 'Submitting...' : 'Submit feedback'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
