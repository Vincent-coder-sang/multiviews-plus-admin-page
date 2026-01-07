import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CheckEmail = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center min-h-screen px-4 bg-gray-50"
    >
      <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-50 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8 text-green-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Title & Message */}
        <h2 className="text-lg font-semibold text-gray-800">Check Your Email</h2>
        <p className="mt-1 text-sm text-gray-600">
          We’ve sent a password reset link to your email address.
        </p>

        {/* Tip box */}
        <div className="mt-5 bg-gray-50 p-3 rounded-lg border border-gray-100 text-left">
          <div className="flex items-start space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs text-gray-600 leading-relaxed">
              Didn’t receive the email? Check your spam folder or wait a few minutes.  
              You can also try resending the link.
            </p>
          </div>
        </div>

        {/* Button */}
        <div className="mt-6">
          <Link
            to="/auth/login"
            className="inline-flex justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default CheckEmail;
