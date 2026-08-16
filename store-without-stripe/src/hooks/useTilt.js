import { useCallback, useRef } from "react";

/**
 * Lightweight 3D tilt: returns a ref + handlers to spread on a `.gm-tilt-inner` element.
 * The card rotates toward the cursor (max `max` degrees) and springs back on leave.
 * Pure transform via CSS custom properties — no re-renders, no dependencies.
 */
const useTilt = (max = 10) => {
  const ref = useRef(null);

  const onMouseMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      const ry = (px - 0.5) * 2 * max; // rotateY: left/right
      const rx = -(py - 0.5) * 2 * max; // rotateX: up/down
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    },
    [max]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  }, []);

  return { ref, onMouseMove, onMouseLeave };
};

export default useTilt;
