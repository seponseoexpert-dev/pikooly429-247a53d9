import { motion } from "framer-motion";

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
    <motion.div
      className="relative w-12 h-12"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 rounded-full border-[3px] border-muted" />
      <div className="absolute inset-0 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
    </motion.div>
    <motion.p
      className="text-sm text-muted-foreground font-medium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      Loading...
    </motion.p>
  </div>
);

export default PageLoader;
