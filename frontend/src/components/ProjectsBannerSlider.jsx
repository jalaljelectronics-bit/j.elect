import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Fill in each slide's images when you have them.
// slideImage = full background behind everything.
// badgeImage = separate photo shown inside the circle itself.
// Leave either empty for a plain dark fallback (no broken image).
const SLIDES = [
  {
    id: 'university',
    slideImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUAcHWPOSWR5AGzt81zIbpE6FpwB5yRE_DJUHrWBEfd4MoF7IzuPwDBuc&s=10',
    badgeImage: 'https://elysiumpro.in/wp-content/uploads/2025/06/electronic-projects-for-final-year.jpg',
    eyebrow: 'Electronics / Mechanical / IT Students',
    title: 'Final Year Projects For University Students',
    subtitle: 'We provide semester projects and final year projects, built to your exact requirements.',
    buttonLabel: 'View University Projects',
    link: '/projects?category=University',
  },
  {
    id: 'commercial',
    slideImage: '',
    badgeImage: '',
    eyebrow: 'Businesses / Startups',
    title: 'Commercial Project Solutions',
    subtitle: 'Custom-built commercial projects and systems, engineered for real-world deployment.',
    buttonLabel: 'View Commercial Projects',
    link: '/projects?category=Commercial',
  },
];

const ROTATE_MS = 5000;

export default function ProjectsBannerSlider() {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="projects-slider">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className={`projects-slide${i === active ? ' active' : ''}`}
          style={slide.slideImage ? { backgroundImage: `url(${slide.slideImage})` } : undefined}
        >
          <div className="projects-slide-veil" />
          <div
            className="projects-slide-badge"
            style={slide.badgeImage ? { backgroundImage: `url(${slide.badgeImage})` } : undefined}
          >
            <div className="projects-slide-badge-veil" />
            <div className="projects-slide-badge-content">
              <span className="projects-slide-eyebrow">{slide.eyebrow}</span>
              <h2 className="projects-slide-title">{slide.title}</h2>
              <p className="projects-slide-subtitle">{slide.subtitle}</p>
              <button className="btn-ghost projects-slide-btn" onClick={() => navigate(slide.link)}>
                {slide.buttonLabel}
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="projects-slide-dots">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            className={`projects-slide-dot${i === active ? ' active' : ''}`}
            onClick={() => setActive(i)}
            aria-label={`Show ${slide.title}`}
          />
        ))}
      </div>
    </div>
  );
}