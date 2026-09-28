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
    <div className="mt-8 md:mt-24 border-t border-charcoal/10 pt-8 md:pt-16 animate-fade-in">
      <h2 className="text-2xl font-serif text-charcoal mb-10 flex items-center gap-3">
        <MessageSquare size={24} className="text-[#C4A47C]" /> 
        Customer Reviews
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* LEAVE A REVIEW FORM */}
        <div className="lg:col-span-1 bg-[#FAF8F5] p-6 md:p-8 rounded-xl h-fit shadow-sm border border-charcoal/5">
          <h3 className="font-serif text-xl text-charcoal mb-4">Write a Review</h3>
          
          {!currentUser ? (
            <div className="text-center py-6">
              <p className="text-charcoal/60 mb-6 text-sm">Join the community and share your thoughts on this beautiful piece.</p>
              <button 
                onClick={signInWithGoogle}
                className="btn-luxury w-full py-3 text-sm flex justify-center items-center gap-2 border border-charcoal hover:bg-charcoal hover:text-white transition-colors"
              >
                Sign in with Google to Review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <img src={currentUser.photoURL || ''} alt="User" className="w-10 h-10 rounded-full border border-charcoal/10" />
                <div>
                  <p className="text-sm font-medium text-charcoal">{currentUser.displayName}</p>
                  <p className="text-xs text-charcoal/50">Posting publicly</p>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-charcoal/60 mb-2">Your Rating</label>
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
                        size={24} 
                        className={`transition-colors duration-200 ${(hoverRating || rating) >= star ? 'text-[#C4A47C] fill-[#C4A47C]' : 'text-charcoal/20'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-charcoal/60 mb-2">Your Experience</label>
                <textarea 
                  required
                  rows={4} 
                  placeholder="What did you love about this piece? How was the quality?"
                  className="w-full bg-white border border-charcoal/10 rounded-lg p-4 outline-none focus:border-[#C4A47C] transition-colors resize-none text-sm shadow-inner"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="btn-luxury btn-luxury-solid w-full py-3.5 flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? <><Loader2 className="animate-spin" size={16} /> Posting...</> : 'Post Review'}
              </button>
            </form>
          )}
        </div>

        {/* REVIEW LIST */}
        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center h-full border-2 border-dashed border-charcoal/10 rounded-xl">
              <Star size={40} className="text-charcoal/20 mb-4" />
              <h3 className="font-serif text-xl text-charcoal mb-2">No reviews yet</h3>
              <p className="text-charcoal/50 text-sm max-w-[250px]">Be the first to share your thoughts on this stunning piece.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} size={20} 
                      className={`fill-current text-[#C4A47C]`} 
                    />
                  ))}
                </div>
                <p className="text-charcoal/70 text-sm font-medium">{reviews.length} Customer {reviews.length === 1 ? 'Review' : 'Reviews'}</p>
              </div>

              {reviews.map((review) => (
                <div key={review.id} className="border-b border-charcoal/10 pb-6 last:border-0 animate-fade-in">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {review.userImage ? (
                        <img src={review.userImage} alt={review.userName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-charcoal/5 flex items-center justify-center text-charcoal/40">
                          <UserCircle size={24} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-charcoal text-sm">{review.userName}</p>
                        <p className="text-[11px] text-charcoal/40 uppercase tracking-wider mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} size={14} 
                          className={i < review.rating ? 'text-[#C4A47C] fill-[#C4A47C]' : 'text-charcoal/20'} 
                        />
                      ))}
                    </div>
                  </div>
                  {review.isHidden ? (
                    <p className="text-charcoal/40 text-sm italic py-2">This review has been hidden by the store administrator.</p>
                  ) : (
                    <p className="text-charcoal/70 text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
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
