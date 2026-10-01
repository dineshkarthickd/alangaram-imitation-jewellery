import { useState } from 'react';
import { ImageIcon, LayoutList, MessageSquare, Package, Settings2, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminAddProduct from '../components/admin/AdminAddProduct';
import AdminManageInventory from '../components/admin/AdminManageInventory';
import AdminManageOrders from '../components/admin/AdminManageOrders';
import AdminManageReviews from '../components/admin/AdminManageReviews';
import AdminStoreSettings from '../components/admin/AdminStoreSettings';
import AdminInvoiceSettings from '../components/admin/AdminInvoiceSettings';

const AdminDashboard = () => {
  const { loading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'banner' | 'reviews' | 'orders' | 'invoice'>('upload');
  
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-12 w-full max-w-[100vw] md:max-w-7xl mx-auto min-w-0 overflow-x-hidden">
      <h1 className="text-2xl md:text-4xl font-serif text-charcoal mb-1 md:mb-2">Admin Dashboard</h1>
      <p className="text-[11px] md:text-base text-charcoal/60 mb-6 md:mb-10 border-b border-charcoal/10 pb-4 md:pb-6">Manage your products, inventory, and website settings.</p>

      <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full min-w-0">
        
        {/* Service List Sidebar */}
        <div className="w-full md:w-72 flex flex-row md:flex-col gap-2 md:space-y-3 md:flex-shrink-0 overflow-x-auto no-scrollbar pb-2 md:pb-0 min-w-0">
          <button 
            onClick={() => { 
              setActiveTab('upload'); 
              setEditingProduct(null); 
            }} 
            className={`flex flex-shrink-0 items-center gap-2 text-left px-3 md:px-5 py-2 md:py-4 rounded-lg md:rounded-xl transition-all duration-300 font-medium text-[10px] md:text-base ${activeTab === 'upload' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <ImageIcon size={14} className="md:w-[18px] md:h-[18px]" /> {editingProduct ? 'Edit' : 'Add'}
          </button>
          <button 
            onClick={() => setActiveTab('manage')} 
            className={`flex flex-shrink-0 items-center gap-2 px-3 md:px-5 py-2 md:py-4 rounded-lg md:rounded-xl transition-all duration-300 font-medium text-[10px] md:text-base ${activeTab === 'manage' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <div className="flex items-center gap-2"><LayoutList size={14} className="md:w-[18px] md:h-[18px]" /> Inventory</div>
            {lowStockCount > 0 && <span className="bg-red-500 text-white text-[8px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full animate-pulse">{lowStockCount}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('reviews')} 
            className={`flex flex-shrink-0 items-center gap-2 text-left px-3 md:px-5 py-2 md:py-4 rounded-lg md:rounded-xl transition-all duration-300 font-medium text-[10px] md:text-base ${activeTab === 'reviews' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <MessageSquare size={14} className="md:w-[18px] md:h-[18px]" /> Reviews
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`flex flex-shrink-0 items-center gap-2 text-left px-3 md:px-5 py-2 md:py-4 rounded-lg md:rounded-xl transition-all duration-300 font-medium text-[10px] md:text-base ${activeTab === 'orders' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <Package size={14} className="md:w-[18px] md:h-[18px]" /> Orders
          </button>
          <button 
            onClick={() => setActiveTab('banner')} 
            className={`flex flex-shrink-0 items-center gap-2 text-left px-3 md:px-5 py-2 md:py-4 rounded-lg md:rounded-xl transition-all duration-300 font-medium text-[10px] md:text-base ${activeTab === 'banner' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <Settings2 size={14} className="md:w-[18px] md:h-[18px]" /> Settings
          </button>
          <button 
            onClick={() => setActiveTab('invoice')} 
            className={`flex flex-shrink-0 items-center gap-2 text-left px-3 md:px-5 py-2 md:py-4 rounded-lg md:rounded-xl transition-all duration-300 font-medium text-[10px] md:text-base ${activeTab === 'invoice' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <FileText size={14} className="md:w-[18px] md:h-[18px]" /> Invoice
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'upload' && (
            <AdminAddProduct 
              editingProduct={editingProduct} 
              setEditingProduct={setEditingProduct}
              onCancelEdit={() => {
                setEditingProduct(null);
                setActiveTab('manage');
              }}
            />
          )}
          {activeTab === 'manage' && (
            <AdminManageInventory 
              onEditProduct={(product) => {
                setEditingProduct(product);
                setActiveTab('upload');
              }}
              setLowStockCount={setLowStockCount}
            />
          )}
          {activeTab === 'reviews' && <AdminManageReviews />}
          {activeTab === 'orders' && <AdminManageOrders />}
          {activeTab === 'banner' && <AdminStoreSettings />}
          {activeTab === 'invoice' && <AdminInvoiceSettings />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
