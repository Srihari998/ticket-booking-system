import { useState, useEffect } from 'react';

export const useCountdown = (targetDate, onExpire) => {
  const calculateTimeLeft = () => {
    if (!targetDate) return { total: 0, minutes: 0, seconds: 0, formatted: '00:00' };
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    if (diff <= 0) {
      return { total: 0, minutes: 0, seconds: 0, formatted: '00:00' };
    }
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return { total: diff, minutes, seconds, formatted };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    if (!targetDate) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};
