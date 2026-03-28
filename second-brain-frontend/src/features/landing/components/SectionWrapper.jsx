import React from 'react';
import { motion } from 'framer-motion';

const SectionWrapper = ({ children, className = "", id = "" }) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`relative px-6 py-16 md:py-24 lg:py-32 overflow-hidden ${className}`}
    >
      {children}
    </motion.section>
  );
};

export default SectionWrapper;
