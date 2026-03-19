import { motion } from 'framer-motion';

export default function WidgetCard({ children, title, className = '', headerRight = null, delay = 0, glowColor = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`group relative bg-[#12131a]/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6 h-full overflow-hidden flex flex-col ${className}`}
      style={{
        boxShadow: glowColor
          ? `0 0 30px ${glowColor}10, 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`
          : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 20px ${glowColor || 'rgba(255,255,255,0.03)'}` }} />

      {(title || headerRight) && (
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          {title && (
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {title}
            </h3>
          )}
          {headerRight && (
            <div className="flex items-center gap-2">
              {headerRight}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 flex flex-col relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
