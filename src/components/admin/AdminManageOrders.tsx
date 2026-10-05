import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Loader2, ArrowLeft, PackageOpen, ChevronDown, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminManageOrders = () => {
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [selectedAdminOrder, setSelectedAdminOrder] = useState<any>(null);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [successPopup, setSuccessPopup] = useState<string | null>(null);
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
          .filter((order: any) => 
            order.status !== 'Payment Timeout' && 
            order.status !== 'Pending Payment' && 
            order.status !== 'Payment Failed'
          );
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

  const handleDownloadInvoice = async (order: any) => {
    try {
      // Fetch invoice settings
      const settingsSnap = await getDoc(doc(db, 'settings', 'invoice'));
      const settings = settingsSnap.exists() ? settingsSnap.data() : {};
      
      const businessName = settings.businessName || 'Alangaram Imitation Jewellery';
      const address = settings.address || '50 Thilagar Street, Adivaram, Palani, Tamil Nadu 624601';
      const gstNumber = settings.gstNumber || '';
      const panNumber = settings.panNumber || '';
      const signatoryName = settings.signatoryName || 'Authorized Signatory';
      
      const docPdf = new jsPDF();
      const pageWidth = docPdf.internal.pageSize.getWidth();
      
      // Load Logo Image
      const img = new Image();
      img.src = '/Mock-Images/Loader Image.png';
      
      // Wait for image to load to include in PDF
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Fallback if image fails to load
      });

      // Compress logo to reduce PDF size significantly
      let compressedLogo: string | null = null;
      if (img.width > 0) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Downscale to 200px max dimension for lightweight PDF embedding
        const maxDim = 200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) { height = height * (maxDim / width); width = maxDim; }
        } else {
          if (height > maxDim) { width = width * (maxDim / height); height = maxDim; }
        }
        canvas.width = width;
        canvas.height = height;
        if (ctx) {
          ctx.fillStyle = "#FFFFFF"; // JPEG doesn't support transparency, fill white
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          compressedLogo = canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG
        }
      }

      // Header: Business Name & Title
      let xOffset = 14;
      if (compressedLogo) {
        docPdf.addImage(compressedLogo, 'JPEG', 14, 13, 12, 12);
        xOffset = 30; // Shift business name to the right of the logo
      }

      docPdf.setFontSize(20);
      docPdf.setFont('helvetica', 'bold');
      const splitBusinessName = docPdf.splitTextToSize(businessName, (pageWidth / 2) - 10);
      docPdf.text(splitBusinessName, xOffset, 18);
      
      docPdf.setFontSize(14);
      docPdf.text('Tax Invoice / Bill of Supply', pageWidth - 14, 20, { align: 'right' });
      
      docPdf.setFontSize(10);
      docPdf.setFont('helvetica', 'normal');
      docPdf.text('(Original for Recipient)', pageWidth - 14, 26, { align: 'right' });

      // Sold By / Billing Address (Left) & Shipping Address (Right)
      docPdf.setFontSize(10);
      docPdf.setFont('helvetica', 'bold');
      docPdf.text('Sold By:', 14, 40);
      docPdf.text('Shipping Address:', pageWidth - 14, 40, { align: 'right' });
      
      docPdf.setFont('helvetica', 'normal');
      
      let leftY = 46;
      docPdf.text(businessName, 14, leftY);
      leftY += 5;
      docPdf.text('alangaramimitationjewellery@gmail.com', 14, leftY);
      leftY += 5;
      
      const splitAddress = docPdf.splitTextToSize(address, pageWidth / 2 - 20);
      docPdf.text(splitAddress, 14, leftY);
      leftY += (splitAddress.length * 5);
      
      const { name, address: shippingAddr, district, state, pincode, phone } = order.customerInfo || {};
      const fullShipping = `${name}\n${shippingAddr}, ${district}\n${state} - ${pincode}\nPhone: ${phone}`;
      const splitShipping = docPdf.splitTextToSize(fullShipping, pageWidth / 2 - 20);
      
      // align: 'right' is tricky with multi-line, so we right-align the block
      let yShipping = 46;
      splitShipping.forEach((line: string) => {
        docPdf.text(line, pageWidth - 14, yShipping, { align: 'right' });
        yShipping += 5;
      });

      // Ensure we start below whichever is longer: Billing or Shipping address
      let currentY = Math.max(leftY, yShipping) + 10;
      
      // Tax Details (if present)
      if (panNumber || gstNumber) {
        docPdf.setFont('helvetica', 'bold');
        if (panNumber) {
          docPdf.text(`PAN No:`, 14, currentY);
          docPdf.setFont('helvetica', 'normal');
          docPdf.text(panNumber, 35, currentY);
          currentY += 5;
        }
        if (gstNumber) {
          docPdf.setFont('helvetica', 'bold');
          docPdf.text(`GST Registration No:`, 14, currentY);
          docPdf.setFont('helvetica', 'normal');
          docPdf.text(gstNumber, 55, currentY);
          currentY += 5;
        }
      }

      // Order Details
      currentY += 5;
      docPdf.setFont('helvetica', 'bold');
      docPdf.text(`Order Number:`, 14, currentY);
      docPdf.setFont('helvetica', 'normal');
      docPdf.text(order.orderId || '', 45, currentY);
      
      const invoiceDateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
      docPdf.setFont('helvetica', 'bold');
      docPdf.text(`Invoice Date:  ${invoiceDateStr}`, pageWidth - 14, currentY, { align: 'right' });

      currentY += 5;
      docPdf.setFont('helvetica', 'bold');
      docPdf.text(`Order Date:`, 14, currentY);
      docPdf.setFont('helvetica', 'normal');
      docPdf.text(order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A', 45, currentY);
      
      currentY += 10;

      // Fetch the actual custom Product IDs from the products collection
      const enrichedItems = await Promise.all((order.items || []).map(async (item: any) => {
        let realSku = item.productId || item.id;
        try {
          const productSnap = await getDoc(doc(db, 'products', item.id));
          if (productSnap.exists() && productSnap.data().productId) {
            realSku = productSnap.data().productId;
          }
        } catch {
          console.error('Failed to fetch product ID for', item.id, e);
        }
        return { ...item, realSku };
      }));

      // Table for Items
      const tableData = enrichedItems.map((item: any, index: number) => {
        const priceNum = Number(String(item.price || 0).replace(/[^0-9.]/g, ''));
        const qtyNum = Number(item.quantity || 1);
        
        return [
          index + 1,
          `${item.name}\nProduct ID: ${item.realSku}`,
          `Rs. ${priceNum.toLocaleString('en-IN')}`,
          qtyNum,
          `Rs. ${(priceNum * qtyNum).toLocaleString('en-IN')}`
        ];
      });

      if (order.shippingCost > 0) {
        tableData.push([
          tableData.length + 1,
          'Shipping Fee',
          `Rs. ${order.shippingCost.toLocaleString('en-IN')}`,
          1,
          `Rs. ${order.shippingCost.toLocaleString('en-IN')}`
        ]);
      }

      // @ts-ignore
      autoTable(docPdf, {
        startY: currentY,
        head: [['Sl. No', 'Description', 'Unit Price', 'Qty', 'Total Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
      });

      // @ts-ignore
      const finalY = docPdf.lastAutoTable.finalY || currentY + 20;

      // Total
      docPdf.setFontSize(10);
      docPdf.setFont('helvetica', 'bold');
      // @ts-ignore
      docPdf.text('TOTAL:', 14, finalY + 6);
      
      const totalNum = Number(String(order.totalAmount || 0).replace(/[^0-9.]/g, ''));
      docPdf.text(`Rs. ${totalNum.toLocaleString('en-IN')}`, pageWidth - 14, finalY + 6, { align: 'right' });
      
      docPdf.line(14, finalY + 8, pageWidth - 14, finalY + 8);

      // Left Footer (Notes & Policy)
      docPdf.setFontSize(9);
      docPdf.setFont('helvetica', 'bold');
      docPdf.text('Thank you for shopping with us!', 14, finalY + 16);
      docPdf.setFontSize(8);
      docPdf.setFont('helvetica', 'normal');
      docPdf.setTextColor(100, 100, 100);
      docPdf.text('Note: We do not offer returns. In case of damaged products,', 14, finalY + 22);
      docPdf.text('please contact us via WhatsApp within 24 hours of delivery.', 14, finalY + 26);
      docPdf.setTextColor(0, 0, 0);
      
      docPdf.setFont('helvetica', 'bold');
      docPdf.text('Website: alangaramimitationjewellery.vercel.app', 14, finalY + 32);

      // Signatory (Right)
      docPdf.setFontSize(10);
      docPdf.setFont('helvetica', 'bold');
      docPdf.text(`For ${businessName}:`, pageWidth - 14, finalY + 20, { align: 'right' });
      docPdf.setFont('helvetica', 'normal');
      docPdf.text(signatoryName, pageWidth - 14, finalY + 26, { align: 'right' });

      // Save
      docPdf.save(`Invoice_${order.orderId || 'Download'}.pdf`);

      // Mark as downloaded in Firestore
      if (!order.invoiceDownloaded) {
        await updateDoc(doc(db, 'orders', order.id), { invoiceDownloaded: true });
        setAdminOrders(prev => prev.map(o => o.id === order.id ? { ...o, invoiceDownloaded: true } : o));
        setSelectedAdminOrder({ ...order, invoiceDownloaded: true });
      }

    } catch {
      console.error("Error generating invoice", e);
      alert("Failed to generate PDF. Check console.");
    }
  };

  const displayedOrders = adminOrders.filter(order => {
    const matchesStatus = statusFilter === 'All Orders' || order.status === statusFilter;
    const matchesSearch = !searchQuery || (order.orderId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="animate-fade-in bg-white/40 p-4 md:p-8 rounded-2xl border border-charcoal/5 shadow-sm backdrop-blur-sm min-h-[500px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 min-w-0">
        <h2 className="font-serif text-2xl text-charcoal">Manage Orders</h2>
        {!selectedAdminOrder && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs text-charcoal/60 uppercase tracking-widest font-medium">Filter:</span>
            
            <div 
              className="relative z-50 min-w-[180px]"
              tabIndex={0}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsFilterDropdownOpen(false);
                }
              }}
            >
              <div 
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`text-[10px] md:text-sm bg-white border ${isFilterDropdownOpen ? 'border-[#C4A47C]' : 'border-charcoal/20'} rounded px-3 py-1.5 md:py-2 outline-none cursor-pointer flex justify-between items-center transition-colors w-full`}
              >
                <span className="text-charcoal font-medium">
                  {statusFilter}
                </span>
                <ChevronDown size={14} className={`text-charcoal/40 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isFilterDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-charcoal/10 rounded-md shadow-lg overflow-hidden z-[100] animate-fade-in origin-top">
                  {["All Orders", "Order Confirmed", "Shipping", "Ready to Deliver", "Delivered Successfully"].map(status => (
                    <div 
                      key={status} 
                      onClick={() => {
                        setStatusFilter(status);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`px-3 md:px-4 py-2 text-[10px] md:text-sm cursor-pointer transition-colors ${statusFilter === status ? 'bg-cream font-medium text-[#C4A47C]' : 'text-charcoal/80 hover:bg-cream/50'}`}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
      
      {!selectedAdminOrder && (
        <div className="mb-6 relative w-full md:w-1/2 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-charcoal/40 md:w-[18px] md:h-[18px]" />
          </div>
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-charcoal/10 rounded-xl pl-10 md:pl-12 pr-4 py-2.5 md:py-3 text-[10px] md:text-sm text-charcoal outline-none focus:border-[#C4A47C] transition-colors shadow-sm"
          />
        </div>
      )}

      {globalError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 shadow-sm min-w-0">
          <p className="font-medium text-[10px] md:text-sm">{globalError}</p>
        </div>
      )}

      {fetchingProducts ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C4A47C]" /></div>
      ) : selectedAdminOrder ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => setSelectedAdminOrder(null)} className="flex items-center gap-2 text-charcoal/70 hover:text-charcoal font-medium transition-colors text-[10px] md:text-sm">
              <ArrowLeft size={20} /> Back to Orders
            </button>
            
            <button 
              onClick={() => handleDownloadInvoice(selectedAdminOrder)}
              className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-[10px] md:text-sm transition-colors ${
                selectedAdminOrder.invoiceDownloaded 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-[#C4A47C] text-white hover:bg-[#A38766]'
              }`}
            >
              <Download size={16} />
              {selectedAdminOrder.invoiceDownloaded ? 'Already Downloaded (Download Again)' : 'Download Invoice'}
            </button>
          </div>
          
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
                <div 
                  className="relative z-50 min-w-[160px]"
                  tabIndex={0}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setIsStatusDropdownOpen(false);
                    }
                  }}
                >
                  <div 
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className={`text-[10px] md:text-sm bg-white border ${isStatusDropdownOpen ? 'border-[#C4A47C]' : 'border-charcoal/20'} rounded px-3 py-1.5 md:py-2.5 outline-none cursor-pointer flex justify-between items-center transition-colors w-full`}
                  >
                    <span className="text-charcoal font-medium">
                      {selectedAdminOrder.status}
                    </span>
                    <ChevronDown size={14} className={`text-charcoal/40 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isStatusDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-charcoal/10 rounded-md shadow-lg overflow-hidden z-[100] animate-fade-in origin-top">
                      {["Order Confirmed", "Shipping", "Ready to Deliver", "Delivered Successfully"].map(status => (
                        <div 
                          key={status} 
                          onClick={async () => {
                            const newStatus = status;
                            try {
                              let updateData: any = { status: newStatus };
                              await updateDoc(doc(db, 'orders', selectedAdminOrder.id), updateData);
                              const updatedOrder = { ...selectedAdminOrder, ...updateData };
                              setAdminOrders(prev => prev.map(o => o.id === selectedAdminOrder.id ? updatedOrder : o));
                              setSelectedAdminOrder(updatedOrder);
                            } catch {
                              setGlobalError('Failed to update status');
                            }
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`px-3 md:px-4 py-2 text-[10px] md:text-sm cursor-pointer transition-colors ${selectedAdminOrder.status === status ? 'bg-cream font-medium text-[#C4A47C]' : 'text-charcoal/80 hover:bg-cream/50'}`}
                        >
                          {status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

            {/* Order Tracking Injection */}
            <div className="px-4 md:px-6 pb-6 min-w-0">
              <div className="bg-[#fcfbf9] p-4 md:p-6 rounded-lg border border-[#e0d5c1]/50 mt-2">
                <p className="font-medium text-[#C4A47C] mb-3 text-sm md:text-base">Order Tracking</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    id="trackingInput"
                    placeholder="Enter Courier Tracking ID or Link" 
                    defaultValue={selectedAdminOrder.trackingId || ''}
                    className="flex-1 px-4 py-2 border border-[#e0d5c1] rounded focus:outline-none focus:border-[#C4A47C] text-sm"
                  />
                  <button 
                    onClick={async () => {
                      const val = (document.getElementById('trackingInput') as HTMLInputElement).value;
                      try {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        await updateDoc(doc(db, 'orders', selectedAdminOrder.id), { trackingId: val });
                        const updatedOrder = { ...selectedAdminOrder, trackingId: val };
                        setAdminOrders(prev => prev.map(o => o.id === selectedAdminOrder.id ? updatedOrder : o));
                        setSelectedAdminOrder(updatedOrder);
                        setSuccessPopup('Tracking ID saved successfully!');
                      } catch {
                        setGlobalError('Failed to save tracking ID');
                      }
                    }}
                    className="bg-[#C4A47C] text-white px-6 py-2 rounded text-sm hover:bg-[#b0926a] transition-colors whitespace-nowrap"
                  >
                    Save Tracking
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-charcoal/40 min-w-0">
              <PackageOpen size={48} className="mb-4 opacity-50" />
              <p>No orders found{statusFilter !== 'All Orders' ? ` for "${statusFilter}"` : ''}{searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
            </div>
          ) : (
            displayedOrders.map((order: any) => (
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
    
      {/* SUCCESS POPUP MODAL */}
      {successPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 className="text-xl font-serif text-charcoal mb-2">Success</h3>
            <p className="text-[10px] md:text-sm text-charcoal/60 mb-6 leading-relaxed">
              {successPopup}
            </p>
            <button 
              onClick={() => setSuccessPopup(null)}
              className="w-full py-2 md:py-3 text-[10px] md:text-sm font-medium text-white bg-[#C4A47C] hover:bg-[#A98C68] rounded-xl transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageOrders;
