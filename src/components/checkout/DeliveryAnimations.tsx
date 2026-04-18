import React from "react";

// Animated "Same Day" icon — bike + car running across the frame
export const SameDayAnimation: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: 28,
        height: 18,
        position: "relative",
        overflow: "hidden",
        verticalAlign: "middle",
      }}
      aria-hidden
    >
      <style>{`
        @keyframes sd-dash {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(140%); }
        }
        @keyframes sd-wheel {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .sd-vehicle { position: absolute; top: 0; left: 0; will-change: transform; animation: sd-dash 1.6s linear infinite; }
        .sd-vehicle.bike { animation-duration: 1.4s; animation-delay: 0s; }
        .sd-vehicle.car  { animation-duration: 2.1s; animation-delay: 0.7s; }
        .sd-wheel { transform-origin: center; animation: sd-wheel 0.4s linear infinite; transform-box: fill-box; }
      `}</style>

      {/* Bike */}
      <svg className="sd-vehicle bike" width="22" height="18" viewBox="0 0 22 18" fill="none">
        <circle className="sd-wheel" cx="5" cy="14" r="3" stroke="#f59e0b" strokeWidth="1.4" />
        <circle className="sd-wheel" cx="17" cy="14" r="3" stroke="#f59e0b" strokeWidth="1.4" />
        <path d="M5 14 L10 7 L14 7 L17 14" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 7 L8 4" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="11.5" cy="5" r="1.5" fill="#f59e0b" />
      </svg>

      {/* Car */}
      <svg className="sd-vehicle car" width="26" height="18" viewBox="0 0 26 18" fill="none">
        <path d="M2 13 L4 8 H18 L22 11 V14 H2 Z" fill="#f59e0b" opacity="0.9" />
        <rect x="6" y="9" width="4" height="3" fill="#fff7ed" rx="0.5" />
        <rect x="11" y="9" width="5" height="3" fill="#fff7ed" rx="0.5" />
        <circle className="sd-wheel" cx="6" cy="15" r="2.2" fill="#1f2937" />
        <circle className="sd-wheel" cx="18" cy="15" r="2.2" fill="#1f2937" />
      </svg>
    </span>
  );
};

// Animated "Next Day" calendar icon — flips to tomorrow's date
export const NextDayAnimation: React.FC<{ className?: string }> = ({ className }) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = tomorrow.getDate();
  const month = tomorrow.toLocaleString("en-US", { month: "short" });

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: 22,
        height: 22,
        verticalAlign: "middle",
        position: "relative",
      }}
      aria-hidden
      title={`${month} ${day}`}
    >
      <style>{`
        @keyframes nd-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
        .nd-cal { animation: nd-pulse 1.8s ease-in-out infinite; transform-origin: center; }
      `}</style>
      <svg className="nd-cal" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="4" width="18" height="16" rx="2.5" fill="#3b82f6" />
        <rect x="2" y="4" width="18" height="5" rx="2.5" fill="#1d4ed8" />
        <rect x="6" y="2" width="1.6" height="4" rx="0.8" fill="#1e3a8a" />
        <rect x="14.4" y="2" width="1.6" height="4" rx="0.8" fill="#1e3a8a" />
        <text
          x="11"
          y="17"
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {day}
        </text>
      </svg>
    </span>
  );
};
