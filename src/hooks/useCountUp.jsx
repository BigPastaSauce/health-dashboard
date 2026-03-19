import { useState, useEffect, useRef } from 'react';

export function useCountUp(target, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (target == null || isNaN(target)) { setValue(0); return; }
    const start = 0;
    const end = Number(target);
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setValue(Number(current.toFixed(decimals)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);

  return value;
}

export function AnimatedNumber({ value, duration = 1200, decimals = 0, className = '', style = {} }) {
  const animated = useCountUp(value, duration, decimals);
  return <span className={className} style={style}>{animated}</span>;
}
