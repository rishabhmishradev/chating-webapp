import React from "react";
import { Palette } from "lucide-react";

const CreativeZone = () => {
  return (
    <div className="p-2 sm:p-4 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 text-center mx-2 sm:mx-0">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Palette size={28} className="text-purple-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
          🎨 Creative Zone
        </h2>
        <div className="text-gray-600 space-y-2">
          <p className="text-base sm:text-lg">Creative features coming soon!</p>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 mt-3">
            <p className="font-medium text-purple-700 text-sm">
              Upcoming Features:
            </p>
            <div className="mt-2 space-y-1 text-xs sm:text-sm">
              <p>🎨 Real-time Collaborative Doodle Board</p>
              <p>😂 Meme Maker with Templates</p>
              <p>📚 Story Builder (Build stories together)</p>
              <p>🎭 Custom Avatar Creator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeZone;
