import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React dev server on 5173. The API runs separately on http://localhost:8000.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
