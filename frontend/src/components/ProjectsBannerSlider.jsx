import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    id: 'university',
    slideImage: 'https://res.cloudinary.com/r2fk1fws/image/upload/v1785257054/WhatsApp_Image_2026-07-28_at_1.00.37_PM_1_w93z0n.jpg',
    link: '/projects?category=University',
  },
  {
    id: 'commercial',
    slideImage: 'https://res.cloudinary.com/r2fk1fws/image/upload/v1785258413/WhatsApp_Image_2026-07-28_at_1.16.30_PM_hje6rb.jpg',
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

  const handleSlideClick = (link) => {
    navigate(link);
    // Let the route/query update happen, then scroll past the slider
    setTimeout(() => {
      const grid = document.querySelector('.project-grid-3col, .projects-toolbar');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <div className="projects-slider">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className={`projects-slide${i === active ? ' active' : ''}`}
          style={slide.slideImage ? { backgroundImage: `url(${slide.slideImage})` } : undefined}
          onClick={() => handleSlideClick(slide.link)}
        >
          <div className="projects-slide-veil" />
        </div>
      ))}

      <div className="projects-slide-dots">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            className={`projects-slide-dot${i === active ? ' active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setActive(i);
            }}
            aria-label={`Show slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}