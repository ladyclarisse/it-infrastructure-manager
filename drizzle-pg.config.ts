import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL ?? "postgresql://it_manager:placeholder@localhost:5432/it_infrastructure";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle-pg",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
});
