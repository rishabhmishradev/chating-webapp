import React, { useState, useEffect, useRef } from "react";
import { ref, push, serverTimestamp, update, onValue } from "firebase/database";
import { rtdb } from "../firebase/config";
import { Send, MessageCircle, Smile, Check, CheckCheck } from "lucide-react";
import { deleteMessage as softDeleteMessage } from "../utils/messageActions";

const ChatRoom = ({ currentUser, isOnline, messages, usersMap = {} }) => {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [otherUserPresence, setOtherUserPresence] = useState(null);

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

  // Determine other user (assumes 1:1 chat with known names in usersMap)
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

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!currentUser || !messages.length) return;

    messages.forEach((message) => {
      // Only mark others' messages as read
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
        const messagesRef = ref(rtdb, "messages");
        await push(messagesRef, {
          text: newMessage,
          sender: currentUser.name,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
          status: "sent", // Initial status
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

  // Simulate delivery status after 1 second
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

  const emojiList = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "💯", "🤔", "😍", "🥳"];

 // Read Receipt Icon Component
const ReadReceipt = ({ status }) => {
  const baseClasses = "w-5 h-5"; // Make it bigger
  if (status === "read") {
    return (
      <div className="flex items-center space-x-1">
        <CheckCheck className={`${baseClasses} text-green-400`} />
      </div>
    );
  }
  if (status === "delivered") {
    return (
      <div className="flex items-center space-x-1">
        <CheckCheck className={`${baseClasses} text-zinc-400`} />
      </div>
    );
  }
  // sent
  return <Check className={`${baseClasses} text-zinc-400`} />;
};


  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header with other user's presence */}
      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/60 text-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {otherUserPresence?.name || "Chat"}
            </span>
            <span className="text-xs text-zinc-400">
              {otherUserPresence?.isOnline
                ? "Online"
                : otherUserPresence?.lastSeen
                ? `Last seen ${new Date(otherUserPresence.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </span>
          </div>
        </div>
      </div>
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-zinc-900 to-black"
        style={{
          scrollBehavior: "auto",
          overflowAnchor: "none",
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-zinc-400 mt-32">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold mb-2 text-zinc-300">
              No messages yet
            </h3>
            <p className="text-zinc-500">Start the conversation ✨</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === currentUser?.name
                    ? "justify-end"
                    : "justify-start"
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
                        softDeleteMessage(message.id);
                      }
                    }}
                  >
                    {message.sender !== currentUser?.name && (
                      <p className="text-xs font-semibold text-amber-400 mb-2 tracking-wide">
                        {message.sender}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed mb-2">
                      {message.text}
                    </p>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs opacity-70 ${
                          message.sender === currentUser?.name
                            ? "text-black"
                            : "text-zinc-400"
                        }`}
                      >
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Sending..."}
                      </p>
                      {/* Show read receipt only for sender's messages */}
                      {message.sender === currentUser?.name && (
                        <div className="ml-2">
                          <ReadReceipt status={message.status || "sent"} />
                        </div>
                      )}
                    </div>
                    {message.sender === currentUser?.name && (
                      <div className="mt-1 text-[10px] text-zinc-500 select-none">
                        Right-click to Unsend
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

      {/* Input Section */}
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
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder={isOnline ? "Type a message..." : "No connection"}
              disabled={!isOnline}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all disabled:opacity-50"
            />
            {newMessage && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
            )}
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
