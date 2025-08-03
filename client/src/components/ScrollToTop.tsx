import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Прокручиваем вверх при изменении пути
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location]);

  return null;
}