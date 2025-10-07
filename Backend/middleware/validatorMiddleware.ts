import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// This middleware function checks the result of the validation rules
// that you defined in your route files.
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are validation errors, send a 400 Bad Request response
    // with the details of the errors.
    return res.status(400).json({ errors: errors.array() });
  }
  // If validation passes, proceed to the next middleware or controller.
  next();
};