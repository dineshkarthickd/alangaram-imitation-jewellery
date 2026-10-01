
const Privacy = () => {
  return (
    <div className="pt-24 md:pt-32 pb-16 px-4 md:px-6 max-w-4xl mx-auto min-h-[70vh]">
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-serif text-charcoal mb-4">Privacy Policy</h1>
        <p className="text-[10px] md:text-xs text-charcoal/50 uppercase tracking-[0.2em]">Last updated: October 1, 2026</p>
      </div>
      
      <div className="flex flex-col gap-8 md:gap-12">
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">1. Information We Collect</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            When you purchase something from our store, as part of the buying and selling process, we collect the personal information you give us such as your name, address, phone number, and email address.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">2. How We Use Your Information</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            We use your information to fulfill orders, communicate with you about your purchase, and improve our services. We do not sell your personal data to third parties.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">3. Security</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not inappropriately lost, misused, accessed, disclosed, altered or destroyed.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">4. Payment Security</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            We use secure, verified payment gateways (like Razorpay) to process payments. We do not store your credit card or UPI details on our servers.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
