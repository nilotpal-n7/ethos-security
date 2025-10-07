import React from 'react';

// Timeline Search Form Component with Dark Mode
const TimelineForm = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
        Trace a Person's Timeline
      </h2>
      <form>
        <div className="mb-4">
          <label htmlFor="fullName" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 transition duration-300"
            placeholder="Enter full name"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="dateRange" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
            Time Range (Optional)
          </label>
          <input
            type="text"
            id="dateRange"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 transition duration-300"
            placeholder="e.g., 9:30 - 10:30"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
        >
          SEARCH TIMELINE
        </button>
      </form>
    </div>
  );
};

export default TimelineForm;
