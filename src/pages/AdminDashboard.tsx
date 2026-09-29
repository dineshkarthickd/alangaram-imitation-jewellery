import { useState } from 'react';
import { ImageIcon, LayoutList, MessageSquare, Package, Settings2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminAddProduct from '../components/admin/AdminAddProduct';
import AdminManageInventory from '../components/admin/AdminManageInventory';
import AdminManageOrders from '../components/admin/AdminManageOrders';
import AdminManageReviews from '../components/admin/AdminManageReviews';
import AdminStoreSettings from '../components/admin/AdminStoreSettings';

const AdminDashboard = () => {
  const { loading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'banner' | 'reviews' | 'orders'>('upload');
  
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen pt-32 pb-24 px-12 max-w-7xl mx-auto">
      <h1 className="text-4xl font-serif text-charcoal mb-2">Admin Dashboard</h1>
      <p className="text-charcoal/60 mb-10 border-b border-charcoal/10 pb-6">Manage your products, inventory, and website settings.</p>

      <div className="flex flex-row gap-12">
        
        {/* Service List Sidebar */}
        <div className="w-72 flex flex-col space-y-3 flex-shrink-0">
          <button 
            onClick={() => { 
              setActiveTab('upload'); 
              setEditingProduct(null); 
            }} 
            className={`flex items-center gap-3 text-left px-5 py-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'upload' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <ImageIcon size={18} /> {editingProduct ? 'Edit Product' : 'Add New Product'}
          </button>
          <button 
            onClick={() => setActiveTab('manage')} 
            className={`flex items-center justify-between px-5 py-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'manage' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <div className="flex items-center gap-3"><LayoutList size={18} /> Manage Inventory</div>
            {lowStockCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">{lowStockCount}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('reviews')} 
            className={`flex items-center gap-3 text-left px-5 py-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'reviews' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <MessageSquare size={18} /> Manage Reviews
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`flex items-center gap-3 text-left px-5 py-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'orders' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <Package size={18} /> Manage Orders
          </button>
          <button 
            onClick={() => setActiveTab('banner')} 
            className={`flex items-center gap-3 text-left px-5 py-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'banner' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <Settings2 size={18} /> Store Settings
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === 'upload' && (
            <AdminAddProduct 
              editingProduct={editingProduct} 
              setEditingProduct={setEditingProduct} 
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
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
