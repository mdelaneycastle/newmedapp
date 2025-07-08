import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get pending confirmations for a carer
router.get('/pending', authenticateToken, requireRole('carer'), async (req: AuthRequest, res: Response) => {
  try {
    const carerId = req.user!.userId;

    const confirmations = await pool.query(
      `SELECT 
        mc.id,
        mc.dependant_id,
        mc.medication_id,
        mc.schedule_id,
        mc.photo_path,
        mc.taken_at,
        mc.confirmed_by_carer,
        mc.notes,
        m.name as medication_name,
        u.name as dependant_name
       FROM medication_confirmations mc
       INNER JOIN medications m ON mc.medication_id = m.id
       INNER JOIN users u ON mc.dependant_id = u.id
       WHERE m.carer_id = $1 AND mc.confirmed_by_carer = false
       ORDER BY mc.taken_at DESC`,
      [carerId]
    );

    res.json(confirmations.rows);
  } catch (error) {
    console.error('Get pending confirmations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get recent confirmations for a dependant (to check what's been taken)
router.get('/recent', authenticateToken, requireRole('dependant'), async (req: AuthRequest, res: Response) => {
  try {
    const dependantId = req.user!.userId;

    // Get confirmations from the last 24 hours that have been confirmed by carer
    const confirmations = await pool.query(
      `SELECT 
        mc.medication_id,
        mc.schedule_id,
        mc.taken_at,
        mc.confirmed_by_carer,
        ms.time_of_day,
        ms.days_of_week
       FROM medication_confirmations mc
       LEFT JOIN medication_schedules ms ON mc.schedule_id = ms.id
       WHERE mc.dependant_id = $1 
       AND mc.confirmed_by_carer = true
       AND mc.taken_at >= NOW() - INTERVAL '24 hours'
       ORDER BY mc.taken_at DESC`,
      [dependantId]
    );

    res.json(confirmations.rows);
  } catch (error) {
    console.error('Get recent confirmations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Confirm a medication taking
router.post('/:confirmationId/confirm', authenticateToken, requireRole('carer'), async (req: AuthRequest, res: Response) => {
  try {
    const { confirmationId } = req.params;
    const { notes } = req.body;
    const carerId = req.user!.userId;

    // Verify carer owns this confirmation
    const confirmation = await pool.query(
      `SELECT mc.* FROM medication_confirmations mc
       INNER JOIN medications m ON mc.medication_id = m.id
       WHERE mc.id = $1 AND m.carer_id = $2`,
      [confirmationId, carerId]
    );

    if (confirmation.rows.length === 0) {
      return res.status(404).json({ message: 'Confirmation not found or access denied' });
    }

    // Update confirmation
    await pool.query(
      'UPDATE medication_confirmations SET confirmed_by_carer = true, carer_confirmed_at = NOW(), notes = $1 WHERE id = $2',
      [notes || null, confirmationId]
    );

    res.json({ message: 'Confirmation approved successfully' });
  } catch (error) {
    console.error('Confirm medication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit a medication confirmation (dependant)
router.post('/submit', authenticateToken, requireRole('dependant'), async (req: AuthRequest, res: Response) => {
  try {
    const { medicationId, scheduleId, photoPath } = req.body;
    const dependantId = req.user!.userId;

    if (!medicationId || !photoPath) {
      return res.status(400).json({ message: 'Medication ID and photo path are required' });
    }

    // Verify dependant owns this medication
    const medication = await pool.query(
      'SELECT * FROM medications WHERE id = $1 AND dependant_id = $2',
      [medicationId, dependantId]
    );

    if (medication.rows.length === 0) {
      return res.status(404).json({ message: 'Medication not found or access denied' });
    }

    // Create confirmation record
    const result = await pool.query(
      'INSERT INTO medication_confirmations (dependant_id, medication_id, schedule_id, photo_path) VALUES ($1, $2, $3, $4) RETURNING *',
      [dependantId, medicationId, scheduleId || null, photoPath]
    );

    res.status(201).json({
      message: 'Photo submitted successfully',
      confirmation: result.rows[0]
    });
  } catch (error) {
    console.error('Submit confirmation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;