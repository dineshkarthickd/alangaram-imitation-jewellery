
const Shipping = () => {
  return (
    <div className="pt-24 md:pt-32 pb-16 px-4 md:px-6 max-w-4xl mx-auto min-h-[70vh]">
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-serif text-charcoal mb-4">Shipping & Delivery Policy</h1>
        <p className="text-[10px] md:text-xs text-charcoal/50 uppercase tracking-[0.2em]">Last updated: October 1, 2026</p>
      </div>
      
      <div className="flex flex-col gap-8 md:gap-12">
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">1. Shipping Rates</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            We are pleased to offer <strong>free shipping on all orders delivered within Tamil Nadu</strong>. For deliveries to other states in India and all overseas/international locations, standard delivery charges will apply based on the destination and package weight.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">2. Delivery Timelines</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            For orders within Tamil Nadu, your delivery will be processed and typically reach you between <strong>7 to 10 days</strong>. For orders shipped to other states or overseas locations, the delivery time depends entirely upon the schedules of our respective delivery partners and local customs processing.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">3. Order Tracking</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            Once your order has been dispatched from our facility, we will provide you with tracking details so you can monitor the exact status of your delivery through our shipping partner's portal.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shipping;
