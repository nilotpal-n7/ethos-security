import { Request, Response } from 'express';
import db from '../config/db';

// Define a type for the data we expect to return for each alert
interface InactiveUserAlert {
  id: number;
  full_name: string;
  email: string;
  role: string;
  last_seen: string; // The timestamp of their last activity
  hours_since_seen: number; // How many hours ago they were last seen
}

/**
 * @desc    Get alerts for users with no activity in the last 12 hours
 * @route   GET /api/alerts/inactive
 * @access  Protected (Requires Admin/Security Role)
 */
export const getInactiveUserAlerts = async (req: Request, res: Response) => {
  try {
    // This query first combines all timestamped location activities into a single
    // virtual table (UserLastActivity). Then, it finds the absolute latest
    // timestamp for each user. Finally, it joins back to the users table and
    // filters for only those whose latest activity was more than 12 hours ago.
    const query = `
      WITH UserLastActivity AS (
          -- Combine all location-based activities into one set
          SELECT 
              cc.user_id, 
              sl.timestamp
          FROM swipe_logs sl
          JOIN campus_cards cc ON sl.card_id = cc.id
          WHERE cc.user_id IS NOT NULL
          
          UNION ALL
          
          SELECT 
              d.user_id, 
              wl.timestamp
          FROM wifi_logs wl
          JOIN devices d ON wl.device_hash = d.device_hash
          WHERE d.user_id IS NOT NULL
          
          UNION ALL
          
          SELECT 
              fp.user_id, 
              cfl.timestamp
          FROM cctv_frame_logs cfl
          JOIN facial_profiles fp ON fp.id = ANY(cfl.detected_face_ids::text[])
          WHERE fp.user_id IS NOT NULL
      ),
      UserMaxTimestamp AS (
          -- Find the most recent activity for each user from the combined set
          SELECT
              user_id,
              MAX(timestamp) AS last_seen
          FROM UserLastActivity
          GROUP BY user_id
      )
      -- Select users whose last activity was more than 12 hours ago
      SELECT 
          u.id,
          u.full_name,
          u.email,
          u.role,
          umt.last_seen,
          -- Calculate how long it's been in a human-readable format (hours)
          ROUND(EXTRACT(EPOCH FROM (NOW() - umt.last_seen)) / 3600, 2) AS hours_since_seen 
      FROM UserMaxTimestamp umt
      JOIN users u ON u.id = umt.user_id
      WHERE umt.last_seen < NOW() - INTERVAL '12 hours'
      ORDER BY last_seen ASC; -- Show the longest-inactive users first
    `;

    const { rows: alerts } = await db.query<InactiveUserAlert>(query);

    // It's not an error if there are no alerts. An empty array is a valid response.
    res.status(200).json(alerts);

  } catch (error) {
    console.error('Error generating inactivity alerts:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};