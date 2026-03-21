import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PageTransition = ({ children, location }) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 1.02
    }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const CardTransition = ({ children, delay = 0 }) => {
  const cardVariants = {
    initial: {
      opacity: 0,
      y: 30,
      scale: 0.9
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      variants={cardVariants}
      transition={{
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
    >
      {children}
    </motion.div>
  );
};

const ListTransition = ({ children, index }) => {
  const listVariants = {
    initial: {
      opacity: 0,
      x: -50
    },
    in: {
      opacity: 1,
      x: 0
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      variants={listVariants}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 50
      }}
    >
      {children}
    </motion.div>
  );
};

const FadeIn = ({ children, delay = 0, duration = 0.6 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  );
};

const SlideIn = ({ children, direction = 'left', delay = 0 }) => {
  const directions = {
    left: { x: -100, opacity: 0 },
    right: { x: 100, opacity: 0 },
    up: { y: -100, opacity: 0 },
    down: { y: 100, opacity: 0 }
  };

  return (
    <motion.div
      initial={directions[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 50 }}
    >
      {children}
    </motion.div>
  );
};

const ScaleIn = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 100, damping: 10 }}
    >
      {children}
    </motion.div>
  );
};

const StaggerContainer = ({ children, staggerDelay = 0.1 }) => {
  const containerVariants = {
    initial: {
      opacity: 0
    },
    in: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  const itemVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    in: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      variants={containerVariants}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

const LoadingSkeleton = ({ width = '100%', height = 20, borderRadius = 4 }) => {
  return (
    <motion.div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
      }}
      animate={{
        background: [
          'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
          'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.2) 100%)',
          'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)'
        ]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

export {
  PageTransition,
  CardTransition,
  ListTransition,
  FadeIn,
  SlideIn,
  ScaleIn,
  StaggerContainer,
  LoadingSkeleton
};
