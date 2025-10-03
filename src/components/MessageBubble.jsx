// utils/messageActions.js
import { ref, update, set } from "firebase/database";
import { rtdb } from "../firebase/config";

// Edit message
export const editMessage = (id, newText) => {
  const messageRef = ref(rtdb, `messages/${id}`);
  return update(messageRef, {
    text: newText,
    edited: true,
  });
};

// Soft Delete
export const deleteMessage = (id) => {
  const messageRef = ref(rtdb, `messages/${id}`);
  return update(messageRef, {
    text: "🚫 Message deleted",
    deleted: true,
  });
};

// NEW: Mark message as read
export const markMessageAsRead = (messageId, userName) => {
  const readRef = ref(rtdb, `messages/${messageId}/readBy/${userName}`);
  return set(readRef, true);
};
