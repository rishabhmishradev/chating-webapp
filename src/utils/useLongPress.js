import { useCallback, useRef, useState } from "react";

/**
 * Custom hook to detect long press (for mobile & desktop).
 *
 * @param {Function} callback - Function to run on long press
 * @param {number} ms - Delay in milliseconds (default: 500ms)
 */
export function useLongPress(callback = () => {}, ms = 500) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timerRef = useRef();

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => {
      callback();
      setLongPressTriggered(true);
    }, ms);
  }, [callback, ms]);

  const clear = useCallback(() => {
    clearTimeout(timerRef.current);
    setLongPressTriggered(false);
  }, []);

  return {
    onMouseDown: start,   // Desktop press
    onTouchStart: start,  // Mobile press
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
  };
}
