import React from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { Timer } from 'lucide-react';

export const CountdownTimer = ({ expiresAt, onExpire, label = 'Seats held for' }) => {
  const timeLeft = useCountdown(expiresAt, onExpire);

  if (!expiresAt || timeLeft.total <= 0) {
    return (
      <div className="countdown-box" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
        <Timer size={18} />
        <span>Hold timer has expired</span>
      </div>
    );
  }

  return (
    <div className="countdown-box">
      <Timer size={18} />
      <span>{label} <strong>{timeLeft.formatted}</strong></span>
    </div>
  );
};
