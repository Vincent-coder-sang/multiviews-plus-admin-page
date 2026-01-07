import React from "react";
import { FaFacebook, FaTwitter, FaInstagram, FaHeadset, FaExchangeAlt } from "react-icons/fa";

const UserFooter = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Grid Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h4 className="text-white text-base font-semibold mb-3">About Us</h4>
            <p className="text-[13px] leading-relaxed">
              We offer the best odds and reliable tips. Your winning journey starts here!
            </p>
            <div className="mt-4 flex items-center space-x-2">
              <div className="p-2 bg-gray-800 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2H17C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-[12px]">Customer Support</p>
                <p className="text-white text-sm font-medium">+254 708 048 110</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-base font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2">
              {["Home", "About", "Contact"].map((item, i) => (
                <li key={i}>
                  <a href="#" className="hover:text-white transition-colors text-[13px]">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white text-base font-semibold mb-3">Customer Service</h4>
            <ul className="space-y-2 text-[13px]">
              <li className="flex items-center space-x-2">
                <FaHeadset className="text-green-400" />
                <a href="#" className="hover:text-white">Help & Support</a>
              </li>
              <li className="flex items-center space-x-2">
                <FaExchangeAlt className="text-green-400" />
                <a href="#" className="hover:text-white">Returns & Exchanges</a>
              </li>
              <li>
                <a href="#" className="hover:text-white">Privacy Policy</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white text-base font-semibold mb-3">Newsletter</h4>
            <p className="text-[13px] mb-3">Get the latest updates and offers straight to your inbox.</p>
            <form className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-3 py-2 text-sm bg-gray-800 rounded-md focus:outline-none focus:ring-1 focus:ring-green-400"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-md transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-10 border-t border-gray-800 pt-5 flex flex-col sm:flex-row items-center justify-between text-[12px]">
          <p>&copy; {new Date().getFullYear()} Monster Tipsters. All rights reserved.</p>
          <div className="flex space-x-4 mt-3 sm:mt-0">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default UserFooter;
