import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function addLinkReferrerPolicy(server) {
  server.middlewares.use((request, response, next) => {
    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    if (pathname === "/link") response.setHeader("Referrer-Policy", "no-referrer");
    next();
  });
}

const linkReferrerPolicy = {
  name: "link-referrer-policy",
  configureServer: addLinkReferrerPolicy,
  configurePreviewServer: addLinkReferrerPolicy
};

export default defineConfig({
  plugins: [react(), linkReferrerPolicy],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/uploads": "http://localhost:3000"
    }
  }
});
