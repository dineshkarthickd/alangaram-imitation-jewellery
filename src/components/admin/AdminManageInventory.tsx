import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AlertTriangle, Loader2, PackageOpen, ArrowLeft, Edit2, Trash2, Search, ChevronDown } from 'lucide-react';

interface AdminManageInventoryProps {
  onEditProduct: (product: any) => void;
  setLowStockCount: (count: number) => void;
}

const AdminManageInventory: React.FC<AdminManageInventoryProps> = ({ onEditProduct, setLowStockCount }) => {
  const [productsList, setProductsList] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'active' | 'low' | 'out'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Forming' | 'Imitation' | 'Combo'>('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const [selectedAdminProduct, setSelectedAdminProduct] = useState<any>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setFetchingProducts(true);
      setGlobalError(null);
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProductsList(loaded);
      } catch (error) {
        console.error("Error fetching products:", error);
        setGlobalError("Failed to fetch inventory from database.");
      } finally {
        setFetchingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const lowCount = productsList.filter(p => p.stock < 3).length;
    setLowStockCount(lowCount);
  }, [productsList, setLowStockCount]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const requestProductDelete = (productId: string, productName: string) => {
    setDeleteConfirm({ id: productId, name: productName });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setGlobalError(null);
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, "products", deleteConfirm.id));
      setProductsList(prev => prev.filter(p => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting:", error);
      setGlobalError(`Failed to delete product.`);
      scrollToTop();
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const lowStockCount = productsList.filter(p => p.stock < 3).length;

  const displayedProducts = productsList.filter(p => {
    let matchesStock = true;
    if (stockFilter === 'out') matchesStock = p.stock === 0;
    if (stockFilter === 'low') matchesStock = p.stock > 0 && p.stock < 3;
    if (stockFilter === 'active') matchesStock = p.stock >= 3;
    
    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      matchesCategory = p.category?.toLowerCase() === categoryFilter.toLowerCase();
    }
    
    const matchesSearch = !searchQuery || (p.productId || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStock && matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in bg-white/50 p-4 md:p-8 rounded-2xl border border-charcoal/5 shadow-sm min-h-[500px] relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 min-w-0">
        <div className="min-w-0">
          <h2 className="text-2xl font-serif text-charcoal mb-2">Inventory Management</h2>
          <p className="text-charcoal/60 text-[10px] md:text-sm">Monitor stock levels and view all live products.</p>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 md:py-3 rounded-lg border border-red-100 min-w-0">
            <AlertTriangle size={18} />
            <span className="text-[10px] md:text-sm font-semibold">{lowStockCount} Items need restocking!</span>
          </div>
        )}
      </div>

      {/* Stock Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-3 min-w-0">
        <button onClick={() => setStockFilter('all')} className={`px-4 py-2 md:py-3 rounded-full text-[10px] md:text-sm transition-all ${stockFilter === 'all' ? 'bg-[#C4A47C] text-white' : 'bg-white border border-charcoal/10 text-charcoal/70 hover:border-[#C4A47C]'}`}>All Stock</button>
        <button onClick={() => setStockFilter('active')} className={`px-4 py-2 md:py-3 rounded-full text-[10px] md:text-sm transition-all ${stockFilter === 'active' ? 'bg-[#C4A47C] text-white' : 'bg-white border border-charcoal/10 text-charcoal/70 hover:border-[#C4A47C]'}`}>Active Stock</button>
        <button onClick={() => setStockFilter('low')} className={`px-4 py-2 md:py-3 rounded-full text-[10px] md:text-sm transition-all ${stockFilter === 'low' ? 'bg-orange-500 text-white' : 'bg-white border border-orange-200 text-orange-600 hover:border-orange-500'}`}>Low Stock</button>
        <button onClick={() => setStockFilter('out')} className={`px-4 py-2 md:py-3 rounded-full text-[10px] md:text-sm transition-all ${stockFilter === 'out' ? 'bg-red-500 text-white' : 'bg-white border border-red-200 text-red-600 hover:border-red-500'}`}>Out of Stock</button>
      </div>

      {/* Category Dropdown Filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] md:text-xs text-charcoal/60 uppercase tracking-widest font-medium">Category:</span>
        <div 
          className="relative z-40 min-w-[160px]"
          tabIndex={0}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsCategoryDropdownOpen(false);
            }
          }}
        >
          <div 
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className={`text-[10px] md:text-sm bg-white border ${isCategoryDropdownOpen ? 'border-[#C4A47C]' : 'border-charcoal/20'} rounded px-3 py-1.5 md:py-2 outline-none cursor-pointer flex justify-between items-center transition-colors w-full`}
          >
            <span className="text-charcoal font-medium">
              {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
            </span>
            <ChevronDown size={14} className={`text-charcoal/40 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {isCategoryDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-charcoal/10 rounded-md shadow-lg overflow-hidden animate-fade-in origin-top">
              {['all', 'Forming', 'Imitation', 'Combo'].map(cat => (
                <div 
                  key={cat} 
                  onClick={() => {
                    setCategoryFilter(cat as any);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={`px-3 md:px-4 py-2 text-[10px] md:text-sm cursor-pointer transition-colors ${categoryFilter === cat ? 'bg-cream font-medium text-[#C4A47C]' : 'text-charcoal/80 hover:bg-cream/50'}`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative w-full md:w-1/2 min-w-0">
        <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
          <Search size={16} className="text-charcoal/40 md:w-[18px] md:h-[18px]" />
        </div>
        <input
          type="text"
          placeholder="Search by Product ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-charcoal/10 rounded-xl pl-10 md:pl-12 pr-4 py-2.5 md:py-3 text-[10px] md:text-sm text-charcoal outline-none focus:border-[#C4A47C] transition-colors shadow-sm"
        />
      </div>

      {globalError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 shadow-sm min-w-0">
          <p className="font-medium">{globalError}</p>
        </div>
      )}

      {fetchingProducts ? (
        <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-[#C4A47C]" size={32} /></div>
      ) : productsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-charcoal/40">
          <PackageOpen size={48} className="mb-4 opacity-50" />
          <p>No products found in the database.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedAdminProduct ? (
            <div className="animate-fade-in space-y-6">
              <button onClick={() => setSelectedAdminProduct(null)} className="flex items-center gap-2 text-charcoal/70 hover:text-charcoal font-medium transition-colors mb-2">
                <ArrowLeft size={20} /> Back to Inventory
              </button>

              <div className="bg-white border border-charcoal/10 rounded-xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row gap-4 md:gap-8 min-w-0">
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <img src={selectedAdminProduct.images[0]} alt={selectedAdminProduct.name} className="w-full aspect-square object-cover rounded-lg border border-charcoal/10 shadow-sm" />
                </div>
                <div className="w-full flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-2 min-w-0">
                      <h3 className="text-2xl font-serif text-charcoal truncate w-full">{selectedAdminProduct.name}</h3>
                      {selectedAdminProduct.stock === 0 ? (
                        <span className="text-[10px] md:text-xs font-medium bg-red-100 text-red-700 px-3 py-1 rounded-full whitespace-nowrap">Out of Stock</span>
                      ) : selectedAdminProduct.stock < 3 ? (
                        <span className="text-[10px] md:text-xs font-medium bg-orange-100 text-orange-700 px-3 py-1 rounded-full whitespace-nowrap">Low Stock ({selectedAdminProduct.stock})</span>
                      ) : (
                        <span className="text-[10px] md:text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full whitespace-nowrap">In Stock ({selectedAdminProduct.stock})</span>
                      )}
                    </div>
                    <p className="text-[10px] md:text-sm text-charcoal/50 font-mono mb-4">ID: {selectedAdminProduct.productId}</p>
                    
                    <div className="space-y-3 bg-[#FAF8F5] p-4 rounded-lg border border-charcoal/5 mb-6">
                      <div className="flex justify-between min-w-0">
                        <span className="text-[10px] md:text-sm text-charcoal/60">Category</span>
                        <span className="font-medium text-charcoal capitalize text-[10px] md:text-sm">{selectedAdminProduct.category}</span>
                      </div>
                      <div className="flex justify-between min-w-0">
                        <span className="text-[10px] md:text-sm text-charcoal/60">Base Price</span>
                        <span className="font-medium text-charcoal text-[10px] md:text-sm">₹{selectedAdminProduct.basePrice}</span>
                      </div>
                      {selectedAdminProduct.hasOffer && (
                        <div className="flex justify-between min-w-0">
                          <span className="text-[10px] md:text-sm text-charcoal/60">Offer</span>
                          <span className="font-medium text-[#C4A47C] text-[10px] md:text-sm">-{selectedAdminProduct.offerPercentage}% OFF</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t border-charcoal/10 min-w-0">
                        <span className="font-medium text-charcoal text-[12px] md:text-base">Final Price</span>
                        <span className="font-bold text-base md:text-lg text-[#C4A47C]">₹{selectedAdminProduct.finalPrice}</span>
                      </div>
                    </div>
                    <p className="text-[10px] md:text-sm text-charcoal/70 leading-relaxed">
                      {selectedAdminProduct.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t border-charcoal/10 min-w-0">
                    <button 
                      onClick={() => {
                        onEditProduct(selectedAdminProduct);
                        setSelectedAdminProduct(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#C4A47C] text-white py-2 md:py-2.5 rounded-md hover:bg-[#A98C68] transition-colors font-medium text-[10px] md:text-sm"
                    >
                      <Edit2 size={16} className="block" /> Edit Product
                    </button>
                    <button 
                      onClick={() => {
                        requestProductDelete(selectedAdminProduct.id, selectedAdminProduct.name);
                        setSelectedAdminProduct(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-2 md:py-2.5 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors font-medium text-[10px] md:text-sm"
                    >
                      <Trash2 size={16} className="block" /> Delete Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-charcoal/40 min-w-0">
                  <PackageOpen size={48} className="mb-4 opacity-50" />
                  <p>No products found{searchQuery ? ` matching ID "${searchQuery}"` : ''}.</p>
                </div>
              ) : (
                displayedProducts.map((product) => (
                  <div 
                    key={product.id} 
                  onClick={() => setSelectedAdminProduct(product)}
                  className="bg-white border border-charcoal/10 rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center cursor-pointer hover:shadow-md transition-all group min-w-0"
                >
                  <div className="flex gap-4 flex-grow min-w-0 w-full md:w-auto">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-cream rounded-md overflow-hidden flex-shrink-0 border border-charcoal/5">
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h3 className="font-medium text-charcoal text-[12px] md:text-base leading-snug line-clamp-2 pr-4">{product.name}</h3>
                      <p className="text-charcoal/50 text-[10px] md:text-xs mt-1.5 font-mono">ID: {product.productId}</p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-[220px] flex-shrink-0 min-w-0">
                    <div className="flex items-center gap-2 md:mb-2 min-w-0">
                      {product.hasOffer && <span className="text-[10px] uppercase text-charcoal/40 line-through">₹{product.basePrice}</span>}
                      <p className="font-semibold text-[#C4A47C] text-[12px] md:text-sm">₹{product.finalPrice}</p>
                    </div>
                    <div className="text-right min-w-0">
                      <div className="flex items-center justify-end gap-1.5 text-[10px] md:text-xs font-medium">
                        {product.stock === 0 ? (
                          <span className="text-red-600">Out of Stock</span>
                        ) : product.stock < 3 ? (
                          <span className="text-orange-500">Low Stock ({product.stock})</span>
                        ) : (
                          <span className="text-green-700">In Stock ({product.stock})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
              Delete Product
            </h3>
            <p className="text-[10px] md:text-sm text-charcoal/60 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-charcoal">"{deleteConfirm.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full min-w-0">
              <button 
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-2 md:py-3 text-[10px] md:text-sm font-medium text-charcoal bg-charcoal/5 hover:bg-charcoal/10 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-2 md:py-3 text-[10px] md:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
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

export default AdminManageInventory;
