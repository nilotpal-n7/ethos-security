// src/app/unresolved/page.tsx
import { db } from "@/database";
import { campusCards } from "@/database/schema";
import { isNull } from "drizzle-orm";
import { UnresolvedPageClient } from "@/components/UnresolvedPageClient";

// This remains a Server Component for fast data fetching
export default async function UnresolvedPage() {
    const unownedCards = await db.query.campusCards.findMany({
        where: isNull(campusCards.userId),
    });

    // It passes the fetched data to the Client Component
    return <UnresolvedPageClient cards={unownedCards} />;
}