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
    <div className="animate-fade-in bg-white/40 p-8 rounded-2xl border border-charcoal/5 shadow-sm backdrop-blur-sm min-h-[500px]">
      <div className="flex flex-row justify-between items-center mb-8 gap-4">
        <h2 className="font-serif text-2xl text-charcoal">Manage Orders</h2>
      </div>

      {globalError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 shadow-sm">
          <p className="font-medium">{globalError}</p>
        </div>
      )}

      {fetchingProducts ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C4A47C]" /></div>
      ) : selectedAdminOrder ? (
        <div className="space-y-6 animate-fade-in">
          <button onClick={() => setSelectedAdminOrder(null)} className="flex items-center gap-2 text-charcoal/70 hover:text-charcoal font-medium transition-colors mb-2">
            <ArrowLeft size={20} /> Back to Orders
          </button>
          
          <div className="bg-white border border-charcoal/10 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#FAF8F5] px-6 py-4 border-b border-charcoal/5 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal/50">Order ID</p>
                <p className="font-mono text-sm font-medium text-charcoal">{selectedAdminOrder.orderId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal/50">Date</p>
                <p className="text-sm font-medium text-charcoal">{selectedAdminOrder.createdAt?.toDate ? selectedAdminOrder.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal/50">Amount</p>
                <p className="text-sm font-medium text-charcoal">₹{selectedAdminOrder.totalAmount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal/50">Payment Mode</p>
                <p className="text-sm font-medium text-charcoal">{selectedAdminOrder.paymentMode}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal/50">Transaction ID</p>
                <p className={`text-sm font-mono font-medium ${selectedAdminOrder.transactionId ? 'text-green-700' : 'text-orange-500'}`}>
                  {selectedAdminOrder.transactionId || 'Unverified'}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-charcoal/50">Status</label>
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
                  className="text-sm bg-white border border-charcoal/20 rounded px-2 py-1 outline-none focus:border-[#C4A47C]"
                >
                  <option value="Pending Payment">Pending Payment</option>
                  <option value="Payment Timeout">Payment Timeout</option>
                  <option value="Order Confirmed">Order Confirmed</option>
                  <option value="Shipping">Shipping</option>
                  <option value="Ready to Deliver">Ready to Deliver</option>
                  <option value="Delivered Successfully">Delivered Successfully</option>
                </select>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-8">
              {/* Customer Info */}
              <div>
                <h4 className="font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Customer Details</h4>
                <div className="text-sm text-charcoal/80 space-y-2">
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
              <div>
                <h4 className="font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Order Items</h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {selectedAdminOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded border border-charcoal/10" />
                      <div>
                        <p className="text-sm font-medium text-charcoal pr-2">{item.name}</p>
                        <p className="text-xs text-charcoal/60">ID: {item.id}</p>
                        <p className="text-xs text-charcoal/80 mt-1">Qty: {item.quantity} × {item.price}</p>
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
            <div className="flex flex-col items-center justify-center h-48 text-charcoal/40">
              <PackageOpen size={48} className="mb-4 opacity-50" />
              <p>No orders found.</p>
            </div>
          ) : (
            adminOrders.map((order: any) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedAdminOrder(order)}
                className="bg-white border border-charcoal/10 rounded-xl p-5 flex flex-row gap-4 items-center cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex gap-4 flex-grow items-center">
                  <div className="w-14 h-14 bg-[#FAF8F5] rounded-full flex items-center justify-center border border-charcoal/5 flex-shrink-0">
                    <PackageOpen className="text-charcoal/40 group-hover:text-[#C4A47C] transition-colors" size={24} />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-medium text-charcoal text-base leading-snug">Order #{order.orderId}</h3>
                    <p className="text-charcoal/50 text-xs mt-1.5">{order.customerInfo?.name} • {order.items?.length || 0} items</p>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center w-[220px] flex-shrink-0">
                  <p className="font-semibold text-charcoal text-sm mb-2">₹{order.totalAmount}</p>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-medium">
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
