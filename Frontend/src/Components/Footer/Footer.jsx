import React from 'react';

// Footer Component with Dark Mode
const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto py-4 px-4 md:px-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition duration-300">About Us</a>
        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition duration-300">Privacy Policy</a>
        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition duration-300">Terms of Service</a>
        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition duration-300">Contact</a>
      </div>
    </footer>
  );
};

export default Footer;
