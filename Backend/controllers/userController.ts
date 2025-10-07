import { Request, Response } from 'express';
import db from '../config/db';

// Define a type for the user data we expect from the DB
interface User {
  id: number;
  full_name: string;
  role: 'student' | 'staff' | 'faculty';
  email: string;
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query<User>(
      'SELECT id, full_name, role, email FROM users ORDER BY full_name ASC'
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};