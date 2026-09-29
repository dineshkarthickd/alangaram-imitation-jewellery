import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Loader2, MessageSquare, Star, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';

const AdminManageReviews = () => {
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const reviewsFetched = useRef(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, productId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reviewsFetched.current) return;
    reviewsFetched.current = true;

    const fetchAllReviews = async () => {
      setFetchingProducts(true);
      setGlobalError(null);
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const products = productsSnap.docs.map(d => ({ id: d.id, name: d.data().name }));

        const reviewPromises = products.map(p =>
          getDocs(collection(db, 'products', p.id, 'reviews')).then(snap =>
            snap.docs.map(r => ({
              reviewId: r.id,
              productId: p.id,
              productName: p.name,
              ...r.data()
            }))
          )
        );
        const reviewArrays = await Promise.all(reviewPromises);
        const fetchedReviews: any[] = reviewArrays.flat();

        fetchedReviews.sort((a, b) => {
          const toMs = (v: any) => v?.toMillis?.() ?? new Date(v).getTime();
          return toMs(b.createdAt) - toMs(a.createdAt);
        });

        setAllReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setGlobalError("Failed to fetch reviews from database.");
      } finally {
        setFetchingProducts(false);
      }
    };
    fetchAllReviews();
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleToggleHideReview = async (productId: string, reviewId: string, currentHidden: boolean) => {
    setGlobalError(null);
    try {
      await updateDoc(doc(db, 'products', productId, 'reviews', reviewId), {
        isHidden: !currentHidden
      });
      setAllReviews(prev => prev.map(r => r.reviewId === reviewId ? { ...r, isHidden: !currentHidden } : r));
    } catch (error) {
      console.error("Error updating review visibility:", error);
      setGlobalError("Failed to update review visibility.");
      scrollToTop();
    }
  };

  const requestReviewDelete = (productId: string, reviewId: string) => {
    setDeleteConfirm({ id: reviewId, productId });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setGlobalError(null);
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'products', deleteConfirm.productId, 'reviews', deleteConfirm.id));
      setAllReviews(prev => prev.filter(r => r.reviewId !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting review:", error);
      setGlobalError(`Failed to delete review.`);
      scrollToTop();
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in bg-white/50 p-8 rounded-2xl border border-charcoal/5 shadow-sm min-h-[500px] relative">
      <div className="flex flex-row justify-between items-end gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-serif text-charcoal mb-2">Review Management</h2>
          <p className="text-charcoal/60 text-sm">Monitor, hide, and remove customer reviews across all products.</p>
        </div>
      </div>

      {globalError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 shadow-sm">
          <p className="font-medium">{globalError}</p>
        </div>
      )}

      {fetchingProducts ? (
        <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-[#C4A47C]" size={32} /></div>
      ) : allReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-charcoal/40">
          <MessageSquare size={48} className="mb-4 opacity-50" />
          <p>No customer reviews have been posted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allReviews.map((review) => (
            <div key={review.reviewId} className={`p-5 rounded-xl border transition-all ${review.isHidden ? 'bg-charcoal/5 border-charcoal/10 opacity-70' : 'bg-white border-charcoal/5 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-bold text-charcoal">{review.productName}</p>
                  <p className="text-xs text-charcoal/50 mt-1">Review by <span className="font-semibold text-charcoal/80">{review.userName}</span> on {new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < review.rating ? 'text-[#C4A47C] fill-[#C4A47C]' : 'text-charcoal/20'} />
                  ))}
                </div>
              </div>
              
              <p className="text-charcoal/80 text-sm italic mb-4">"{review.comment}"</p>
              
              <div className="flex items-center justify-between border-t border-charcoal/5 pt-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${review.isHidden ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                  {review.isHidden ? 'Hidden from Public' : 'Visible on Store'}
                </span>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleHideReview(review.productId, review.reviewId, review.isHidden)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${review.isHidden ? 'bg-[#C4A47C]/10 text-[#C4A47C] hover:bg-[#C4A47C]/20' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                  >
                    {review.isHidden ? <><Eye size={14} /> Unhide</> : <><EyeOff size={14} /> Hide</>}
                  </button>
                  <button 
                    onClick={() => requestReviewDelete(review.productId, review.reviewId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-serif text-charcoal mb-2">
              Delete Review
            </h3>
            <p className="text-sm text-charcoal/60 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this review? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-medium text-charcoal bg-charcoal/5 hover:bg-charcoal/10 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageReviews;
