import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// --- Import Your Route Handlers ---
// These files will define the specific API endpoints (e.g., /:userId)
// and connect them to the controller functions you've written.
import userRoutes from './routes/userRoutes';
import timelineRoutes from './routes/timelineRoutes';
import statusRoutes from './routes/statusRoutes';
import predictionRoutes from './routes/predictionRoutes';
import alertRoutes from './routes/alertRoutes';

// --- Import Your Middleware ---
import { errorHandler } from './middleware/errorMiddleware';

// --- Initial Configuration ---
// Load environment variables from a .env file into process.env
dotenv.config();

// Create an instance of the Express application
const app: Express = express();

// Define the port the server will run on.
// It will use the PORT from your .env file, or default to 5000.
const PORT = process.env.PORT || 5000;

// --- Core Middleware ---

// Enable Cross-Origin Resource Sharing (CORS)
// This is crucial for allowing a separate frontend application to access this API.
app.use(cors());

// Middleware to parse incoming JSON request bodies.
// This allows you to access `req.body` in your controllers.
app.use(express.json());

// Middleware to parse incoming URL-encoded payloads (e.g., from HTML forms).
app.use(express.urlencoded({ extended: true }));


// --- API Routes ---
// This is where you mount your different route handlers to specific URL paths.

app.use('/api/users', userRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/predict', predictionRoutes);
app.use('/api/alerts', alertRoutes);


// --- Base Route for Health Check ---
// A simple endpoint to confirm that the server is up and running.
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Campus Security API is active and running.');
});


// --- Centralized Error Handling ---
// This middleware must be the LAST one you load.
// It will catch any errors that occur in your routes and format them nicely.
app.use(errorHandler);


// --- Start The Server ---
// This command binds the server to the specified port and starts listening for requests.
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
  console.log(`   Access the API at http://localhost:${PORT}`);
});