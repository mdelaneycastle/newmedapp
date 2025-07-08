import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all dependants for a carer
router.get('/dependants', authenticateToken, requireRole('carer'), async (req: AuthRequest, res: Response) => {
  try {
    const carerId = req.user!.userId;

    const dependants = await pool.query(
      `SELECT u.id, u.email, u.name, u.created_at
       FROM users u
       INNER JOIN carer_dependant_relationships cdr ON u.id = cdr.dependant_id
       WHERE cdr.carer_id = $1 AND u.role = 'dependant'
       ORDER BY u.name`,
      [carerId]
    );

    res.json(dependants.rows);
  } catch (error) {
    console.error('Get dependants error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a dependant to a carer (by email)
router.post('/add-dependant', authenticateToken, requireRole('carer'), async (req: AuthRequest, res: Response) => {
  try {
    const { dependantEmail } = req.body;
    const carerId = req.user!.userId;

    if (!dependantEmail) {
      return res.status(400).json({ message: 'Dependant email is required' });
    }

    // Check if dependant exists
    const dependant = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [dependantEmail, 'dependant']
    );

    if (dependant.rows.length === 0) {
      return res.status(404).json({ message: 'Dependant not found' });
    }

    const dependantId = dependant.rows[0].id;

    // Check if relationship already exists
    const existingRelationship = await pool.query(
      'SELECT * FROM carer_dependant_relationships WHERE carer_id = $1 AND dependant_id = $2',
      [carerId, dependantId]
    );

    if (existingRelationship.rows.length > 0) {
      return res.status(409).json({ message: 'Relationship already exists' });
    }

    // Create relationship
    await pool.query(
      'INSERT INTO carer_dependant_relationships (carer_id, dependant_id) VALUES ($1, $2)',
      [carerId, dependantId]
    );

    res.status(201).json({
      message: 'Dependant added successfully',
      dependant: {
        id: dependant.rows[0].id,
        email: dependant.rows[0].email,
        name: dependant.rows[0].name
      }
    });
  } catch (error) {
    console.error('Add dependant error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;