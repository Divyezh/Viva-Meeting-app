import { Pool, neonConfig } from "@neondatabase/serverless";
import dotenv from "dotenv";
import type { User, Meeting, MeetingParticipant, MeetingMessage } from "../types/index.js";

dotenv.config();

// In-memory active fallback data stores
export const memoryUsers = new Map<string, User>();
export const memoryMeetings = new Map<string, Meeting>();
export const memoryParticipants = new Map<string, MeetingParticipant[]>();
export const memoryMessages = new Map<string, MeetingMessage[]>();

let pool: Pool | null = null;

export const getPool = (): Pool | null => {
  if (!pool && process.env.DATABASE_URL) {
    try {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
    } catch (err) {
      console.warn("[Database] Could not initialize Neon connection pool, using memory store fallback.", err);
    }
  }
  return pool;
};

export const initDB = async (): Promise<void> => {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && !dbUrl.includes("user:password@endpoint")) {
    try {
      const client = getPool();
      if (!client) return;

      console.log("[Database] Initializing PostgreSQL schema via Neon serverless driver...");

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT,
          full_name TEXT,
          avatar_url TEXT,
          plan TEXT DEFAULT 'free',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS meetings (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          host_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS meeting_participants (
          id TEXT PRIMARY KEY,
          meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS meeting_messages (
          id TEXT PRIMARY KEY,
          meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log("[Database] PostgreSQL tables initialized successfully.");
      return;
    } catch (err) {
      console.warn("[Database] PostgreSQL connection failed. Operating in fast in-memory store mode.", err);
    }
  }

  console.log("[Database] Operating in fast in-memory store mode (Set DATABASE_URL to connect Neon PostgreSQL).");
};
