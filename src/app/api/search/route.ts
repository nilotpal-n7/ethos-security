// src/app/api/search/route.ts
import { db } from "@/database";
import { users } from "@/database/schema";
import { ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  try {
    // Search for users where the full name OR externalId matches the query
    // 'ilike' is a case-insensitive search
    const results = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        externalId: users.externalId,
      })
      .from(users)
      .where(
        or(
          ilike(users.fullName, `%${query}%`),
          ilike(users.externalId, `%${query}%`)
        )
      )
      .limit(10); // Limit to 10 suggestions

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}