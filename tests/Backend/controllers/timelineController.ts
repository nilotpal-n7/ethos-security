import { Request, Response } from 'express';
import db from '../config/db';

// Define a type for the shape of a timeline event
interface TimelineEvent {
  type: string;
  details: string;
  timestamp: string;
}

export const getTimeline = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // The main query remains the same
    const query = `
      SELECT 'Card Swipe' AS type, l.name AS details, sl.timestamp
      FROM swipe_logs sl
      JOIN campus_cards cc ON sl.card_id = cc.id
      JOIN locations l ON sl.location_id = l.id
      WHERE cc.user_id = $1
      
      UNION ALL
      
      -- ... (rest of the UNION ALL query) ...
      
      ORDER BY timestamp DESC;
    `;

    const { rows: timeline } = await db.query<TimelineEvent>(query, [userId]);

    if (timeline.length === 0) {
      return res.status(404).json({ message: 'No activity found for this user.' });
    }

    res.status(200).json(timeline);
  } catch (error) {
    console.error(`Error generating timeline for user ${userId}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};