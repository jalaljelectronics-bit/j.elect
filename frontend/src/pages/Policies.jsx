import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const TABS = {
  privacy: {
    label: 'Privacy Policy',
    body: (
      <>
        <h3>Information We Collect</h3>
        <p>We collect the information you provide when placing an order — name, address, phone number, and email — plus basic usage data needed to keep the store running smoothly.</p>
        <h3>How We Use Your Information</h3>
        <p>Your details are used to process orders, provide support, and occasionally share relevant offers. We never sell your information to third parties.</p>
        
      </>
    ),
  },
  terms: {
    label: 'Terms of Service',
    body: (
      <>
        <h3>Disclaimer</h3>
        <p>Products are described as accurately as possible; minor variations in color or packaging may occur.</p>
        <h3>Limitations</h3>
        <p>JElectronics is not liable for indirect or incidental damages arising from the use of purchased products.</p>
        
        
      </>
    ),
  },
  returns: {
    label: 'Returns & Refunds',
    body: (
      <>
        <h3>Return Eligibility</h3>
        <p>Items may be returned within 30 days of delivery, provided they're unused and in original packaging.</p>
        <h3>Return Process</h3>
        <p>Contact support with your order number to receive a return authorization and pickup instructions.</p>
        <h3>Refund Timeline</h3>
        <p>Approved refunds are processed within 5–7 business days to your original payment method.</p>
        
        
      </>
    ),
  },
  shipping: {
    label: 'Shipping Info',
    body: (
      <>
        <h3>Shipping Rates</h3>
        <p>Free delivery on orders above Rs 25,000; a flat Rs 350 fee applies below that threshold.</p>
        <h3>Delivery Timeline</h3>
        <p>Most orders arrive within 2–3 business days depending on your city.</p>
      </>
    ),
  },
  warranty: {
    label: 'Authenticity & Warranty',
    body: (
      <>
        <h3>Our Commitment</h3>
        <p>We source directly from certified distributors — every device sold is 100% authentic.</p>
      </>
    ),
  },
};

export default function Policies() {
  const [params, setParams] = useSearchParams();
  const [active, setActive] = useState(params.get('tab') && TABS[params.get('tab')] ? params.get('tab') : 'privacy');

  const select = (key) => {
    setActive(key);
    setParams({ tab: key });
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="page-header">
        <h1>Policies</h1>
        <p>Everything you need to know about shopping with JElectronics.</p>
      </div>

      <div className="policy-tabs">
        {Object.entries(TABS).map(([key, tab]) => (
          <button key={key} className={`policy-tab${active === key ? ' active' : ''}`} onClick={() => select(key)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="policy-content">
        <h2>{TABS[active].label}</h2>
        {TABS[active].body}
      </div>
    </div>
  );
}
