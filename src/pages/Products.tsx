import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const mockProducts = [
  // Forming Jewellery (01 to 05)
  { id: 1, name: "Classic Forming Necklace", price: "₹ 4,999", category: "forming", image: "/Mock-Images/01.png" },
  { id: 2, name: "Elegant Forming Bangles", price: "₹ 2,499", category: "forming", image: "/Mock-Images/02.png" },
  { id: 3, name: "Traditional Forming Jhumkas", price: "₹ 1,899", category: "forming", image: "/Mock-Images/03.png" },
  { id: 4, name: "Bridal Forming Set", price: "₹ 8,999", category: "forming", image: "/Mock-Images/04.png" },
  { id: 5, name: "Antique Forming Choker", price: "₹ 3,299", category: "forming", image: "/Mock-Images/05.png" },
  
  // Imitation Jewellery (06 to 010)
  { id: 6, name: "Designer Imitation Necklace", price: "₹ 1,499", category: "imitation", image: "/Mock-Images/06.png" },
  { id: 7, name: "Kundan Imitation Earrings", price: "₹ 899", category: "imitation", image: "/Mock-Images/07.png" },
  { id: 8, name: "Temple Imitation Set", price: "₹ 2,199", category: "imitation", image: "/Mock-Images/08.png" },
  { id: 9, name: "Pearl Imitation Bangles", price: "₹ 599", category: "imitation", image: "/Mock-Images/09.png" },
  { id: 10, name: "Partywear Imitation Choker", price: "₹ 1,799", category: "imitation", image: "/Mock-Images/010.png" },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const { addToCart } = useCart();

  // Sync state if URL changes (e.g. clicking navbar dropdown)
  useEffect(() => {
    if (categoryParam) setActiveCategory(categoryParam);
  }, [categoryParam]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setSearchParams(cat === 'all' ? {} : { category: cat });
  };

  const filteredProducts = activeCategory === 'all' 
    ? mockProducts 
    : mockProducts.filter(p => p.category === activeCategory);

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

      {/* PRODUCT GRID */}
      <div key={activeCategory} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16 animate-page-fade">
        {filteredProducts.map(product => {
          const hasOffer = [1, 4, 7, 10, 11].includes(product.id);
          return (
          <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer flex flex-col">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F5] mb-6 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {hasOffer && (
                <div className="absolute top-4 right-4 bg-[#C4A47C] text-white text-[10px] font-bold tracking-[0.2em] px-2.5 py-1 uppercase rounded-sm z-10 shadow-sm backdrop-blur-sm bg-opacity-90">
                  20% OFF
                </div>
              )}
              
              {/* Quick Add Button */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:translate-y-4 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 w-[85%]">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image
                    });
                  }} 
                  className="btn-luxury btn-luxury-dark w-full bg-white/90 backdrop-blur-md py-3.5"
                >
                  ADD TO CART
                </button>
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <h3 className="font-serif text-lg text-charcoal mb-2">{product.name}</h3>
              <p className="text-charcoal/70 text-[15px] tracking-wide">{product.price}</p>
            </div>
          </Link>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div key={`empty-${activeCategory}`} className="text-center py-20 text-charcoal/50 font-serif text-xl animate-page-fade">
          No products found in this category.
        </div>
      )}

    </div>
  );
};

export default Products;
