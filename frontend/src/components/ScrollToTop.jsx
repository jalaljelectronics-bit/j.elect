import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router keeps the browser's scroll position when you navigate between
// routes, so clicking "Contact" from halfway down the Products page would drop
// you into the middle of the Contact page. This resets the scroll on every
// pathname change.
//
// Deliberately keyed on `pathname` only, NOT on `search` — that way changing
// query params (category filters, ?page=2 pagination, ?tab= on Policies)
// doesn't trigger a jump, and those pages keep handling their own scrolling.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}