import { motion } from 'framer-motion';

export const BentoGrid = ({ children, className = '' }) => {
  return (
    <div className={`bento-grid ${className}`}>
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className = '',
  title,
  description,
  header,
  icon,
  index = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`bento-grid-item ${className}`}
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.2)" }}
    >
      {header}
      <div className="bento-content">
        {icon && (
          <motion.div
            className="bento-icon"
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.div>
        )}
        <h3 className="bento-title">
          {title}
        </h3>
        <p className="bento-description">
          {description}
        </p>
      </div>

      {/* Hover gradient effect */}
      <div className="bento-hover-gradient" />
    </motion.div>
  );
};
