
const Refunds = () => {
  return (
    <div className="pt-24 md:pt-32 pb-16 px-4 md:px-6 max-w-4xl mx-auto min-h-[70vh]">
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-serif text-charcoal mb-4">Cancellation & Refund Policy</h1>
        <p className="text-[10px] md:text-xs text-charcoal/50 uppercase tracking-[0.2em]">Last updated: October 1, 2026</p>
      </div>
      
      <div className="flex flex-col gap-8 md:gap-12">
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">1. No Returns or Refunds</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            We maintain a strict "No Returns and No Refunds" policy. Once an order is placed and delivered, we do not accept returns or offer refunds for any products.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">2. Damaged Products Exception</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            The only exception to our policy is if you receive an item that is severely damaged during transit. If this happens, you must take a clear photograph or unboxing video of the damaged item immediately upon receiving the package.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">3. How to Report Damage</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            Please connect with us directly through WhatsApp at <strong>+91 63742 92001</strong> with your order details and the proof of damage. Our team will review your case directly on WhatsApp and assist you with a resolution.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Refunds;
