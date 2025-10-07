import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Login Form Component styled to match the screenshot
const LoginForm = () => {
  const navigate = useNavigate();

  // Prevents the form from reloading the page on submission
  const handleLogin = (event) => {
    event.preventDefault(); 
    // This is where you would add your authentication logic.
    // On successful login, you can navigate the user to the home page.
    console.log("Login attempt");
    navigate('/'); 
  };

  return (
    <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-xl shadow-2xl dark:bg-gray-800">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
        Login to ChronosTrace
      </h2>
      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label
            htmlFor="username"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Username
          </label>
          <input
            type="text"
            name="username"
            id="username"
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            placeholder="Enter your username"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium transition duration-300 transform hover:scale-105"
        >
          LOGIN
        </button>
        <div className="text-sm font-medium text-center text-gray-500 dark:text-gray-400">
          <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">
            Forgot Username/Password?
          </a>
          <span className="mx-2">|</span>
          <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">
            Create account
          </a>
        </div>
        <div className="text-center pt-4">
          <Link
            to="/"
            className="inline-block px-4 py-2 text-sm text-blue-700 hover:underline dark:text-blue-500"
          >
            &larr; Back to Home
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;

