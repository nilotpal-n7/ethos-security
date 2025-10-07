import React from 'react';
import Header from '/src/Components/Header/Header.jsx';
import Footer from '/src/Components/Footer/Footer.jsx';
import TimelineForm from '/src/Components/Timeline/Timeline.jsx';
import map_image from '/src/assets/layer3.jpg';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* The Header no longer needs the navigateTo prop */}
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
          {/* Left Column: Image */}
          <div className="flex flex-col justify-center items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
            <p className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-2">
              IIT Guwahati
            </p>
            <img
              src={map_image}
              alt="Map of IIT Guwahati"
              className="rounded-lg w-full h-auto object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/e2e8f0/4a5568?text=Map+Unavailable'; }}
            />
          </div>
          {/* Right Column: Timeline Form */}
          <div className="flex justify-center items-center">
            <TimelineForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;

