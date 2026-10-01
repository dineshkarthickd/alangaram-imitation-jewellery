import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Loader2, Heart, ChevronDown } from 'lucide-react';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  
  const activeCategory = categoryParam;
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [subCategoryFilter, setSubCategoryFilter] = useState('All Types');
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);

  // Fetch real products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const liveProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(liveProducts);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSearchParams(cat === 'all' ? {} : { category: cat });
    setSubCategoryFilter('All Types'); // Reset subcategory when main category changes
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || (p.category && p.category.toLowerCase() === activeCategory.toLowerCase());
    const matchesSub = subCategoryFilter === 'All Types' || (p.subcategories && p.subcategories.includes(subCategoryFilter));
    return matchesCategory && matchesSub;
  });

  return (
    <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-12 lg:px-20 max-w-[1400px] mx-auto min-h-screen">
      
      {/* HEADER */}
      <div className="text-center mb-6 md:mb-16">
        <h1 className="text-2xl md:text-5xl font-serif text-charcoal mb-2.5 md:mb-6">Our Collections</h1>
        <p className="text-[12px] md:text-base text-charcoal/70 max-w-2xl mx-auto font-light leading-relaxed px-2 md:px-0">
          Explore our exquisite range of handcrafted jewellery. From the enduring elegance of forming pieces to the trendy allure of imitation and exclusive combo sets.
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col items-center gap-6 mb-8 md:mb-16">
        <div className="flex flex-wrap justify-center gap-2 md:gap-6 px-1 md:px-0">
          <button 
            onClick={() => handleCategoryChange('all')}
            className={`px-3 py-1.5 md:px-8 md:py-3 rounded-full transition-all duration-300 font-medium tracking-widest text-[9px] md:text-[13px] uppercase ${activeCategory === 'all' ? 'bg-charcoal text-white shadow-md' : 'bg-white/40 text-charcoal/60 hover:bg-white hover:text-charcoal hover:shadow-sm'}`}
          >
            All Pieces
          </button>
          <button 
            onClick={() => handleCategoryChange('forming')}
            className={`px-3 py-1.5 md:px-8 md:py-3 rounded-full transition-all duration-300 font-medium tracking-widest text-[9px] md:text-[13px] uppercase ${activeCategory === 'forming' ? 'bg-charcoal text-white shadow-md' : 'bg-white/40 text-charcoal/60 hover:bg-white hover:text-charcoal hover:shadow-sm'}`}
          >
            Forming Jewellery
          </button>
          <button 
            onClick={() => handleCategoryChange('imitation')}
            className={`px-3 py-1.5 md:px-8 md:py-3 rounded-full transition-all duration-300 font-medium tracking-widest text-[9px] md:text-[13px] uppercase ${activeCategory === 'imitation' ? 'bg-charcoal text-white shadow-md' : 'bg-white/40 text-charcoal/60 hover:bg-white hover:text-charcoal hover:shadow-sm'}`}
          >
            Imitation Jewellery
          </button>
          <button 
            onClick={() => handleCategoryChange('combo')}
            className={`px-3 py-1.5 md:px-8 md:py-3 rounded-full transition-all duration-300 font-medium tracking-widest text-[9px] md:text-[13px] uppercase ${activeCategory === 'combo' ? 'bg-charcoal text-white shadow-md' : 'bg-white/40 text-charcoal/60 hover:bg-white hover:text-charcoal hover:shadow-sm'}`}
          >
            Combo Jewellery
          </button>
        </div>

        {/* Custom Subcategory Dropdown */}
        <div 
          className="relative z-40 w-[200px]"
          tabIndex={0}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsSubCategoryDropdownOpen(false);
            }
          }}
        >
          <div 
            onClick={() => setIsSubCategoryDropdownOpen(!isSubCategoryDropdownOpen)}
            className={`text-[10px] md:text-sm bg-white/60 backdrop-blur-md border ${isSubCategoryDropdownOpen ? 'border-[#C4A47C]' : 'border-charcoal/20'} rounded-full px-4 py-2 md:py-2.5 outline-none cursor-pointer flex justify-between items-center transition-all hover:border-charcoal/40 shadow-sm`}
          >
            <span className="text-charcoal font-medium">
              {subCategoryFilter === 'All Types' ? 'Filter by Type' : subCategoryFilter}
            </span>
            <ChevronDown size={16} className={`text-charcoal/50 transition-transform ${isSubCategoryDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {isSubCategoryDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-charcoal/10 rounded-xl shadow-xl overflow-hidden animate-fade-in origin-top">
              {['All Types', 'Chain', 'Necklace', 'Earrings', 'Bangle', 'Kolusu (payal)'].map(type => (
                <div 
                  key={type} 
                  onClick={() => {
                    setSubCategoryFilter(type);
                    setIsSubCategoryDropdownOpen(false);
                  }}
                  className={`px-4 py-2.5 md:py-3 text-[10px] md:text-sm cursor-pointer transition-colors ${subCategoryFilter === type ? 'bg-[#C4A47C]/10 font-medium text-[#C4A47C]' : 'text-charcoal/80 hover:bg-cream'}`}
                >
                  {type === 'All Types' ? 'All Types' : type}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 md:py-20">
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-[#C4A47C] mb-4" />
          <p className="text-charcoal/60 font-serif text-sm md:text-lg tracking-widest uppercase">Loading Collection...</p>
        </div>
      )}

      {/* PRODUCT GRID */}
      {!loading && (
        <div key={activeCategory} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16 animate-page-fade">
          {filteredProducts.map(product => {
            const hasStock = product.stock > 0;
            
            return (
            <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F5] mb-6 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                {/* Main Image */}
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className={`absolute inset-0 w-full h-full object-cover md:mix-blend-multiply transition-all duration-700 ${product.images.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                  loading="lazy"
                />
                {/* Model Image (On Hover) */}
                {product.images.length > 1 && (
                  <img 
                    src={product.images[1]} 
                    alt={`${product.name} worn`} 
                    className="absolute inset-0 w-full h-full object-cover md:mix-blend-multiply opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                {/* Wishlist Button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    if (isInWishlist(product.id)) {
                      removeFromWishlist(product.id);
                    } else {
                      addToWishlist({
                        id: product.id,
                        name: product.name,
                        price: `₹ ${product.finalPrice}`,
                        image: product.images[0],
                        basePrice: `₹ ${product.basePrice}`,
                        hasOffer: product.hasOffer,
                        offerPercentage: product.offerPercentage,
                        stock: product.stock
                      });
                    }
                  }}
                  className="absolute top-3 left-3 bg-white/80 backdrop-blur-md p-1.5 md:p-2 rounded-full text-charcoal/60 hover:text-red-500 hover:bg-white transition-all shadow-sm z-20"
                  aria-label="Toggle wishlist"
                >
                  <Heart size={16} className={isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""} />
                </button>
                
                {/* Badges container */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10 pointer-events-none">
                  {!hasStock && (
                    <div className="bg-red-900/90 text-white text-[10px] font-bold tracking-[0.2em] px-2.5 py-1 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                      OUT OF STOCK
                    </div>
                  )}
                  {hasStock && product.hasOffer && (
                    <div className="bg-[#C4A47C] text-white text-[10px] font-bold tracking-[0.2em] px-2.5 py-1 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                      {product.offerPercentage}% OFF
                    </div>
                  )}
                </div>
                
                {/* Quick Add Button */}
                {hasStock && (
                  <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 w-[90%] md:w-[85%]">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: `₹ ${product.finalPrice}`,
                          image: product.images[0]
                        });
                      }} 
                      className="btn-luxury btn-luxury-dark w-full bg-white/90 backdrop-blur-md py-2 md:py-3.5 text-[9px] md:text-xs shadow-md"
                    >
                      ADD TO CART
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center text-center px-1 md:px-0">
                <h3 className="font-serif text-[14px] md:text-lg text-charcoal mb-1 md:mb-2 leading-snug">{product.name}</h3>
                <div className="flex items-center gap-2 md:gap-3">
                  {product.hasOffer && (
                    <span className="text-charcoal/40 text-[11px] md:text-[13px] line-through">₹ {product.basePrice}</span>
                  )}
                  <p className="text-[#C4A47C] font-semibold text-[13px] md:text-[15px] tracking-wide">₹ {product.finalPrice}</p>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div key={`empty-${activeCategory}`} className="text-center py-10 md:py-20 text-charcoal/50 font-serif text-xl animate-page-fade flex flex-col items-center">
          <div className="mb-4 md:mb-6">
            <img 
              src="/Mock-Images/Loader Image.png" 
              alt="No products" 
              className="w-16 md:w-20 h-auto object-contain opacity-100"
            />
          </div>
          <p>No products found in this category.</p>
        </div>
      )}

    </div>
  );
};

export default Products;
