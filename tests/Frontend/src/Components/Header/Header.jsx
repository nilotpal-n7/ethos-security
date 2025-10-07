import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// SVG for the logo, co-located with the Header as it's a direct dependency.
const ChronosTraceLogo = () => (
  <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
    <circle cx="50" cy="50" r="48" stroke="#FFFFFF" strokeWidth="4"/>
    <path d="M50 15V50H85" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25 75L50 50" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round"/>
    <circle cx="50" cy="50" r="8" fill="#FFFFFF"/>
  </svg>
);

// Header Component
const Header = () => {
  const location = useLocation();
  const { pathname } = location;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header>
      {/* Top bar for date and login */}
      <div className="bg-gray-800 text-white py-2 px-4 md:px-8">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <span>{today}</span>
          {/* Conditionally render the Login button if not on the /login page */}
          {pathname !== '/login' && (
            <Link 
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Main header with logo and title */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-6 px-4 md:px-8 shadow-md">
        <div className="container mx-auto flex items-center">
          <Link to="/" className="flex items-center cursor-pointer">
            <ChronosTraceLogo />
            <div>
              <h1 className="text-3xl font-bold tracking-wider">ChronosTrace</h1>
              <p className="text-blue-100">Uncover Journeys. Understand Timelines.</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
