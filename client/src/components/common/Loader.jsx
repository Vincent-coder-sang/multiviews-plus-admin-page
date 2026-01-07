/** @format */

import { motion } from "framer-motion";

const Loader = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const circleVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  const spinVariants = {
    spin: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop"
      }
    }
  };

  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          className="relative w-16 h-16"
          variants={circleVariants}
        >
          <motion.div
            className="absolute w-full h-full border-4 border-blue-500 border-t-transparent rounded-full"
            variants={spinVariants}
            animate="spin"
          />
          <motion.div
            className="absolute w-4 h-4 bg-blue-600 rounded-full"
            style={{
              top: "10%",
              left: "10%"
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        </motion.div>
        
        <motion.div 
          className="flex space-x-2"
          variants={textVariants}
        >
          <motion.span 
            className="text-lg font-medium text-gray-700"
            animate={{
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Loading
          </motion.span>
          <motion.div className="flex space-x-1">
            {[".", ".", "."].map((dot, i) => (
              <motion.span
                key={i}
                className="text-lg font-medium text-gray-700"
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                {dot}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Loader;