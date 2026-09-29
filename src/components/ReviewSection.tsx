import React, { useState } from 'react';
import { Star, MessageSquare, Loader2, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ReviewSectionProps {
  productId: string;
  reviews: any[];
  onReviewAdded: () => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, reviews, onReviewAdded }) => {
  const { currentUser, signInWithGoogle } = useAuth();
  
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (rating === 0) return alert('Please select a star rating.');
    if (!comment.trim()) return alert('Please write a review comment.');

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'products', productId, 'reviews'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        userImage: currentUser.photoURL || null,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      });
      setComment('');
      setRating(5);
      onReviewAdded(); // Refresh the list
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to post review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 md:mt-24 border-t border-charcoal/10 pt-6 md:pt-16 animate-fade-in w-full min-w-0">
      <h2 className="text-[16px] md:text-2xl font-serif text-charcoal mb-6 md:mb-10 flex items-center gap-2 md:gap-3">
        <MessageSquare size={20} className="md:w-[24px] md:h-[24px] text-[#C4A47C]" /> 
        Customer Reviews
      </h2>

      <div className="flex flex-col md:grid md:grid-cols-3 gap-8 md:gap-12 w-full min-w-0">
        
        {/* LEAVE A REVIEW FORM */}
        <div className="w-full min-w-0 md:col-span-1 bg-[#FAF8F5] p-6 md:p-8 rounded-xl h-fit shadow-sm border border-charcoal/5">
          <h3 className="font-serif text-[15px] md:text-xl text-charcoal mb-4">Write a Review</h3>
          
          {!currentUser ? (
            <div className="text-center py-2 md:py-6 flex flex-col items-center">
              <p className="text-charcoal/60 mb-3 md:mb-6 text-[10px] md:text-sm">Join the community and share your thoughts on this beautiful piece.</p>
              <button 
                onClick={signInWithGoogle}
                className="btn-luxury w-auto px-4 md:px-6 py-2 md:py-3 text-[8px] md:text-xs flex justify-center items-center gap-2 border border-charcoal hover:bg-charcoal hover:text-white transition-colors"
              >
                <svg className="w-3 h-3 md:w-4 md:h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:gap-6">
              <div className="flex items-center gap-3 mb-1 md:mb-2">
                <img src={currentUser.photoURL || ''} alt="User" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-charcoal/10" />
                <div>
                  <p className="text-[12px] md:text-sm font-medium text-charcoal">{currentUser.displayName}</p>
                  <p className="text-[10px] md:text-xs text-charcoal/50">Posting publicly</p>
                </div>
              </div>

              <div>
                <label className="block text-[9px] md:text-xs uppercase tracking-widest text-charcoal/60 mb-2">Your Rating</label>
                <div className="flex items-center gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star 
                        size={20} 
                        className={`md:w-[24px] md:h-[24px] transition-colors duration-200 ${(hoverRating || rating) >= star ? 'text-[#C4A47C] fill-[#C4A47C]' : 'text-charcoal/20'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] md:text-xs uppercase tracking-widest text-charcoal/60 mb-2">Your Experience</label>
                <textarea 
                  required
                  rows={4} 
                  placeholder="What did you love about this piece? How was the quality?"
                  className="w-full bg-white border border-charcoal/10 rounded-lg p-3 md:p-4 outline-none focus:border-[#C4A47C] transition-colors resize-none text-[11px] md:text-sm shadow-inner"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="btn-luxury btn-luxury-solid w-full py-2.5 md:py-3.5 flex items-center justify-center gap-2 text-[10px] md:text-sm"
              >
                {submitting ? <><Loader2 className="animate-spin md:w-[16px] md:h-[16px]" size={14} /> Posting...</> : 'Post Review'}
              </button>
            </form>
          )}
        </div>

        {/* REVIEW LIST */}
        <div className="w-full md:col-span-2">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center h-full border-2 border-dashed border-charcoal/10 rounded-xl">
              <Star size={30} className="md:w-[40px] md:h-[40px] text-charcoal/20 mb-3 md:mb-4" />
              <h3 className="font-serif text-[15px] md:text-xl text-charcoal mb-1 md:mb-2">No reviews yet</h3>
              <p className="text-charcoal/50 text-[11px] md:text-sm max-w-[200px] md:max-w-[250px]">Be the first to share your thoughts on this stunning piece.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} size={16} 
                      className={`md:w-[20px] md:h-[20px] fill-current text-[#C4A47C]`} 
                    />
                  ))}
                </div>
                <p className="text-charcoal/70 text-[11px] md:text-sm font-medium">{reviews.length} Customer {reviews.length === 1 ? 'Review' : 'Reviews'}</p>
              </div>

              {reviews.map((review) => (
                <div key={review.id} className="border-b border-charcoal/10 pb-5 md:pb-6 last:border-0 animate-fade-in">
                  <div className="flex justify-between items-start mb-2 md:mb-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      {review.userImage ? (
                        <img src={review.userImage} alt={review.userName} className="w-8 h-8 md:w-10 md:h-10 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-charcoal/5 flex items-center justify-center text-charcoal/40">
                          <UserCircle size={20} className="md:w-[24px] md:h-[24px]" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-charcoal text-[12px] md:text-sm">{review.userName}</p>
                        <p className="text-[9px] md:text-[11px] text-charcoal/40 uppercase tracking-wider mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} size={12} 
                          className={`md:w-[14px] md:h-[14px] ${i < review.rating ? 'text-[#C4A47C] fill-[#C4A47C]' : 'text-charcoal/20'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  {review.isHidden ? (
                    <p className="text-charcoal/40 text-[11px] md:text-sm italic py-2">This review has been hidden by the store administrator.</p>
                  ) : (
                    <p className="text-charcoal/70 text-[12px] md:text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReviewSection;
