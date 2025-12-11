import { motion } from 'framer-motion';

const LiquidBackground = () => {
  return (
    <div className="liquid-background">
      {/* Animated gradient blobs */}
      <motion.div
        className="liquid-blob blob-1"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="liquid-blob blob-2"
        animate={{
          x: [0, -80, 0],
          y: [0, 80, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="liquid-blob blob-3"
        animate={{
          x: [0, 50, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="liquid-blob blob-4"
        animate={{
          x: [0, -100, 0],
          y: [0, -80, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Gradient overlay */}
      <div className="liquid-overlay" />
    </div>
  );
};

export default LiquidBackground;
