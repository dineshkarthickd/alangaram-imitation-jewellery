import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Loader2, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ImageMagnifier from '../components/ImageMagnifier';
import ReviewSection from '../components/ReviewSection';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { doc, getDoc, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import 'swiper/css';
import 'swiper/css/pagination';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'products', id!);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setProduct(data);
        setSelectedImage(data.images[0]);

        // Fetch related products
        const qRel = query(collection(db, 'products'), where('category', '==', data.category), limit(5));
        const relSnap = await getDocs(qRel);
        setRelatedProducts(relSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== data.id).slice(0, 4));
          
        // Fetch reviews
        const qRev = query(collection(db, 'products', id!, 'reviews'), orderBy('createdAt', 'desc'));
        const revSnap = await getDocs(qRev);
        setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setProduct(null);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) fetchProductData();
  }, [id]);

  const refreshReviews = async () => {
    try {
      const qRev = query(collection(db, 'products', id!, 'reviews'), orderBy('createdAt', 'desc'));
      const revSnap = await getDocs(qRev);
      setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error refreshing reviews:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-charcoal">
        <Loader2 className="w-10 h-10 animate-spin text-[#C4A47C] mb-4" />
        <h2 className="font-serif text-xl uppercase tracking-widest text-charcoal/50">Loading Masterpiece</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-charcoal">
        <h2 className="font-serif text-3xl mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="text-sm underline uppercase tracking-widest hover:text-black">Return to Gallery</button>
      </div>
    );
  }

  const hasStock = product.stock > 0;

  return (
    <div className="pt-32 pb-24 px-8 max-w-6xl mx-auto min-h-screen opacity-0 animate-page-fade">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors mb-10 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
      </button>
      
      <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-start">
        {/* Image Gallery Side */}
        <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col-reverse sm:flex-row gap-4 md:gap-6 justify-start">
          {/* Thumbnails */}
          <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-[70px] md:w-[85px] flex-shrink-0 overflow-x-auto sm:overflow-y-auto no-scrollbar pb-2 sm:pb-0">
            {product.images.map((img: string, idx: number) => (
              <button 
                key={idx}
                onClick={() => {
                  setSelectedImage(img);
                  // @ts-ignore - Safely trigger swiper if it exists on mobile
                  if (window.productSwiper) window.productSwiper.slideTo(idx);
                }}
                className={`w-[70px] sm:w-full flex-shrink-0 aspect-[4/5] rounded-lg overflow-hidden border transition-all duration-300 ${
                  selectedImage === img ? 'border-charcoal opacity-100 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img 
                  src={img} 
                  alt={`${product.name} view ${idx + 1}`} 
                  className="w-full h-full object-cover mix-blend-multiply bg-[#FAF8F5]"
                />
              </button>
            ))}
          </div>

          {/* Main Image - Desktop (Hidden on Mobile) */}
          <div className="hidden md:block w-full">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm bg-[#FAF8F5]">
              {selectedImage && <ImageMagnifier src={selectedImage} alt={product.name} />}
              {!hasStock && (
                <div className="absolute top-4 left-4 bg-red-900/90 text-white text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 uppercase rounded-sm z-10 shadow-sm backdrop-blur-sm">
                  OUT OF STOCK
                </div>
              )}
              {hasStock && product.hasOffer && (
                <div className="absolute top-4 left-4 bg-[#C4A47C] text-white text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 uppercase rounded-sm z-10 shadow-sm backdrop-blur-sm bg-opacity-90">
                  {product.offerPercentage}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Main Image - Mobile Swipe Gallery (Hidden on Desktop) */}
          <div className="block md:hidden w-full relative">
            <Swiper
              pagination={{ clickable: true }}
              modules={[Pagination]}
              className="w-full aspect-[3/4] rounded-xl overflow-hidden shadow-sm bg-[#FAF8F5]"
              onSwiper={(swiper) => {
                // @ts-ignore
                window.productSwiper = swiper;
              }}
              onSlideChange={(swiper) => {
                setSelectedImage(product.images[swiper.activeIndex]);
              }}
            >
              {product.images.map((img: string, idx: number) => (
                <SwiperSlide key={idx}>
                  <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover mix-blend-multiply pointer-events-none" />
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
              {!hasStock && (
                <div className="bg-red-900/90 text-white text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                  OUT OF STOCK
                </div>
              )}
              {hasStock && product.hasOffer && (
                <div className="bg-[#C4A47C] text-white text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                  {product.offerPercentage}% OFF
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Info Side */}
        <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col pt-2 md:pt-8">
          <p className="text-sm tracking-widest text-charcoal/50 uppercase mb-3 flex items-center justify-between">
            {product.category} Jewellery
            <span className="font-mono text-xs">{product.productId}</span>
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-charcoal mb-3 leading-tight">{product.name}</h1>
          
          {/* Average Rating Display */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => {
                  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                  return <Star key={i} size={16} className={i < Math.round(avg) ? 'text-[#C4A47C] fill-[#C4A47C]' : 'text-charcoal/20'} />
                })}
              </div>
              <span className="text-sm text-charcoal/60">({reviews.length} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <p className="text-2xl md:text-3xl font-medium text-[#C4A47C]">₹ {product.finalPrice}</p>
            {product.hasOffer && (
              <p className="text-lg md:text-xl text-charcoal/30 line-through">₹ {product.basePrice}</p>
            )}
          </div>
          
          <div className="h-[1px] w-full bg-charcoal/10 mb-8" />
          
          <p className="text-charcoal/70 leading-relaxed mb-10 font-light text-[15px] md:text-base whitespace-pre-wrap">
            {product.description}
          </p>

          <button 
            disabled={!hasStock}
            onClick={() => {
              if (!hasStock) return;
              addToCart({
                id: product.id,
                name: product.name,
                price: `₹ ${product.finalPrice}`,
                image: product.images[0]
              });
            }} 
            className={`btn-luxury btn-luxury-solid w-full py-4 flex items-center justify-center gap-3 mb-8 ${!hasStock ? 'opacity-50 cursor-not-allowed bg-charcoal/50 border-none hover:bg-charcoal/50 hover:text-white' : ''}`}
          >
            {hasStock ? (
              <><ShoppingBag size={18} /> Add to Cart</>
            ) : (
              'OUT OF STOCK'
            )}
          </button>
          
          {hasStock && product.stock < 5 && (
            <p className="text-orange-600/80 text-sm font-medium mb-8 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              Only {product.stock} items left in stock. Hurry!
            </p>
          )}

          {/* Collapsible Details */}
          <div className="border-t border-charcoal/10">
            <details className="group [&_summary::-webkit-details-marker]:hidden" open>
              <summary className="flex items-center justify-between py-5 cursor-pointer text-charcoal">
                <span className="font-medium uppercase tracking-widest text-sm">Product Details</span>
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="text-charcoal/60 text-sm font-light leading-relaxed pb-6 animate-fade-in">
                <ul className="list-disc pl-4 space-y-2">
                  <li>Premium quality plating ensuring long-lasting shine.</li>
                  <li>Hypoallergenic materials suitable for sensitive skin.</li>
                  <li>Handcrafted finish mimicking pure gold aesthetics.</li>
                  <li>Secure and comfortable fastening mechanism.</li>
                </ul>
              </div>
            </details>
            
            <details className="group [&_summary::-webkit-details-marker]:hidden border-t border-charcoal/10">
              <summary className="flex items-center justify-between py-5 cursor-pointer text-charcoal">
                <span className="font-medium uppercase tracking-widest text-sm">Care Instructions</span>
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="text-charcoal/60 text-sm font-light leading-relaxed pb-6">
                Avoid direct contact with perfume, deodorant, and water. Store in a cool, dry place inside a ziplock bag or airtight container when not in use.
              </div>
            </details>
          </div>
        </div>
      </div>

      <ReviewSection productId={id!} reviews={reviews} onReviewAdded={refreshReviews} />

      {/* RELATED PIECES */}
      {relatedProducts.length > 0 && (
        <div className="mt-24 border-t border-charcoal/10 pt-16">
          <h2 className="text-2xl font-serif text-charcoal mb-10 text-center">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {relatedProducts.map(relProduct => {
              const relHasStock = relProduct.stock > 0;
              return (
              <Link to={`/product/${relProduct.id}`} key={relProduct.id} className="group cursor-pointer">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F5] mb-4 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                  {/* Main Image */}
                  <img 
                    src={relProduct.images[0]} 
                    alt={relProduct.name} 
                    className={`absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-all duration-700 ${relProduct.images.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                    loading="lazy"
                  />
                  {/* Model Image */}
                  {relProduct.images.length > 1 && (
                    <img 
                      src={relProduct.images[1]} 
                      alt={`${relProduct.name} worn`} 
                      className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Tags */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none z-10">
                    {!relHasStock && (
                      <div className="bg-red-900/90 text-white text-[8px] font-bold tracking-[0.2em] px-2 py-1 uppercase rounded-sm shadow-sm">
                        OUT OF STOCK
                      </div>
                    )}
                    {relHasStock && relProduct.hasOffer && (
                      <div className="bg-[#C4A47C] text-white text-[8px] font-bold tracking-[0.2em] px-2 py-1 uppercase rounded-sm shadow-sm">
                        {relProduct.offerPercentage}% OFF
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col text-center">
                  <h3 className="font-serif text-sm md:text-base text-charcoal mb-1 truncate px-2">{relProduct.name}</h3>
                  <div className="flex items-center justify-center gap-2">
                    {relProduct.hasOffer && (
                      <span className="text-charcoal/40 text-[11px] line-through">₹ {relProduct.basePrice}</span>
                    )}
                    <p className="text-[#C4A47C] text-sm md:text-[15px] font-medium">₹ {relProduct.finalPrice}</p>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
