// src/app/(app)/alert/page.tsx

import { AlertsClient } from "@/components/AlertsClient";
import { getInactivityAlertsData } from "@/lib/data/alerts";

// The page component is now much simpler!
export default async function AlertsPage() {
    // Directly call the function to get data. No more fetch, URLs, or JSON parsing.
    const alerts = await getInactivityAlertsData();
    
    return <AlertsClient alerts={alerts} />;
}