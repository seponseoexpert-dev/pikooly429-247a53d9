import React from "react";

// Animated "Same Day" icon — bike, CNG auto-rickshaw + car racing across the frame
export const SameDayAnimation: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: 52,
        height: 24,
        position: "relative",
        overflow: "hidden",
        verticalAlign: "middle",
        flexShrink: 0,
      }}
      aria-hidden
    >
      <style>{`
        @keyframes sd-dash {
          0%   { transform: translateX(-130%); }
          100% { transform: translateX(160%); }
        }
        @keyframes sd-wheel {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sd-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-1px); }
        }
        .sd-track { position: absolute; inset: 0; }
        .sd-vehicle { position: absolute; bottom: 0; left: 0; will-change: transform; animation: sd-dash linear infinite; }
        .sd-vehicle.bike { animation-duration: 1.6s; animation-delay: 0s; }
        .sd-vehicle.cng  { animation-duration: 2.2s; animation-delay: 0.6s; }
        .sd-vehicle.car  { animation-duration: 2.8s; animation-delay: 1.2s; }
        .sd-wheel { transform-origin: center; transform-box: fill-box; animation: sd-wheel 0.35s linear infinite; }
        .sd-body  { animation: sd-bob 0.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        /* dashed road */
        .sd-road {
          position: absolute; left: 0; right: 0; bottom: 1px; height: 1px;
          background-image: linear-gradient(to right, hsl(var(--muted-foreground) / 0.4) 50%, transparent 50%);
          background-size: 6px 1px;
        }
      `}</style>

      <div className="sd-track">
        <div className="sd-road" />

        {/* Motorbike */}
        <svg className="sd-vehicle bike" width="22" height="16" viewBox="0 0 22 16" fill="none">
          <g className="sd-body">
            {/* frame */}
            <path d="M5 12 L9 7 L13 7 L16 12" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M9 7 L7.5 4.5" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
            {/* seat */}
            <rect x="11" y="6.5" width="3.5" height="1.2" rx="0.5" fill="#1f2937" />
            {/* rider head */}
            <circle cx="10.5" cy="3.6" r="1.4" fill="#1f2937" />
            <path d="M10.5 4.5 L10.5 7" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          {/* wheels */}
          <circle className="sd-wheel" cx="5" cy="12.5" r="2.6" stroke="#1f2937" strokeWidth="1.3" fill="#fff" />
          <circle className="sd-wheel" cx="16" cy="12.5" r="2.6" stroke="#1f2937" strokeWidth="1.3" fill="#fff" />
          <circle cx="5" cy="12.5" r="0.6" fill="#1f2937" />
          <circle cx="16" cy="12.5" r="0.6" fill="#1f2937" />
        </svg>

        {/* CNG auto-rickshaw (green) */}
        <svg className="sd-vehicle cng" width="24" height="18" viewBox="0 0 24 18" fill="none">
          <g className="sd-body">
            {/* roof */}
            <path d="M5 5 Q12 2 19 5 L19 9 L5 9 Z" fill="#16a34a" />
            {/* body */}
            <path d="M3 13 L4 9 H20 L21 13 V15 H3 Z" fill="#facc15" />
            {/* windscreen */}
            <path d="M6 9 L7 6 H17 L18 9 Z" fill="#dbeafe" opacity="0.85" />
            {/* divider */}
            <rect x="11.5" y="6" width="0.8" height="3" fill="#16a34a" />
            {/* headlight */}
            <circle cx="20" cy="11.5" r="0.7" fill="#fde68a" stroke="#a16207" strokeWidth="0.3" />
          </g>
          {/* wheels */}
          <circle className="sd-wheel" cx="6" cy="15.5" r="2.2" fill="#1f2937" />
          <circle className="sd-wheel" cx="18" cy="15.5" r="2.2" fill="#1f2937" />
          <circle cx="6" cy="15.5" r="0.7" fill="#9ca3af" />
          <circle cx="18" cy="15.5" r="0.7" fill="#9ca3af" />
        </svg>

        {/* Private car (sedan) */}
        <svg className="sd-vehicle car" width="28" height="16" viewBox="0 0 28 16" fill="none">
          <g className="sd-body">
            {/* roof */}
            <path d="M7 7 Q9 3.5 14 3.5 Q19 3.5 22 7 Z" fill="#2563eb" />
            {/* body */}
            <path d="M2 12 L4 7 H24 L26 10 V13 H2 Z" fill="#3b82f6" />
            {/* windows */}
            <path d="M8 7 Q10 4.5 14 4.5 L14 7 Z" fill="#dbeafe" opacity="0.9" />
            <path d="M14 4.5 Q18 4.5 21 7 L14 7 Z" fill="#dbeafe" opacity="0.9" />
            {/* headlight */}
            <rect x="24.5" y="9" width="1.3" height="1.3" rx="0.3" fill="#fde68a" />
            {/* door line */}
            <path d="M14 7 L14 12" stroke="#1e40af" strokeWidth="0.5" />
          </g>
          {/* wheels */}
          <circle className="sd-wheel" cx="7" cy="13.5" r="2.2" fill="#1f2937" />
          <circle className="sd-wheel" cx="21" cy="13.5" r="2.2" fill="#1f2937" />
          <circle cx="7" cy="13.5" r="0.7" fill="#d1d5db" />
          <circle cx="21" cy="13.5" r="0.7" fill="#d1d5db" />
        </svg>
      </div>
    </span>
  );
};

// Animated "Next Day" calendar icon — shows tomorrow's date with a subtle pulse
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
        flexShrink: 0,
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
