import { defineConfig } from "drizzle-kit";
import { config } from "./src/config/config.js";

export default defineConfig({
  out: "./migrations",
  schema: "./src/models/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: config.DATABASE_URL,
  },
});
