import React from "react";

const Header = ({
  userProfile,
  notifications,
  showSettings,
  setShowSettings,
  showNotifications,
  setShowNotifications,
  handleLogout,
}) => {
  return (
    <div className="bg-white text-black p-2 relative border-b border-gray-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img
            src="/images/discovery-logo.png"
            alt="Discovery"
            className="h-4"
          />
          <div>
            <h1 className="text-base font-bold text-discovery-blue">
              Financial AI
            </h1>
            <p className="text-gray-600 text-xs">
              AI-powered wellness companion
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowSettings(false);
            }}
            className="relative text-discovery-blue hover:text-discovery-blue/80 transition-colors"
            title="Notifications"
          >
            <span className="text-lg">🔔</span>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowNotifications(false);
            }}
            className="text-discovery-blue hover:text-discovery-blue/80 transition-colors"
            title="Settings"
          >
            <span className="text-lg">⚙️</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-discovery-blue hover:text-discovery-blue/80 transition-colors"
            title="Logout"
          >
            <span className="text-lg">👤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
