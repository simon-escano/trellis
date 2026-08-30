import { animate, spring } from "@motionone/dom";

export function animateCardEntry(element: HTMLElement | string) {
  try {
    animate(
      element,
      { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"] },
      { duration: 0.35, easing: spring({ stiffness: 300, damping: 20 }) }
    );
  } catch {
    // fallback gracefully if DOM element not present
  }
}

export function animateFadeIn(element: HTMLElement | string) {
  try {
    animate(element, { opacity: [0, 1] }, { duration: 0.25 });
  } catch {
    // fallback gracefully
  }
}
