import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Loader2, ArrowLeft, PackageOpen } from 'lucide-react';

const AdminManageOrders = () => {
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [selectedAdminOrder, setSelectedAdminOrder] = useState<any>(null);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const ordersFetched = useRef(false);

  useEffect(() => {
    if (ordersFetched.current) return;
    ordersFetched.current = true;
    const fetchOrders = async () => {
      setFetchingProducts(true);
      setGlobalError(null);
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const loaded = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((order: any) => order.status !== 'Payment Timeout' && order.status !== 'Pending Payment');
        setAdminOrders(loaded);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setGlobalError("Failed to fetch orders from database.");
      } finally {
        setFetchingProducts(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="animate-fade-in bg-white/40 p-4 md:p-8 rounded-2xl border border-charcoal/5 shadow-sm backdrop-blur-sm min-h-[500px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 min-w-0">
        <h2 className="font-serif text-2xl text-charcoal">Manage Orders</h2>
      </div>

      {globalError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 shadow-sm min-w-0">
          <p className="font-medium text-[10px] md:text-sm">{globalError}</p>
        </div>
      )}

      {fetchingProducts ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C4A47C]" /></div>
      ) : selectedAdminOrder ? (
        <div className="space-y-6 animate-fade-in">
          <button onClick={() => setSelectedAdminOrder(null)} className="flex items-center gap-2 text-charcoal/70 hover:text-charcoal font-medium transition-colors mb-2 text-[10px] md:text-sm">
            <ArrowLeft size={20} /> Back to Orders
          </button>
          
          <div className="bg-white border border-charcoal/10 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#FAF8F5] px-4 md:px-6 py-4 border-b border-charcoal/5 flex flex-wrap gap-4 items-center justify-between min-w-0">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-charcoal/50">Order ID</p>
                <p className="font-mono text-[10px] md:text-sm font-medium text-charcoal truncate">{selectedAdminOrder.orderId}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-charcoal/50">Date</p>
                <p className="text-[10px] md:text-sm font-medium text-charcoal">{selectedAdminOrder.createdAt?.toDate ? selectedAdminOrder.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-charcoal/50">Amount</p>
                <p className="text-[10px] md:text-sm font-medium text-charcoal">₹{selectedAdminOrder.totalAmount}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-charcoal/50">Payment Mode</p>
                <p className="text-[10px] md:text-sm font-medium text-charcoal">{selectedAdminOrder.paymentMode}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-charcoal/50">Transaction ID</p>
                <p className={`text-[10px] md:text-sm font-mono font-medium truncate ${selectedAdminOrder.transactionId ? 'text-green-700' : 'text-orange-500'}`}>
                  {selectedAdminOrder.transactionId || 'Unverified'}
                </p>
              </div>
              <div className="flex flex-col gap-1 w-full md:w-auto min-w-0">
                <label className="text-[10px] uppercase tracking-widest text-charcoal/50">Status</label>
                <select
                  value={selectedAdminOrder.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      await updateDoc(doc(db, 'orders', selectedAdminOrder.id), { status: newStatus });
                      setAdminOrders(prev => prev.map(o => o.id === selectedAdminOrder.id ? { ...o, status: newStatus } : o));
                      setSelectedAdminOrder({ ...selectedAdminOrder, status: newStatus });
                    } catch (err) {
                      alert('Failed to update status');
                    }
                  }}
                  className="text-[10px] md:text-sm bg-white border border-charcoal/20 rounded px-2 py-1 md:py-2 outline-none focus:border-[#C4A47C] w-full"
                >
                  <option value="Order Confirmed">Order Confirmed</option>
                  <option value="Shipping">Shipping</option>
                  <option value="Ready to Deliver">Ready to Deliver</option>
                  <option value="Delivered Successfully">Delivered Successfully</option>
                </select>
              </div>
            </div>

            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 min-w-0">
              {/* Customer Info */}
              <div className="min-w-0 overflow-hidden">
                <h4 className="font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Customer Details</h4>
                <div className="text-[10px] md:text-sm text-charcoal/80 space-y-2 overflow-x-auto">
                  <p><span className="font-medium">Name:</span> {selectedAdminOrder.customerInfo?.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedAdminOrder.customerInfo?.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedAdminOrder.customerInfo?.phone}</p>
                  <p><span className="font-medium">Address:</span> {selectedAdminOrder.customerInfo?.address}</p>
                  <p><span className="font-medium">District:</span> {selectedAdminOrder.customerInfo?.district}</p>
                  <p><span className="font-medium">State:</span> {selectedAdminOrder.customerInfo?.state}</p>
                  <p><span className="font-medium">Pincode:</span> {selectedAdminOrder.customerInfo?.pincode}</p>
                </div>
              </div>

              {/* Items */}
              <div className="min-w-0 overflow-hidden">
                <h4 className="font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Order Items</h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 overflow-x-auto">
                  {selectedAdminOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex gap-4 min-w-0">
                      <img src={item.image} alt={item.name} className="w-12 h-12 md:w-16 md:h-16 object-cover rounded border border-charcoal/10 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] md:text-sm font-medium text-charcoal pr-2 truncate">{item.name}</p>
                        <p className="text-[10px] md:text-xs text-charcoal/60 truncate">ID: {item.id}</p>
                        <p className="text-[10px] md:text-xs text-charcoal/80 mt-1">Qty: {item.quantity} × {item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {adminOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-charcoal/40 min-w-0">
              <PackageOpen size={48} className="mb-4 opacity-50" />
              <p>No orders found.</p>
            </div>
          ) : (
            adminOrders.map((order: any) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedAdminOrder(order)}
                className="bg-white border border-charcoal/10 rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center cursor-pointer hover:shadow-md transition-all group min-w-0"
              >
                <div className="flex gap-4 flex-grow items-center min-w-0 w-full md:w-auto">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-[#FAF8F5] rounded-full flex items-center justify-center border border-charcoal/5 flex-shrink-0">
                    <PackageOpen className="text-charcoal/40 group-hover:text-[#C4A47C] transition-colors" size={20} />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-medium text-charcoal text-[12px] md:text-base leading-snug truncate">Order #{order.orderId}</h3>
                    <p className="text-charcoal/50 text-[10px] md:text-xs mt-1.5 truncate">{order.customerInfo?.name} • {order.items?.length || 0} items</p>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-[220px] flex-shrink-0 min-w-0">
                  <p className="font-semibold text-charcoal text-[12px] md:text-sm md:mb-2">₹{order.totalAmount}</p>
                  <div className="text-right min-w-0">
                    <div className="flex items-center justify-end gap-1.5 text-[10px] md:text-xs font-medium">
                      <span className={order.status === 'Cancelled' ? 'text-red-600' : 'text-green-700'}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-charcoal/50 mt-1 block">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminManageOrders;
