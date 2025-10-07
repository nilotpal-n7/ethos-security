import { Request, Response } from 'express';
import db from '../config/db';
import fetch from 'node-fetch';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

interface PredictionResponse {
  last_location_id: number;
  predicted_next_location_id: number;
  confidence: number;
}

interface LocationName {
  id: number;
  name: string;
}

export const getPrediction = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict/${userId}`);
    const predictionData = (await mlResponse.json()) as PredictionResponse;

    if (!mlResponse.ok) {
      return res.status(mlResponse.status).json(predictionData);
    }
    
    const locationQuery = 'SELECT id, name FROM locations WHERE id = ANY($1::int[])';
    const locationIds = [
      predictionData.last_location_id, 
      predictionData.predicted_next_location_id
    ];

    const { rows: locations } = await db.query<LocationName>(locationQuery, [locationIds]);
    const locationMap = new Map(locations.map(l => [l.id, l.name]));

    res.status(200).json({
      lastLocation: locationMap.get(predictionData.last_location_id) || 'Unknown',
      predictedNextLocation: locationMap.get(predictionData.predicted_next_location_id) || 'Unknown',
      confidence: predictionData.confidence,
    });
  } catch (error) {
    console.error(`Error getting prediction for user ${userId}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};