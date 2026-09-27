import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Loader2 } from 'lucide-react';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  
  const activeCategory = categoryParam;
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    setActiveCategory(cat);
    setSearchParams(cat === 'all' ? {} : { category: cat });
  };

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto min-h-screen opacity-0 animate-page-fade">
      
      {/* HEADER */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-serif text-charcoal mb-6">Our Collections</h1>
        <p className="text-charcoal/70 max-w-2xl mx-auto font-light leading-relaxed">
          Explore our exquisite range of handcrafted jewellery. From the enduring elegance of forming pieces to the trendy allure of our imitation collection.
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-16">
        <button 
          onClick={() => handleCategoryChange('all')}
          className={`px-8 py-3 rounded-full transition-all duration-300 font-medium tracking-widest text-[13px] uppercase ${activeCategory === 'all' ? 'bg-charcoal text-white shadow-md' : 'bg-white/40 text-charcoal/60 hover:bg-white hover:text-charcoal hover:shadow-sm'}`}
        >
          All Pieces
        </button>
        <button 
          onClick={() => handleCategoryChange('forming')}
          className={`px-8 py-3 rounded-full transition-all duration-300 font-medium tracking-widest text-[13px] uppercase ${activeCategory === 'forming' ? 'bg-charcoal text-white shadow-md' : 'bg-white/40 text-charcoal/60 hover:bg-white hover:text-charcoal hover:shadow-sm'}`}
        >
          Forming Jewellery
        </button>
        <button 
          onClick={() => handleCategoryChange('imitation')}
          className={`px-8 py-3 rounded-full transition-all duration-300 font-medium tracking-widest text-[13px] uppercase ${activeCategory === 'imitation' ? 'bg-charcoal text-white shadow-md' : 'bg-white/40 text-charcoal/60 hover:bg-white hover:text-charcoal hover:shadow-sm'}`}
        >
          Imitation Jewellery
        </button>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#C4A47C] mb-4" />
          <p className="text-charcoal/60 font-serif text-lg tracking-widest uppercase">Loading Collection...</p>
        </div>
      )}

      {/* PRODUCT GRID */}
      {!loading && (
        <div key={activeCategory} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16 animate-page-fade">
          {filteredProducts.map(product => {
            const hasStock = product.stock > 0;
            
            return (
            <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F5] mb-6 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                {/* Main Image */}
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className={`absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-all duration-700 ${product.images.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                  loading="lazy"
                />
                {/* Model Image (On Hover) */}
                {product.images.length > 1 && (
                  <img 
                    src={product.images[1]} 
                    alt={`${product.name} worn`} 
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
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
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:translate-y-4 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 w-[85%]">
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
                      className="btn-luxury btn-luxury-dark w-full bg-white/90 backdrop-blur-md py-3.5"
                    >
                      ADD TO CART
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center text-center">
                <h3 className="font-serif text-lg text-charcoal mb-2">{product.name}</h3>
                <div className="flex items-center gap-3">
                  {product.hasOffer && (
                    <span className="text-charcoal/40 text-[13px] line-through">₹ {product.basePrice}</span>
                  )}
                  <p className="text-[#C4A47C] font-semibold text-[15px] tracking-wide">₹ {product.finalPrice}</p>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div key={`empty-${activeCategory}`} className="text-center py-20 text-charcoal/50 font-serif text-xl animate-page-fade flex flex-col items-center">
          <p>No products found in this category.</p>
        </div>
      )}

    </div>
  );
};

export default Products;
