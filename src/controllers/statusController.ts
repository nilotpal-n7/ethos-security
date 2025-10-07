import { Request, Response } from 'express';
import db from '../config/db';

const RECENCY_THRESHOLD_MINUTES = 15;

interface LastEvent {
  details: string;
  timestamp: string;
  location_name: string;
}

export const getStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const lastSeenQuery = `
      -- ... (last seen query from previous example) ...
      LIMIT 1;
    `;
    
    const { rows } = await db.query<LastEvent>(lastSeenQuery, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'Unknown', details: 'No location data found.' });
    }

    const lastEvent = rows[0];
    const minutesSinceLastEvent = (new Date().getTime() - new Date(lastEvent.timestamp).getTime()) / 60000;

    const status = minutesSinceLastEvent <= RECENCY_THRESHOLD_MINUTES 
      ? `Likely at ${lastEvent.location_name}` 
      : 'Location Unknown';

    res.status(200).json({
      status,
      lastKnownEvent: {
        details: lastEvent.details,
        timestamp: lastEvent.timestamp,
        minutesAgo: Math.round(minutesSinceLastEvent),
      },
    });
  } catch (error) {
    console.error(`Error getting status for user ${userId}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};