import { jstack } from "jstack";

// Initialize JStack
const j = jstack.init();

// Public procedure (no auth middleware for now, we handle auth in the procedure)
export const publicProcedure = j.procedure;

export { j };
