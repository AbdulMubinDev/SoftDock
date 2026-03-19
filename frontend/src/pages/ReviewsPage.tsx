import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingBackground } from '../components/landing/LandingBackground';
import { Footer } from '../components/landing/Footer';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';

interface FeedbackItem {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  user_display_name?: string;
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const w = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5 shrink-0" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${w} ${star <= rating ? 'text-amber-400' : 'text-[var(--border)]'}`}
          viewBox="0 0 24 24"
          fill={star <= rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function RatingBar({ count, total, stars }: { count: number; total: number; stars: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 w-full max-w-[180px]">
      <span className="text-xs text-[var(--text-muted)] w-6">{stars}</span>
      <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400/80 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-dim w-8 text-right">{count}</span>
    </div>
  );
}

type StarFilter = null | 1 | 2 | 3 | 4 | 5;

const STAR_OPTIONS: { value: StarFilter; label: string }[] = [
  { value: null, label: 'All' },
  { value: 5, label: '5 stars' },
  { value: 4, label: '4 stars' },
  { value: 3, label: '3 stars' },
  { value: 2, label: '2 stars' },
  { value: 1, label: '1 star' },
];

const STAR_COUNT = 5;

export function ReviewsPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<StarFilter>(null);
  const [submitRating, setSubmitRating] = useState(0);
  const [submitHover, setSubmitHover] = useState(0);
  const [submitReview, setSubmitReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const fetchFeedbacks = () => {
    return api
      .get<FeedbackItem[]>('/auth/feedback/')
      .then((res) => setFeedbacks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFeedbacks([]));
  };

  useEffect(() => {
    setLoading(true);
    api
      .get<FeedbackItem[]>('/auth/feedback/')
      .then((res) => setFeedbacks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFeedbacks([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitReview = async () => {
    if (submitRating < 1 || submitRating > 5) {
      setSubmitMessage({ type: 'error', text: 'Please select a rating from 1 to 5 stars.' });
      return;
    }
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      await api.post('/auth/feedback/', { rating: submitRating, review: submitReview.trim().slice(0, 5000) });
      setSubmitMessage({ type: 'success', text: 'Thank you! Your review has been submitted.' });
      setSubmitRating(0);
      setSubmitHover(0);
      setSubmitReview('');
      setShowSubmitForm(false);
      await fetchFeedbacks();
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: Record<string, string[]> } }).response?.data : null;
      const errMsg = res?.rating?.[0] ?? res?.review?.[0] ?? res?.detail ?? 'Failed to submit.';
      setSubmitMessage({ type: 'error', text: typeof errMsg === 'string' ? errMsg : 'Failed to submit.' });
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    const sum = feedbacks.reduce((a, f) => a + f.rating, 0);
    const distribution = [5, 4, 3, 2, 1].map((star) => feedbacks.filter((f) => f.rating === star).length);
    return {
      average: Math.round((sum / total) * 10) / 10,
      total,
      distribution,
    };
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    if (starFilter === null) return feedbacks;
    return feedbacks.filter((f) => f.rating === starFilter);
  }, [feedbacks, starFilter]);

  return (
    <div className="min-h-screen text-[var(--text)] relative z-10 overflow-x-hidden" style={{ background: 'var(--bg, #05050D)' }}>
      <LandingBackground />
      <LandingNav />

      {/* Hero — enough top padding so nav never clips it */}
      <main className="relative z-10 pt-[7.5rem] pb-20 min-h-[50vh]">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          {/* Hero section: full width, no clipping */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text)] mb-3 tracking-tight">
                Reviews
              </h1>
              <p className="text-[var(--text-muted)] text-base sm:text-lg max-w-xl mx-auto">
                See what others are saying about SoftDock. Sign in or create an account to leave your review.
              </p>
            </div>

            {/* CTA: sign in / register for guests */}
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <span className="text-sm text-[var(--text-muted)] text-center sm:text-left">
                  Create an account or sign in to submit your feedback.
                </span>
                <div className="flex gap-2">
                  <Link to="/login?next=/reviews">
                    <Button variant="ghost" size="sm">Sign in</Button>
                  </Link>
                  <Link to="/register?next=/reviews">
                    <Button size="sm">Create account</Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Submit review: one block — either button or form (transforms in place) */}
            {isAuthenticated && (
              <div className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm overflow-hidden shadow-xl">
                {!showSubmitForm ? (
                  <button
                    type="button"
                    onClick={() => setShowSubmitForm(true)}
                    className="w-full flex items-center justify-center px-6 py-5 text-[var(--text)] font-medium hover:bg-[var(--surface)]/80 transition-colors"
                  >
                    Submit your review
                  </button>
                ) : (
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h3 className="text-lg font-semibold text-[var(--text)]">Write your review</h3>
                      <button
                        type="button"
                        onClick={() => { setShowSubmitForm(false); setSubmitMessage(null); }}
                        className="text-sm text-text-dim hover:text-[var(--text)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-4">Your review will appear with others on this page.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">Rating (required)</label>
                        <div className="flex items-center gap-1" role="group" aria-label="Star rating">
                          {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((star) => {
                            const display = submitHover || submitRating;
                            const filled = star <= display;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setSubmitRating(star)}
                                onMouseEnter={() => setSubmitHover(star)}
                                onMouseLeave={() => setSubmitHover(0)}
                                className="p-1 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                aria-label={`${star} star${star === 1 ? '' : 's'}`}
                                aria-pressed={submitRating === star}
                              >
                                <svg
                                  className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${filled ? 'text-amber-400' : 'text-[var(--border)]'}`}
                                  viewBox="0 0 24 24"
                                  fill={filled ? 'currentColor' : 'none'}
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  aria-hidden
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-text-dim mt-1">
                          {submitRating ? `${submitRating} of ${STAR_COUNT} stars` : 'Click a star to rate'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Your review (optional)</label>
                        <textarea
                          value={submitReview}
                          onChange={(e) => setSubmitReview(e.target.value)}
                          placeholder="Share your experience..."
                          rows={3}
                          maxLength={5000}
                          className="w-full bg-[var(--bg)]/80 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-primary/50 resize-none"
                        />
                        <p className="text-[11px] text-text-dim mt-1">{submitReview.length}/5000</p>
                      </div>
                      {submitMessage && (
                        <p className={`text-sm ${submitMessage.type === 'success' ? 'text-green-500' : 'text-red-400'}`}>
                          {submitMessage.text}
                        </p>
                      )}
                      <Button onClick={handleSubmitReview} disabled={submitting || submitRating < 1}>
                        {submitting ? 'Submitting…' : 'Submit review'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Play Store style: rating overview card */}
            {!loading && feedbacks.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm p-6 sm:p-8 mb-10 shadow-xl">
                <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-center">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-5xl sm:text-6xl font-bold text-[var(--text)] leading-none">
                      {stats.average.toFixed(1)}
                    </span>
                    <StarRating rating={Math.round(stats.average)} size="md" />
                    <span className="text-sm text-text-dim mt-2">{stats.total} reviews</span>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <RatingBar
                        key={star}
                        stars={star}
                        count={stats.distribution[5 - star] ?? 0}
                        total={stats.total}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Reviews list — Play Store style cards */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {loading ? 'Loading…' : feedbacks.length === 0 ? 'No reviews yet' : starFilter === null ? 'All reviews' : `${starFilter} star reviews`}
              </h2>
              {!loading && feedbacks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {STAR_OPTIONS.map(({ value, label }) => {
                    const count = value === null ? feedbacks.length : feedbacks.filter((f) => f.rating === value).length;
                    const isActive = starFilter === value;
                    return (
                      <button
                        key={value ?? 'all'}
                        type="button"
                        onClick={() => setStarFilter(value)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/20 text-primary-bright border border-primary/40'
                            : 'bg-[var(--surface)]/60 text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--border)] hover:text-[var(--text)]'
                        }`}
                      >
                        {label}
                        <span className="text-xs opacity-80">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-bright" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <p className="text-[var(--text-muted)] mb-1">No reviews yet</p>
                <p className="text-sm text-text-dim">Be the first to share your experience.</p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 py-12 text-center">
                <p className="text-[var(--text-muted)]">No {starFilter} star reviews.</p>
                <button
                  type="button"
                  onClick={() => setStarFilter(null)}
                  className="mt-2 text-sm text-primary-bright hover:underline"
                >
                  Show all reviews
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredFeedbacks.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 hover:bg-[var(--surface)]/80 hover:border-[var(--border)] p-4 sm:p-5 transition-colors"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-sm font-semibold text-primary-bright shrink-0">
                        {(item.user_display_name ?? 'U').trim()[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-[var(--text)]">{item.user_display_name ?? 'User'}</span>
                          <StarRating rating={item.rating} size="sm" />
                          <span className="text-xs text-text-dim">
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {item.review ? (
                          <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                            {item.review}
                          </p>
                        ) : (
                          <p className="text-sm text-text-dim italic">No review text.</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
