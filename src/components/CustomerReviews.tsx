import { useState } from 'react';
import { Star } from 'lucide-react';

const initialMockReviews = [
  { id: 1, name: "Priya S.", rating: 5, date: "October 12, 2024", comment: "Absolutely stunning piece! The craftsmanship is incredible, it looks exactly like pure gold. Will definitely be purchasing again." },
  { id: 2, name: "Ananya M.", rating: 4, date: "September 28, 2024", comment: "Very beautiful and elegant. The detailing is very fine. Slightly heavier than I expected, but perfect for festive wear." },
  { id: 3, name: "Kavya R.", rating: 5, date: "September 15, 2024", comment: "I received so many compliments wearing this to my cousin's wedding! The finishing is premium and the delivery was incredibly fast." }
];

const CustomerReviews = () => {
  const [reviews, setReviews] = useState(initialMockReviews);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  // Calculate Average Rating
  const averageRating = (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    
    const newReview = {
      id: Date.now(),
      name,
      rating,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      comment
    };
    
    setReviews([newReview, ...reviews]);
    setIsFormOpen(false);
    setName('');
    setComment('');
    setRating(5);
  };

  return (
    <div className="mt-16 md:mt-28 max-w-6xl mx-auto px-4 md:px-12">
      <div className="flex flex-col md:flex-row gap-10 md:gap-20 w-full min-w-0">
        
        {/* Left Column: Summary & CTA */}
        <div className="w-full md:w-1/3 flex flex-col items-center md:items-start md:sticky md:top-32 h-fit text-center md:text-left min-w-0">
          <h2 className="text-xl md:text-3xl font-serif text-charcoal mb-4 md:mb-8">Customer Reviews</h2>
          
          <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
            <span className="text-4xl md:text-6xl font-serif text-charcoal leading-none">{averageRating}</span>
            <div className="flex flex-col gap-1 md:gap-1.5 items-start">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14}
                    className="md:w-[16px] md:h-[16px]"
                    fill={i < Math.round(Number(averageRating)) ? "#C4A47C" : "transparent"} 
                    color={i < Math.round(Number(averageRating)) ? "#C4A47C" : "#D1D1D1"} 
                  />
                ))}
              </div>
              <span className="text-[8px] md:text-[10px] text-charcoal/50 uppercase tracking-[0.2em]">Based on {reviews.length} Reviews</span>
            </div>
          </div>

          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="btn-luxury btn-luxury-dark w-[80%] md:w-full py-3 md:py-3.5 bg-white/50 backdrop-blur-sm text-[9px] md:text-[10px]"
          >
            {isFormOpen ? "Cancel Review" : "Write a Review"}
          </button>
        </div>

        {/* Right Column: Form & Reviews List */}
        <div className="w-full md:w-2/3 min-w-0">
          
          {/* Review Form */}
          <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${isFormOpen ? 'max-h-[600px] mb-8 md:mb-12 opacity-100' : 'max-h-0 opacity-0'}`}>
            <form onSubmit={handleSubmit} className="bg-[#FAF8F5] p-5 md:p-8 rounded-2xl border border-charcoal/5 shadow-sm">
              <h3 className="font-serif text-[15px] md:text-xl text-charcoal mb-4 md:mb-6 text-center md:text-left">Share Your Experience</h3>
              
              <div className="mb-4 md:mb-6">
                <label className="block text-[9px] md:text-[10px] uppercase tracking-widest text-charcoal/60 mb-2 md:mb-3 text-center md:text-left">Overall Rating</label>
                <div className="flex gap-2 justify-center md:justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star size={20} className="md:w-[24px] md:h-[24px]" fill={star <= rating ? "#C4A47C" : "transparent"} color={star <= rating ? "#C4A47C" : "#D1D1D1"} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                <div>
                  <label className="block text-[9px] md:text-[10px] uppercase tracking-widest text-charcoal/60 mb-2">Your Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-transparent border-b border-charcoal/20 pb-2 text-charcoal text-[11px] md:text-[13px] focus:outline-none focus:border-[#C4A47C] transition-colors"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
              
              <div className="mb-6 md:mb-8">
                <label className="block text-[9px] md:text-[10px] uppercase tracking-widest text-charcoal/60 mb-2">Your Review</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-transparent border-b border-charcoal/20 pb-2 text-charcoal text-[11px] md:text-[13px] focus:outline-none focus:border-[#C4A47C] transition-colors resize-none leading-relaxed"
                  placeholder="Tell us what you loved about this piece..."
                />
              </div>
              
              <button type="submit" className="btn-luxury btn-luxury-solid w-full md:w-auto px-10 py-3 md:py-3.5 text-[9px] md:text-[10px]">
                Submit Review
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-8 md:space-y-10">
            {reviews.map((rev) => (
              <div key={rev.id} className="pb-8 md:pb-10 border-b border-charcoal/10 last:border-0">
                <div className="flex gap-1 mb-3 md:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      className="md:w-[14px] md:h-[14px]"
                      fill={i < rev.rating ? "#C4A47C" : "transparent"} 
                      color={i < rev.rating ? "#C4A47C" : "#D1D1D1"} 
                    />
                  ))}
                </div>
                
                <h4 className="font-serif text-[14px] md:text-[17px] text-charcoal mb-2 md:mb-3 flex items-center flex-wrap gap-2 md:gap-2.5">
                  {rev.name}
                  <span className="font-sans text-[7px] md:text-[8px] uppercase tracking-[0.2em] text-[#C4A47C] border border-[#C4A47C]/30 px-1.5 md:px-2 py-0.5 rounded-full bg-[#C4A47C]/5">
                    Verified Buyer
                  </span>
                </h4>
                
                <p className="text-charcoal/80 text-[12px] md:text-[14px] leading-relaxed font-light mb-3 md:mb-4 max-w-xl">
                  "{rev.comment}"
                </p>
                
                <span className="text-[9px] md:text-[10px] text-charcoal/40 uppercase tracking-[0.15em]">{rev.date}</span>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CustomerReviews;
