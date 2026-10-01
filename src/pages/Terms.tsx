
const Terms = () => {
  return (
    <div className="pt-24 md:pt-32 pb-16 px-4 md:px-6 max-w-4xl mx-auto min-h-[70vh]">
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-serif text-charcoal mb-4">Terms & Conditions</h1>
        <p className="text-[10px] md:text-xs text-charcoal/50 uppercase tracking-[0.2em]">Last updated: October 1, 2026</p>
      </div>
      
      <div className="flex flex-col gap-8 md:gap-12">
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">1. Introduction</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            Welcome to Alangaram Imitation Jewellery. By accessing our website, you agree to these terms and conditions.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">2. Use of the Site</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            You may use our site for lawful purposes only. We reserve the right to restrict access to anyone who violates our policies.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">3. Products & Pricing</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            All prices are listed in Indian Rupees (INR) and are subject to change without notice. We make every effort to display the colors and images of our products accurately, but we cannot guarantee that your computer monitor's display will be accurate.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">4. Payments</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            We process payments securely through our authorized payment gateways. By placing an order, you confirm that the payment details provided are valid and accurate.
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="text-lg md:text-xl font-serif text-charcoal">5. Contact</div>
          <div className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light">
            If you have any questions regarding these terms, please contact us at alangaramimitationjewellery@gmail.com.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
