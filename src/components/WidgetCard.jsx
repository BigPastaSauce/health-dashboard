import { motion } from 'framer-motion';

export default function WidgetCard({ children, title, className = '', headerRight = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-whoop-card rounded-xl border border-whoop-border p-4 h-full overflow-hidden flex flex-col ${className}`}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          {title && (
            <h3 className="text-sm font-semibold uppercase tracking-wider text-whoop-textDim">
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
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}
