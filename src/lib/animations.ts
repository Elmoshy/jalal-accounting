import type { Variants, Transition } from "framer-motion";

export const defaultEasing = [0.21, 1.02, 0.73, 1] as const;
export const springConfig: Transition = { type: "spring", stiffness: 260, damping: 25 };
export const springLift: Transition = { type: "spring", stiffness: 400, damping: 20 };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: defaultEasing } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: defaultEasing } },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: defaultEasing } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: defaultEasing } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

export const cardHover = {
  rest: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  hover: { scale: 1.02, boxShadow: "0 8px 25px rgba(0,0,0,0.1)", transition: springLift },
  tap: { scale: 0.98 },
};

export const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: defaultEasing } },
};

export const iconRotate = {
  rest: { rotate: 0 },
  hover: { rotate: 15, transition: springLift },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: defaultEasing } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } },
};
