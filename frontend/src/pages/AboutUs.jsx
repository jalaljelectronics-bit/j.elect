import { useState } from 'react';
import BorderGlow from '../components/BorderGlow';
import SpotlightCard from '../components/SpotlightCard';

const FEATURES = [
  ['Same-Day Dispatch', "Order before 3 PM and your gear ships the same day. We don't believe in waiting when you're excited about new tech."]

[  'Semester Projects' ,  'We provide professionally developed semester projects across various technologies, helping students achieve academic excellence with quality solutions and proper documentation.']  
['100% Authentic', 'We source directly from certified distributors. Counterfeits never touch our shelves. Your trust is non-negotiable.'],
  ['0% Instalments', 'Split any purchase into 3, 6, or 12 months with zero interest via EasyPaisa, JazzCash, or bank instalments.'],
  ['30-Day Returns', 'Changed your mind? Return anything within 30 days, no questions asked. Full refund, hassle-free.'],
  ['Expert Support 24/7', 'Real people, real answers — anytime. Our tech-savvy support team is on call around the clock for you.'],
];

export default function AboutUs() {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [pressedFeature, setPressedFeature] = useState(null);

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
        <section className="section" style={{ paddingTop: '64px' }}>
          <div className="section-head section-head-center">
            <h2>A Message From Our CEO</h2>
            <p style={{ maxWidth: '520px', margin: '0 auto' }}>The vision behind J. Electronics, straight from the founder.</p>
          </div>

          <BorderGlow
            backgroundColor="var(--card)"
            glowColor="190 90% 65%"
            colors={['#38bdf8', '#818cf8', '#f472b6']}
            borderRadius={22}
            glowRadius={36}
            edgeSensitivity={35}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: '36px',
                alignItems: 'center',
                padding: '40px',
              }}
              className="ceo-section-grid"
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                }}
              >
                <img
                  src="https://res.cloudinary.com/r2fk1fws/image/upload/v1784458624/nexbyte/images/gqmakxnysvk2iaqykjjy.jpg"
                  alt="Jalal Khan — CEO, J electronics"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-sub)', fontStyle: 'italic', marginBottom: '20px' }}>
                  "At J Electronics, we believe innovation is meaningful only when it solves real-world problems. Our mission is to deliver
                   high-quality electronic products, innovative FYP solutions, and reliable commercial projects that empower individuals
                    and businesses alike. We are committed to excellence, trust, and continuous innovation, 
                  ensuring every solution we provide creates lasting value. Thank you for being part of our journey toward a smarter future."
                </p>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
                  Jalal Khan
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--cyan)' }}>
                  Founder &amp; CEO, J Electronics
                </div>
              </div>
            </div>
          </BorderGlow>
        </section>

        <div className="section-divider" style={{ margin: '0 0 40px' }} />

         <section className="section" style={{ paddingTop: '0' }}>
         <div className="section-head" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', flexDirection: 'column' }}>
           <h2>Why J. Electronics?</h2>
            <p style={{ maxWidth: '520px', margin: '0 auto' }}>We're built for tech lovers who refuse to settle. Every order, every pixel, every watt — obsessively curated.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(([title, desc]) => (
              <div
                key={title}
                onMouseEnter={() => setHoveredFeature(title)}
                onMouseLeave={() => { setHoveredFeature(null); setPressedFeature(null); }}
                onMouseDown={() => setPressedFeature(title)}
                onMouseUp={() => setPressedFeature(null)}
                style={{
                  cursor: 'pointer',
                  height: '100%',
                  transform:
                    pressedFeature === title
                      ? 'translateY(-2px) scale(0.97)'
                      : hoveredFeature === title
                      ? 'translateY(-6px) scale(1.02)'
                      : 'translateY(0) scale(1)',
                  transition: 'transform 0.18s ease-out',
                  boxShadow:
                    hoveredFeature === title && pressedFeature !== title
                      ? '0 12px 28px rgba(0,0,0,0.35)'
                      : 'none',
                  borderRadius: '18px',
                }}
              >
                <BorderGlow
                  backgroundColor="var(--card)"
                  glowColor="190 90% 65%"
                  colors={['#38bdf8', '#818cf8', '#f472b6']}
                  borderRadius={18}
                  glowRadius={30}
                  edgeSensitivity={35}
                >
                  <SpotlightCard
                    spotlightColor="rgba(56, 189, 248, 0.25)"
                    className="feature-spotlight"
                  >
                    <div style={{ textAlign: 'left', padding: '32px', minHeight: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h3 style={{ fontSize: '1.15rem', marginBottom: '10px', fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text)' }}>{title}</h3>
                      <p style={{ fontSize: '0.92rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </SpotlightCard>
                </BorderGlow>
              </div>
            ))}
          </div>
        </section>

      </div>
  );
}