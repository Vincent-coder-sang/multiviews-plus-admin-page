/* eslint-disable no-unused-vars */
/** @format */

import { Button } from "@/components/ui/button";
import React from "react";
import { Link } from "react-router-dom";

const AboutUs = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="max-w-3xl w-full bg-white p-6 rounded-md shadow-md">
        <h2 className="text-3xl font-bold text-center mb-4">About Us</h2>
        <p className="text-lg text-gray-700 mb-4">
          Welcome to Our Application! We are dedicated to providing you with
          top-notch football predictions, jackpot tips, and premium services to
          enhance your betting experience.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          Our platform offers a comprehensive range of features, including:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 mb-4">
          <li>Weekly updated jackpot predictions from major platforms.</li>
          <li>
            Expert football match predictions to help you make informed bets.
          </li>
          <li>
            Subscription-based premium services with Bronze, Silver, and Gold
            plans.
          </li>
          <li>
            Easy and secure payment integration for subscription services.
          </li>
          <li>
            User-friendly interface designed to enhance your user experience.
          </li>
        </ul>
        <p className="text-lg text-gray-700 mb-4">
          Feel free to explore our platform and start winning with confidence.
          For any inquiries or support, please contact us at{" "}
          <Link to="/contact" className="text-blue-600 hover:underline">
            Contact Us
          </Link>
          .
        </p>
        <div className="flex justify-center">
          <Button className="w-40">Get Started</Button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
