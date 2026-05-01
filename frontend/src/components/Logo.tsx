import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textSize?: string;
  subtitle?: boolean;
  animated?: boolean;
}

export default function Logo({ size = 40, showText = true, textSize = '1.1rem', subtitle = false, animated = true }: LogoProps) {
  const r1 = size * 0.38;
  const r2 = size * 0.28;
  const cx = size / 2;
  const cy = size / 2;
  const id = `logo-grad-${size}`;

  const mark = (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c6ff7" />
          <stop offset="100%" stopColor="#4834d4" />
        </radialGradient>
        <linearGradient id={`${id}-arc`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00cec9" />
          <stop offset="50%" stopColor="#a29bfe" />
          <stop offset="100%" stopColor="#fd79a8" />
        </linearGradient>
        <linearGradient id={`${id}-bolt`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#d0c8ff" stopOpacity="0.9" />
        </linearGradient>
        <filter id={`${id}-glow`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`${id}-outer-glow`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={r1 + size * 0.06} fill="none" stroke="url(#arc)" strokeWidth="0.5" strokeOpacity="0.25" />

      {/* Rotating arc */}
      <motion.circle
        cx={cx} cy={cy} r={r1}
        fill="none"
        stroke={`url(#${id}-arc)`}
        strokeWidth={size * 0.055}
        strokeLinecap="round"
        strokeDasharray={`${r1 * 1.5} ${r1 * 4.9}`}
        animate={animated ? { rotate: 360 } : {}}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Second counter-rotating arc */}
      <motion.circle
        cx={cx} cy={cy} r={r2}
        fill="none"
        stroke={`url(#${id}-arc)`}
        strokeWidth={size * 0.04}
        strokeLinecap="round"
        strokeDasharray={`${r2 * 1.2} ${r2 * 5}`}
        strokeOpacity="0.6"
        animate={animated ? { rotate: -360 } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Main circle background */}
      <circle cx={cx} cy={cy} r={size * 0.28} fill={`url(#${id}-bg)`} filter={`url(#${id}-outer-glow)`} />

      {/* Inner subtle ring */}
      <circle cx={cx} cy={cy} r={size * 0.28} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

      {/* Lightning bolt — centered, sharp */}
      <path
        d={`M${cx + size * 0.045} ${cy - size * 0.235} L${cx - size * 0.085} ${cy + size * 0.02} L${cx + size * 0.02} ${cy + size * 0.02} L${cx - size * 0.045} ${cy + size * 0.235} L${cx + size * 0.085} ${cy - size * 0.02} L${cx - size * 0.02} ${cy - size * 0.02} Z`}
        fill={`url(#${id}-bolt)`}
        filter={`url(#${id}-glow)`}
      />

      {/* Dot accent bottom-right of circle */}
      <motion.circle
        cx={cx + size * 0.22} cy={cy + size * 0.17}
        r={size * 0.04}
        fill="#00cec9"
        animate={animated ? { opacity: [1, 0.3, 1], r: [size * 0.04, size * 0.055, size * 0.04] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );

  if (!showText) return animated ? (
    <motion.div animate={{ filter: ['drop-shadow(0 0 6px rgba(108,92,231,0.6))', 'drop-shadow(0 0 18px rgba(108,92,231,0.9))', 'drop-shadow(0 0 6px rgba(108,92,231,0.6))'] }} transition={{ duration: 2.5, repeat: Infinity }}>
      {mark}
    </motion.div>
  ) : mark;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.28 }}>
      <motion.div
        animate={animated ? { filter: ['drop-shadow(0 0 6px rgba(108,92,231,0.5))', 'drop-shadow(0 0 20px rgba(108,92,231,0.9))', 'drop-shadow(0 0 6px rgba(108,92,231,0.5))'] } : {}}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        {mark}
      </motion.div>
      <div>
        <div className="logo-gradient" style={{ fontWeight: 900, fontSize: textSize, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Qphoria
        </div>
        {subtitle && <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Task Manager</div>}
      </div>
    </div>
  );
}
