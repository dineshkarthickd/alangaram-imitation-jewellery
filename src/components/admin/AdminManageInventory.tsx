import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AlertTriangle, Loader2, PackageOpen, ArrowLeft, Edit2, Trash2 } from 'lucide-react';

interface AdminManageInventoryProps {
  onEditProduct: (product: any) => void;
  setLowStockCount: (count: number) => void;
}

const AdminManageInventory: React.FC<AdminManageInventoryProps> = ({ onEditProduct, setLowStockCount }) => {
  const [productsList, setProductsList] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'active' | 'low' | 'out'>('all');
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

  return (
    <div className="animate-fade-in bg-white/50 p-4 sm:p-8 rounded-2xl border border-charcoal/5 shadow-sm min-h-[500px] relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-serif text-charcoal mb-2">Inventory Management</h2>
          <p className="text-charcoal/60 text-sm">Monitor stock levels and view all live products.</p>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100">
            <AlertTriangle size={18} />
            <span className="text-sm font-semibold">{lowStockCount} Items need restocking!</span>
          </div>
        )}
      </div>

      {/* Stock Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setStockFilter('all')} className={`px-4 py-2 rounded-full text-xs sm:text-sm transition-all ${stockFilter === 'all' ? 'bg-[#C4A47C] text-white' : 'bg-white border border-charcoal/10 text-charcoal/70 hover:border-[#C4A47C]'}`}>All Products</button>
        <button onClick={() => setStockFilter('active')} className={`px-4 py-2 rounded-full text-xs sm:text-sm transition-all ${stockFilter === 'active' ? 'bg-[#C4A47C] text-white' : 'bg-white border border-charcoal/10 text-charcoal/70 hover:border-[#C4A47C]'}`}>Active Stock</button>
        <button onClick={() => setStockFilter('low')} className={`px-4 py-2 rounded-full text-xs sm:text-sm transition-all ${stockFilter === 'low' ? 'bg-orange-500 text-white' : 'bg-white border border-orange-200 text-orange-600 hover:border-orange-500'}`}>Low Stock</button>
        <button onClick={() => setStockFilter('out')} className={`px-4 py-2 rounded-full text-xs sm:text-sm transition-all ${stockFilter === 'out' ? 'bg-red-500 text-white' : 'bg-white border border-red-200 text-red-600 hover:border-red-500'}`}>Out of Stock</button>
      </div>

      {globalError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 shadow-sm">
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

              <div className="bg-white border border-charcoal/10 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <img src={selectedAdminProduct.images[0]} alt={selectedAdminProduct.name} className="w-full aspect-square object-cover rounded-lg border border-charcoal/10 shadow-sm" />
                </div>
                <div className="w-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-2xl font-serif text-charcoal">{selectedAdminProduct.name}</h3>
                      {selectedAdminProduct.stock === 0 ? (
                        <span className="text-xs font-medium bg-red-100 text-red-700 px-3 py-1 rounded-full whitespace-nowrap">Out of Stock</span>
                      ) : selectedAdminProduct.stock < 3 ? (
                        <span className="text-xs font-medium bg-orange-100 text-orange-700 px-3 py-1 rounded-full whitespace-nowrap">Low Stock ({selectedAdminProduct.stock})</span>
                      ) : (
                        <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full whitespace-nowrap">In Stock ({selectedAdminProduct.stock})</span>
                      )}
                    </div>
                    <p className="text-sm text-charcoal/50 font-mono mb-4">ID: {selectedAdminProduct.productId}</p>
                    
                    <div className="space-y-3 bg-[#FAF8F5] p-4 rounded-lg border border-charcoal/5 mb-6">
                      <div className="flex justify-between">
                        <span className="text-sm text-charcoal/60">Category</span>
                        <span className="font-medium text-charcoal capitalize">{selectedAdminProduct.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-charcoal/60">Base Price</span>
                        <span className="font-medium text-charcoal">₹{selectedAdminProduct.basePrice}</span>
                      </div>
                      {selectedAdminProduct.hasOffer && (
                        <div className="flex justify-between">
                          <span className="text-sm text-charcoal/60">Offer</span>
                          <span className="font-medium text-[#C4A47C]">-{selectedAdminProduct.offerPercentage}% OFF</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t border-charcoal/10">
                        <span className="font-medium text-charcoal">Final Price</span>
                        <span className="font-bold text-lg text-[#C4A47C]">₹{selectedAdminProduct.finalPrice}</span>
                      </div>
                    </div>
                    <p className="text-sm text-charcoal/70 leading-relaxed">
                      {selectedAdminProduct.description}
                    </p>
                  </div>
                  
                  <div className="flex gap-4 mt-8 pt-6 border-t border-charcoal/10">
                    <button 
                      onClick={() => {
                        onEditProduct(selectedAdminProduct);
                        setSelectedAdminProduct(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#C4A47C] text-white py-2.5 rounded-md hover:bg-[#A98C68] transition-colors font-medium text-sm"
                    >
                      <Edit2 size={16} className="hidden sm:block" /> Edit Product
                    </button>
                    <button 
                      onClick={() => {
                        requestProductDelete(selectedAdminProduct.id, selectedAdminProduct.name);
                        setSelectedAdminProduct(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-2.5 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors font-medium text-sm"
                    >
                      <Trash2 size={16} className="hidden sm:block" /> Delete Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {productsList.filter(p => {
                if (stockFilter === 'out') return p.stock === 0;
                if (stockFilter === 'low') return p.stock > 0 && p.stock < 3;
                if (stockFilter === 'active') return p.stock >= 3;
                return true;
              }).map((product) => (
                <div 
                  key={product.id} 
                  onClick={() => setSelectedAdminProduct(product)}
                  className="bg-white border border-charcoal/10 rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="flex gap-4 flex-grow">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-cream rounded-md overflow-hidden flex-shrink-0 border border-charcoal/5">
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h3 className="font-medium text-charcoal text-sm md:text-base leading-snug line-clamp-2 pr-4">{product.name}</h3>
                      <p className="text-charcoal/50 text-xs mt-1 md:mt-1.5 font-mono">ID: {product.productId}</p>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center md:w-[220px] flex-shrink-0 border-t md:border-t-0 border-charcoal/5 pt-3 md:pt-0 mt-1 md:mt-0">
                    <div className="flex items-center gap-2 md:mb-2">
                      {product.hasOffer && <span className="text-[10px] uppercase text-charcoal/40 line-through">₹{product.basePrice}</span>}
                      <p className="font-semibold text-[#C4A47C] text-sm">₹{product.finalPrice}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs font-medium">
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
              ))}
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
            <p className="text-sm text-charcoal/60 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-charcoal">"{deleteConfirm.name}"</span>? This action cannot be undone.
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

export default AdminManageInventory;
