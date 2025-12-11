import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const AnimatedCard = ({ children, className, delay = 0, hover = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } : {}}
      className={cn('transition-all duration-300', className)}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
