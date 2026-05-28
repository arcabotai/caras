import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Railway PostgreSQL requires SSL - neon handles this automatically
export const db = drizzle(sql, { schema });