import React, { useState, useEffect, useRef } from "react";
import { ref, push, serverTimestamp, update, onValue, set } from "firebase/database"; // ✅ 'set' added
import { rtdb } from "../firebase/config";
import { Send, MessageCircle, Smile, Check, CheckCheck } from "lucide-react";
import { deleteMessage as softDeleteMessage } from "../utils/messageActions";

const ChatRoom = ({ currentUser, isOnline, messages, usersMap = {} }) => {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [otherUserPresence, setOtherUserPresence] = useState(null);
  const [unsendHintSeen, setUnsendHintSeen] = useState(
    typeof window !== "undefined" && localStorage.getItem("unsendHintSeen") === "1"
  );
  const longPressTimerRef = useRef(null);
  const longPressTargetRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = (behavior = "auto") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, []);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages]);

  // Determine other user
  useEffect(() => {
    if (!currentUser) return;
    const names = Object.keys(usersMap || {});
    const others = names.filter((n) => n !== currentUser.name);
    if (others.length > 0) {
      const other = usersMap[others[0]];
      setOtherUserPresence(other || null);
    } else {
      setOtherUserPresence(null);
    }
  }, [usersMap, currentUser]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!currentUser) return;

    const typingRef = ref(rtdb, "typing");
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTypingUsers(data);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Cleanup typing on unmount
  useEffect(() => {
    return () => {
      if (currentUser) {
        const typingRef = ref(rtdb, `typing/${currentUser.name}`);
        set(typingRef, {
          isTyping: false,
          timestamp: Date.now(),
        }).catch((err) => console.error("Error clearing typing:", err));
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };
  }, [currentUser]);

  // Mark messages as read
  useEffect(() => {
    if (!currentUser || !messages.length) return;

    messages.forEach((message) => {
      if (message.sender !== currentUser.name && message.status !== "read") {
        const messageRef = ref(rtdb, `messages/${message.id}`);
        update(messageRef, {
          status: "read",
          readAt: serverTimestamp(),
        });
      }
    });
  }, [messages, currentUser]);

  const sendMessage = async () => {
    if (newMessage.trim() && currentUser && isOnline) {
      try {
        // ✅ Clear typing immediately when sending
        const typingRef = ref(rtdb, `typing/${currentUser.name}`);
        await set(typingRef, {
          isTyping: false,
          timestamp: Date.now(),
        });
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        const messagesRef = ref(rtdb, "messages");
        await push(messagesRef, {
          text: newMessage,
          sender: currentUser.name,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
          status: "sent",
        });
        
        setNewMessage("");
        setShowEmojiPicker(false);

        setTimeout(() => {
          scrollToBottom("auto");
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 50);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  // Simulate delivery status
  useEffect(() => {
    if (!currentUser) return;

    messages.forEach((message) => {
      if (
        message.sender === currentUser.name &&
        message.status === "sent" &&
        message.createdAt
      ) {
        const sentTime = new Date(message.createdAt).getTime();
        const now = Date.now();
        if (now - sentTime > 1000) {
          const messageRef = ref(rtdb, `messages/${message.id}`);
          update(messageRef, {
            status: "delivered",
            deliveredAt: serverTimestamp(),
          });
        }
      }
    });
  }, [messages, currentUser]);

  const addEmoji = (emoji) => {
    setNewMessage(newMessage + emoji);
    setShowEmojiPicker(false);
  };

  // ✅ Handle typing with proper cleanup
  const handleTyping = (text) => {
    setNewMessage(text);
    
    if (!currentUser) return;
    
    const typingRef = ref(rtdb, `typing/${currentUser.name}`);
    
    if (text.trim()) {
      // User is typing
      set(typingRef, {
        isTyping: true,
        timestamp: Date.now(),
      }).catch((err) => console.error("Error setting typing:", err));
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        set(typingRef, {
          isTyping: false,
          timestamp: Date.now(),
        }).catch((err) => console.error("Error clearing typing:", err));
      }, 2000);
    } else {
      // Empty input - stop typing
      set(typingRef, {
        isTyping: false,
        timestamp: Date.now(),
      }).catch((err) => console.error("Error clearing typing:", err));
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const emojiList = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "💯", "🤔", "😍", "🥳"];

  const handleUnsend = (message) => {
    if (!message || message.sender !== currentUser?.name) return;
    const ok = window.confirm("Unsend this message?");
    if (!ok) return;
    softDeleteMessage(message.id);
    if (!unsendHintSeen) {
      setUnsendHintSeen(true);
      try { localStorage.setItem("unsendHintSeen", "1"); } catch {}
    }
  };

  const handleTouchStart = (message) => {
    if (message.sender !== currentUser?.name) return;
    longPressTargetRef.current = message;
    longPressTimerRef.current = setTimeout(() => {
      handleUnsend(longPressTargetRef.current);
    }, 600);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      longPressTargetRef.current = null;
    }
  };

  const ReadReceipt = ({ status }) => {
    const baseClasses = "w-4 h-4";
    if (status === "read") {
      return <CheckCheck className={`${baseClasses} text-green-400`} />;
    }
    if (status === "delivered") {
      return <CheckCheck className={`${baseClasses} text-zinc-400`} />;
    }
    return <Check className={`${baseClasses} text-zinc-400`} />;
  };

  // Check if someone is typing
  const someoneIsTyping = Object.keys(typingUsers).some((userName) => {
    if (userName === currentUser?.name) return false;
    const userTyping = typingUsers[userName];
    if (!userTyping?.isTyping) return false;
    const typingTime = userTyping.timestamp || 0;
    const now = Date.now();
    return (now - typingTime) <= 5000;
  });

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/60 text-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {otherUserPresence?.name || "Chat"}
            </span>
            <span className="text-xs text-zinc-400">
              {someoneIsTyping
                ? "typing..."
                : otherUserPresence?.isOnline
                ? "Online"
                : otherUserPresence?.lastSeen
                ? `Last seen ${new Date(otherUserPresence.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-zinc-900 to-black"
        style={{ scrollBehavior: "auto", overflowAnchor: "none" }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-zinc-400 mt-32">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold mb-2 text-zinc-300">No messages yet</h3>
            <p className="text-zinc-500">Start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === currentUser?.name ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-xs sm:max-w-sm lg:max-w-md">
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg ${
                      message.sender === currentUser?.name
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black"
                        : "bg-gradient-to-r from-zinc-800 to-zinc-700 text-white border border-zinc-600"
                    }`}
                    onContextMenu={(e) => {
                      if (message.sender === currentUser?.name) {
                        e.preventDefault();
                        handleUnsend(message);
                      }
                    }}
                    onTouchStart={() => handleTouchStart(message)}
                    onTouchEnd={clearLongPress}
                    onTouchCancel={clearLongPress}
                    onTouchMove={clearLongPress}
                  >
                    {message.sender !== currentUser?.name && (
                      <p className="text-xs font-semibold text-amber-400 mb-2 tracking-wide">
                        {message.sender}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed mb-2">{message.text}</p>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs opacity-70 ${
                          message.sender === currentUser?.name ? "text-black" : "text-zinc-400"
                        }`}
                      >
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Sending..."}
                      </p>
                      {message.sender === currentUser?.name && (
                        <div className="ml-2">
                          <ReadReceipt status={message.status || "sent"} />
                        </div>
                      )}
                    </div>
                    {message.sender === currentUser?.name && !unsendHintSeen && (
                      <div className="mt-1 text-[10px] text-zinc-500 select-none">
                        Long-press to Unsend
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-zinc-900">
        {showEmojiPicker && (
          <div className="mb-4 p-3 bg-zinc-800 rounded-xl border border-zinc-700">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="text-xl p-2 hover:bg-zinc-700 rounded-lg transition-colors hover:scale-110 transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700"
            disabled={!isOnline}
          >
            <Smile className="w-5 h-5 text-amber-400" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder={isOnline ? "Type a message..." : "No connection"}
              disabled={!isOnline}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all disabled:opacity-50"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!isOnline || !newMessage.trim()}
            className="p-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 disabled:from-zinc-700 disabled:to-zinc-600 text-black rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {isOnline && (
          <div className="flex items-center justify-center mt-3">
            <div className="flex items-center space-x-2 text-xs text-zinc-500">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>Connected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
