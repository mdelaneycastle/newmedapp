import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all medications for a dependant (carer access)
router.get('/dependant/:dependantId', authenticateToken, requireRole('carer'), async (req: AuthRequest, res) => {
  try {
    const { dependantId } = req.params;
    const carerId = req.user!.userId;

    // Verify carer has access to this dependant
    const relationship = await pool.query(
      'SELECT * FROM carer_dependant_relationships WHERE carer_id = $1 AND dependant_id = $2',
      [carerId, dependantId]
    );

    if (relationship.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this dependant' });
    }

    const medications = await pool.query(
      `SELECT m.*, ms.id as schedule_id, ms.time_of_day, ms.days_of_week, ms.active
       FROM medications m
       LEFT JOIN medication_schedules ms ON m.id = ms.medication_id
       WHERE m.dependant_id = $1
       ORDER BY m.name, ms.time_of_day`,
      [dependantId]
    );

    res.json(medications.rows);
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get medications for logged-in dependant
router.get('/mine', authenticateToken, requireRole('dependant'), async (req: AuthRequest, res) => {
  try {
    const dependantId = req.user!.userId;

    const medications = await pool.query(
      `SELECT m.*, ms.id as schedule_id, ms.time_of_day, ms.days_of_week, ms.active
       FROM medications m
       LEFT JOIN medication_schedules ms ON m.id = ms.medication_id
       WHERE m.dependant_id = $1
       ORDER BY m.name, ms.time_of_day`,
      [dependantId]
    );

    res.json(medications.rows);
  } catch (error) {
    console.error('Get my medications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new medication (carer only)
router.post('/', authenticateToken, requireRole('carer'), async (req: AuthRequest, res) => {
  try {
    const { name, dosage, instructions, dependantId, schedules } = req.body;
    const carerId = req.user!.userId;

    if (!name || !dependantId) {
      return res.status(400).json({ message: 'Name and dependant ID are required' });
    }

    // Verify carer has access to this dependant
    const relationship = await pool.query(
      'SELECT * FROM carer_dependant_relationships WHERE carer_id = $1 AND dependant_id = $2',
      [carerId, dependantId]
    );

    if (relationship.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this dependant' });
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Create medication
      const medicationResult = await pool.query(
        'INSERT INTO medications (name, dosage, instructions, dependant_id, carer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, dosage, instructions, dependantId, carerId]
      );

      const medication = medicationResult.rows[0];

      // Create schedules if provided
      if (schedules && schedules.length > 0) {
        for (const schedule of schedules) {
          await pool.query(
            'INSERT INTO medication_schedules (medication_id, time_of_day, days_of_week) VALUES ($1, $2, $3)',
            [medication.id, schedule.time_of_day, schedule.days_of_week]
          );
        }
      }

      // Create notification for dependant
      await pool.query(
        'INSERT INTO notifications (dependant_id, medication_id, message, type, scheduled_time) VALUES ($1, $2, $3, $4, NOW())',
        [dependantId, medication.id, `New medication "${name}" has been added to your schedule`, 'schedule_update']
      );

      await pool.query('COMMIT');

      res.status(201).json({
        message: 'Medication created successfully',
        medication
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update medication schedule (carer only)
router.put('/:medicationId/schedule', authenticateToken, requireRole('carer'), async (req: AuthRequest, res) => {
  try {
    const { medicationId } = req.params;
    const { schedules } = req.body;
    const carerId = req.user!.userId;

    // Verify carer owns this medication
    const medication = await pool.query(
      'SELECT * FROM medications WHERE id = $1 AND carer_id = $2',
      [medicationId, carerId]
    );

    if (medication.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this medication' });
    }

    await pool.query('BEGIN');

    try {
      // Delete existing schedules
      await pool.query('DELETE FROM medication_schedules WHERE medication_id = $1', [medicationId]);

      // Add new schedules
      for (const schedule of schedules) {
        await pool.query(
          'INSERT INTO medication_schedules (medication_id, time_of_day, days_of_week) VALUES ($1, $2, $3)',
          [medicationId, schedule.time_of_day, schedule.days_of_week]
        );
      }

      // Notify dependant
      await pool.query(
        'INSERT INTO notifications (dependant_id, medication_id, message, type, scheduled_time) VALUES ($1, $2, $3, $4, NOW())',
        [medication.rows[0].dependant_id, medicationId, `Schedule for "${medication.rows[0].name}" has been updated`, 'schedule_update']
      );

      await pool.query('COMMIT');

      res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;