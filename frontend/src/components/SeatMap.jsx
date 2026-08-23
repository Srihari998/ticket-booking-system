import React from 'react';

export const SeatMap = ({
  seats = [],
  selectedSeatIds = [],
  onToggleSeat,
  myHeldSeatIds = [],
  disabled = false
}) => {
  const rowsMap = seats.reduce((acc, seat) => {
    const row = seat.rowLabel;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  const rowLabels = Object.keys(rowsMap).sort();

  return (
    <div className="seat-map-wrapper">
      <div className="screen-indicator">
        <span>STAGE / SCREEN</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '10px' }}>
        {rowLabels.map((rowLabel) => {
          const rowSeats = rowsMap[rowLabel].sort((a, b) => a.seatNumber - b.seatNumber);
          return (
            <div key={rowLabel} className="seat-row">
              <span className="row-label">{rowLabel}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isMyHold = myHeldSeatIds.includes(seat.id) || seat.isMyHold;
                  const isAvailable = seat.status === 'AVAILABLE' || isMyHold;
                  const isBooked = seat.status === 'BOOKED';
                  const isHeldByOther = seat.status === 'HELD' && !isMyHold;
                  const isPremium = seat.categoryName?.toLowerCase().includes('premium');

                  let stateClass = 'seat-available';
                  if (isPremium) stateClass += ' seat-premium';
                  if (isSelected) stateClass = 'seat-selected';
                  else if (isMyHold) stateClass = 'seat-my-hold';
                  else if (isHeldByOther) stateClass = 'seat-held';
                  else if (isBooked) stateClass = 'seat-booked';

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      className={`seat-btn ${stateClass}`}
                      disabled={disabled || (!isAvailable && !isSelected)}
                      onClick={() => onToggleSeat(seat)}
                      title={`Seat ${seat.rowLabel}${seat.seatNumber} - ${seat.categoryName} (₹${seat.price}) [${seat.status}]`}
                    >
                      {seat.seatNumber}
                    </button>
                  );
                })}
              </div>
              <span className="row-label">{rowLabel}</span>
            </div>
          );
        })}
      </div>

      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-box" style={{ background: '#e0e7ff', border: '2px solid #818cf8' }}></div>
          <span>Premium (₹)</span>
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ background: '#e2e8f0', border: '2px solid #cbd5e1' }}></div>
          <span>Standard Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ background: 'var(--primary)' }}></div>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ background: '#fef3c7', border: '2px solid #f59e0b' }}></div>
          <span>Held (Unavailable)</span>
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}></div>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};
