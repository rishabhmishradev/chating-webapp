import React, { useState } from "react";
import { ref, set, serverTimestamp } from "firebase/database";
import { rtdb } from "../firebase/config";
import { Lock, Wifi, WifiOff } from "lucide-react";

const AuthScreen = ({ setCurrentUser, isOnline }) => {
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const validUsers = {
      Rishabh: "1234",
      Saman: "chudail",
    };

    if (validUsers[name] === passcode) {
      const userObj = { name, id: name };
      setCurrentUser(userObj);

      // ✅ Save in LocalStorage
      localStorage.setItem("chatUser", JSON.stringify(userObj));

      setError("");

      // Firebase user update
      const userRef = ref(rtdb, `users/${name}`);
      set(userRef, {
        name,
        lastSeen: Date.now(),
        isOnline: true,
      });
    } else {
      setError("Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6">
          <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <Lock className="text-purple-600" size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">CHAT APP</h1>
          <p className="text-sm text-gray-600">
            Enter your credentials to access
          </p>
          <div
            className={`flex items-center justify-center mt-2 text-xs ${
              isOnline ? "text-green-600" : "text-red-600"
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="ml-1">{isOnline ? "Online" : "Offline"}</span>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Username"
            className="w-full px-4 py-2 rounded-xl border"
          />
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-2 rounded-xl border"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={!isOnline}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl"
          >
            {isOnline ? "Login" : "No Internet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
