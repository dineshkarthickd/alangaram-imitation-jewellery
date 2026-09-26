import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ImageMagnifier from '../components/ImageMagnifier';
import CustomerReviews from '../components/CustomerReviews';

const mockProducts = [
  // Forming Jewellery
  { id: 1, name: "Classic Forming Necklace", price: "₹ 4,999", category: "Forming", image: "/Mock-Images/01.png", images: ["/Mock-Images/01.png", "/Mock-Images/01-1.png"], description: "An exquisite piece crafted with precision, bringing timeless elegance to your collection. The intricate detailing mimics pure gold craftsmanship." },
  { id: 2, name: "Elegant Forming Bangles", price: "₹ 2,499", category: "Forming", image: "/Mock-Images/02.png", images: ["/Mock-Images/02.png", "/Mock-Images/02-2.png"], description: "Intricately designed bangles that add a touch of grace to any traditional attire. Smooth finish and comfortable for all-day wear." },
  { id: 3, name: "Traditional Forming Jhumkas", price: "₹ 1,899", category: "Forming", image: "/Mock-Images/03.png", images: ["/Mock-Images/03.png", "/Mock-Images/03-3.png"], description: "Classic jhumkas that perfectly blend heritage design with modern craftsmanship. Lightweight yet making a bold statement." },
  { id: 4, name: "Bridal Forming Set", price: "₹ 8,999", category: "Forming", image: "/Mock-Images/04.png", images: ["/Mock-Images/04.png", "/Mock-Images/04-4.png"], description: "A majestic bridal set designed to make your special day truly unforgettable. Complete with matching earrings and premium finishing." },
  { id: 5, name: "Antique Forming Choker", price: "₹ 3,299", category: "Forming", image: "/Mock-Images/05.png", images: ["/Mock-Images/05.png", "/Mock-Images/05-5.png"], description: "A beautifully detailed antique choker that sits perfectly on the neckline. A statement piece for festive occasions." },
  
  // Imitation Jewellery
  { id: 6, name: "Designer Imitation Necklace", price: "₹ 1,499", category: "Imitation", image: "/Mock-Images/06.png", images: ["/Mock-Images/06.png", "/Mock-Images/06-6.png"], description: "A contemporary imitation necklace designed for the modern woman. Blends seamlessly with both ethnic and fusion wear." },
  { id: 7, name: "Kundan Imitation Earrings", price: "₹ 899", category: "Imitation", image: "/Mock-Images/07.png", images: ["/Mock-Images/07.png", "/Mock-Images/07-7.png"], description: "Stunning kundan-style earrings that catch the light beautifully. Intricate stone setting mimicking high-end polki designs." },
  { id: 8, name: "Temple Imitation Set", price: "₹ 2,199", category: "Imitation", image: "/Mock-Images/08.png", images: ["/Mock-Images/08.png", "/Mock-Images/08-8.png"], description: "Inspired by temple architecture, this set brings divine beauty to your look. Features traditional motifs and rich antique plating." },
  { id: 9, name: "Pearl Imitation Bangles", price: "₹ 599", category: "Imitation", image: "/Mock-Images/09.png", images: ["/Mock-Images/09.png", "/Mock-Images/09-9.png"], description: "Delicate imitation pearls elegantly arranged on beautiful bangles. Perfect for stacking or wearing as standalone pieces." },
  { id: 10, name: "Partywear Imitation Choker", price: "₹ 1,799", category: "Imitation", image: "/Mock-Images/010.png", images: ["/Mock-Images/010.png", "/Mock-Images/010-10.png"], description: "A glamorous choker piece perfectly suited for evening parties and celebrations. High shine finish and secure fastening." },
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = mockProducts.find(p => p.id === Number(id));
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Scroll to top when page loads and set initial image
  const { addToCart } = useCart();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) {
      setSelectedImage(product.images[0]);
    }
  }, [id, product]);

  const relatedProducts = mockProducts
    .filter(p => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4);
    
  if (product && relatedProducts.length < 4) {
    const extra = mockProducts
      .filter(p => p.id !== product.id && !relatedProducts.find(r => r.id === p.id))
      .slice(0, 4 - relatedProducts.length);
    relatedProducts.push(...extra);
  }

  if (!product) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-charcoal">
        <h2 className="font-serif text-3xl mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="text-sm underline uppercase tracking-widest hover:text-black">Return to Gallery</button>
      </div>
    );
  }

  const hasOffer = [1, 4, 7, 10, 11].includes(product.id);

  return (
    <div className="pt-32 pb-24 px-8 max-w-6xl mx-auto min-h-screen opacity-0 animate-page-fade">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors mb-10 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
      </button>
      
      <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-start">
        {/* Image Gallery Side */}
        <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col-reverse sm:flex-row gap-4 md:gap-6 justify-start">
          {/* Thumbnails */}
          <div className="flex sm:flex-col gap-3 w-full sm:w-[70px] md:w-[85px] flex-shrink-0 overflow-x-auto sm:overflow-y-auto no-scrollbar pb-2 sm:pb-0">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(img)}
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

          {/* Main Image */}
          <ImageMagnifier 
            src={selectedImage || product.image} 
            alt={product.name} 
            hasOffer={hasOffer}
          />
        </div>
        
        {/* Product Info Side */}
        <div className="w-full md:w-1/2 lg:w-[55%] flex flex-col justify-center pt-4 md:pt-8">
          <p className="text-xs uppercase tracking-[0.25em] text-charcoal/50 mb-3">{product.category} Jewellery</p>
          <h1 className="text-4xl md:text-5xl font-serif text-charcoal mb-4 leading-tight">{product.name}</h1>
          <div className="text-2xl text-charcoal/80 mb-8 font-light">
            {hasOffer ? (
              <div className="flex items-center gap-4">
                <span className="text-charcoal/40 line-through text-xl">₹ {Math.round(parseInt(product.price.replace(/\D/g, '')) * 1.25).toLocaleString('en-IN')}</span>
                <span className="text-[#C4A47C] font-normal">{product.price}</span>
              </div>
            ) : (
              <p>{product.price}</p>
            )}
          </div>
          
          <div className="w-16 h-[1px] bg-charcoal/20 mb-8"></div>
          
          <p className="text-charcoal/70 leading-relaxed font-light mb-10 text-[15px]">
            {product.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-auto md:mt-0">
            <button 
              onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, image: product.image })}
              className="btn-luxury btn-luxury-solid flex-1 py-4"
            >
              <ShoppingBag size={16} /> Add to Cart
            </button>
            <button 
              onClick={() => {
                addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
                navigate('/cart');
              }}
              className="btn-luxury btn-luxury-dark flex-1 py-4 bg-white/30 backdrop-blur-md"
            >
              Buy Now
            </button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-charcoal/10 text-[13px] text-charcoal/60 space-y-3 font-light">
            <p className="flex items-center gap-3"><span className="text-charcoal">✓</span> Free Shipping within India</p>
            <p className="flex items-center gap-3"><span className="text-charcoal">✓</span> 7-Day Return Policy</p>
            <p className="flex items-center gap-3"><span className="text-charcoal">✓</span> Handcrafted with premium materials</p>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <CustomerReviews />

      {/* You May Also Like Section */}
      <div className="mt-24 md:mt-32 pt-16 border-t border-charcoal/10">
        <h2 className="text-2xl md:text-3xl font-serif text-charcoal text-center mb-12">You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {relatedProducts.map(item => (
            <Link to={`/product/${item.id}`} key={item.id} className="group">
              <div className="relative aspect-[4/5] bg-[#FAF8F5] rounded-xl overflow-hidden mb-4 shadow-sm border border-charcoal/5">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="flex flex-col items-center text-center px-2">
                <h3 className="font-serif text-[14px] md:text-[15px] text-charcoal mb-1">{item.name}</h3>
                <p className="text-charcoal/70 text-[12px] md:text-[13px]">{item.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
