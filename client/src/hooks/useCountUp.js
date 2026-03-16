import { useEffect, useRef, useState } from 'react';

const useCountUp = (end, duration = 1400) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);
  const startedRef = useRef(false);

  const trigger = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(end * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); }, []);

  return { count, trigger };
};

export default useCountUp;
