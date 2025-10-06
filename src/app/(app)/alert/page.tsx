import { AlertsClient } from "@/components/AlertsClient";

async function getInactivityAlerts() {
    try {
        // Use an absolute URL for server-side fetching
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/alerts/inactivity`;
        const res = await fetch(apiUrl, { cache: 'no-store' });
        
        if (!res.ok) {
            console.error(`Failed to fetch alerts: ${res.statusText}`);
            return [];
        }
        const data = await res.json();
        return data.alerts || [];
    } catch (error) {
        console.error("Failed to fetch alerts:", error);
        return [];
    }
}

export default async function AlertsPage() {
    const alerts = await getInactivityAlerts();
    return <AlertsClient alerts={alerts} />;
}