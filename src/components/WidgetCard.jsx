import { motion } from 'framer-motion';

export default function WidgetCard({ children, title, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-whoop-card rounded-xl border border-whoop-border p-5 h-full overflow-hidden flex flex-col ${className}`}
    >
      {title && (
        <h3 className="text-sm font-semibold uppercase tracking-wider text-whoop-textDim mb-4">
          {title}
        </h3>
      )}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </motion.div>
  );
}
