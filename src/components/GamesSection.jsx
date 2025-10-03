import React from "react";
import { Wifi, WifiOff } from "lucide-react";

const GamesSection = ({ isOnline }) => {
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl sm:rounded-t-3xl shadow-sm p-4 sm:p-6 text-white text-center mx-2 sm:mx-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">🎮 Fun Games</h2>
        <p className="text-purple-100 text-sm sm:text-base">
          Real-time multiplayer games!
        </p>
        <div
          className={`flex items-center justify-center mt-2 text-xs sm:text-sm ${
            isOnline ? "text-green-200" : "text-red-200"
          }`}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="ml-1">{isOnline ? "Synced" : "Offline Mode"}</span>
        </div>
      </div>

      <div className="text-center p-6 sm:p-8 mx-2 sm:mx-0">
        <p className="text-gray-600 text-sm sm:text-base">
          Games coming soon with real-time sync! 🎮
        </p>
      </div>
    </div>
  );
};

export default GamesSection;
