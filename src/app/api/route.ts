import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks: Record<string, { status: string; detail?: string }> = {};

  // Check 1: Environment variable exists
  const dbUrl = process.env.DATABASE_URL || "";
  const hasDbUrl = !!dbUrl;
  const isValidUrl = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

  if (!hasDbUrl) {
    checks["env"] = {
      status: "ERROR",
      detail: "DATABASE_URL is NOT set! Add it to your .env file or Vercel environment variables.",
    };
  } else if (!isValidUrl) {
    checks["env"] = {
      status: "ERROR",
      detail: `DATABASE_URL must start with postgresql:// (Neon) — current value starts with: "${dbUrl.substring(0, 30)}..."`,
    };
  } else {
    checks["env"] = { status: "ok", detail: "DATABASE_URL is set (PostgreSQL / Neon)" };
  }

  // Only check database if URL is valid
  if (isValidUrl) {
    // Check 2: Database connection
    try {
      await db.$queryRaw`SELECT 1`;
      checks["database"] = { status: "ok", detail: "Connected to PostgreSQL (Neon) successfully" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks["database"] = {
        status: "ERROR",
        detail: `Cannot connect to database: ${message.substring(0, 200)}`,
      };
    }

    // Check 3: Tables exist
    try {
      const count = await db.accidentReport.count();
      checks["tables"] = { status: "ok", detail: `AccidentReport table exists with ${count} records` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks["tables"] = {
        status: "ERROR",
        detail: `Table does not exist yet. Run: bun run db:migrate:deploy`,
      };
    }
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "unhealthy",
      checks,
      steps_to_fix: !allOk
        ? [
            "1. Create free database at https://neon.tech",
            "2. Copy the PostgreSQL connection string (starts with postgresql://)",
            "3. In Vercel → Settings → Environment Variables → Add: DATABASE_URL = your-connection-string",
            "4. Run locally: DATABASE_URL='your-connection-string' bun run db:migrate:deploy",
            "5. Redeploy on Vercel",
          ]
        : undefined,
    },
    { status: allOk ? 200 : 500 }
  );
}
