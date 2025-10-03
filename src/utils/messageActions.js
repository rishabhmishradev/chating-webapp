// utils/messageActions.js
import { ref, update } from "firebase/database";
import { rtdb } from "../firebase/config";

// ✏️ Edit message
export const editMessage = (id, newText) => {
  const messageRef = ref(rtdb, `messages/${id}`);
  return update(messageRef, {
    text: newText,
    edited: true,
  });
};

// ❌ Soft Delete (Unsend)
export const deleteMessage = (id) => {
  const messageRef = ref(rtdb, `messages/${id}`);
  return update(messageRef, {
    text: "🚫 Message deleted",
    deleted: true,
  });
};
