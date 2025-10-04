import React, { useState, useEffect } from "react";
import { ref, onValue, set, serverTimestamp } from "firebase/database";
import { rtdb } from "./firebase/config";

// Components
import AuthScreen from "./components/AuthScreen";
import Navigation from "./components/Navigation";
import ChatRoom from "./components/ChatRoom";
import GamesSection from "./components/GamesSection";
import CreativeZone from "./components/CreativeZone";

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userPresence, setUserPresence] = useState({ isOnline: false, lastSeen: null });
  const [usersMap, setUsersMap] = useState({});
  const [gameStates, setGameStates] = useState({
    rps: { scores: { player1: 0, player2: 0 } },
    tictactoe: {
      board: Array(9).fill(null),
      currentPlayer: "X",
      winner: null,
      scores: { X: 0, O: 0 },
    },
  });

  // ✅ Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("chatUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // ✅ Online/Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ✅ Real-time Messages Listener
  useEffect(() => {
    if (!currentUser) return;

    const messagesRef = ref(rtdb, "messages");
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setMessages(
          messagesList.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          )
        );
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Subscribe to current user's presence (users/<name>)
  useEffect(() => {
    if (!currentUser) return;

    const userRef = ref(rtdb, `users/${currentUser.name}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserPresence({
          isOnline: Boolean(data.isOnline),
          lastSeen: data.lastSeen || null,
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Heartbeat to keep user online while active
  useEffect(() => {
    if (!currentUser) return;

    const userRef = ref(rtdb, `users/${currentUser.name}`);
    
    // Update online status immediately
    set(userRef, {
      name: currentUser.name,
      isOnline: true,
      lastSeen: Date.now(),
    });

    // Keep user online with periodic heartbeat
    const heartbeatInterval = setInterval(() => {
      set(userRef, {
        name: currentUser.name,
        isOnline: true,
        lastSeen: Date.now(),
      });
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(heartbeatInterval);
      // Set offline when component unmounts
      set(userRef, {
        name: currentUser.name,
        isOnline: false,
        lastSeen: Date.now(),
      });
    };
  }, [currentUser]);

  // ✅ Subscribe to all users for showing others' last seen
  useEffect(() => {
    const usersRef = ref(rtdb, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUsersMap(data);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Mark offline with lastSeen on tab close/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!currentUser) return;
      const userRef = ref(rtdb, `users/${currentUser.name}`);
      // Best-effort write
      set(userRef, {
        name: currentUser.name,
        isOnline: false,
        lastSeen: Date.now(),
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentUser]);

  // ✅ Real-time Game State Sync
  useEffect(() => {
    if (!currentUser) return;

    const gameRef = ref(rtdb, "gameStates");
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameStates(data);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const updateGameState = (newGameStates) => {
    setGameStates(newGameStates);
    if (currentUser) {
      const gameRef = ref(rtdb, "gameStates");
      set(gameRef, newGameStates);
    }
  };

  // ✅ If not logged in → show AuthScreen
  if (!currentUser) {
    return <AuthScreen setCurrentUser={setCurrentUser} isOnline={isOnline} />;
  }

  return (
    <div className="h-screen w-screen bg-gray-950 flex flex-col overflow-hidden">
      <Navigation
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        setActiveSection={setActiveSection}
        activeSection={activeSection}
        isOnline={isOnline}
        userPresence={userPresence}
        usersMap={usersMap}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeSection === "chat" && (
          <ChatRoom
            currentUser={currentUser}
            isOnline={isOnline}
            messages={messages}
            usersMap={usersMap}
          />
        )}
        {activeSection === "games" && (
          <GamesSection
            gameStates={gameStates}
            updateGameState={updateGameState}
            isOnline={isOnline}
          />
        )}
        {activeSection === "creative" && <CreativeZone />}
      </main>
    </div>
  );
};

export default App;
