import { Request, Response } from 'express';
import { db } from '../config/db';
import { ResultSetHeader } from 'mysql2';

// GET ALL EVENTS
export const getEvents = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query('SELECT * FROM events');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events' });
    }
};

// GET SINGLE EVENT (With Sections and Rows)
export const getEventById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // This query joins all three tables to get a complete view
        const [rows]: any = await db.query(`
      SELECT 
        e.id as eventId, e.title, e.date, e.location,
        s.id as sectionId, s.name as sectionName, s.price,
        r.id as rowId, r.row_label, r.total_seats
      FROM events e
      LEFT JOIN sections s ON e.id = s.event_id
      LEFT JOIN seat_rows r ON s.id = r.section_id
      WHERE e.id = ?
    `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Formatting the flat SQL join result into a nested JSON object
        const event = {
            id: rows[0].eventId,
            title: rows[0].title,
            date: rows[0].date,
            location: rows[0].location,
            sections: [] as any[]
        };

        rows.forEach((row: any) => {
            let section = event.sections.find(s => s.id === row.sectionId);
            if (!section && row.sectionId) {
                section = { id: row.sectionId, name: row.sectionName, price: row.price, rows: [] };
                event.sections.push(section);
            }
            if (row.rowId) {
                section.rows.push({ id: row.rowId, label: row.row_label, seats: row.total_seats });
            }
        });

        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching event details' });
    }
};

// CREATE EVENT
export const createEvent = async (req: Request, res: Response) => {
    const { name, date, location, sections } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [eventResult] = await connection.query<ResultSetHeader>(
            'INSERT INTO events (title, date, location) VALUES (?, ?, ?)',
            [name, date, location]
        );
        const eventId = eventResult.insertId;

        for (const section of sections) {
            const [secResult] = await connection.query<ResultSetHeader>(
                'INSERT INTO sections (event_id, name, total_seats) VALUES (?, ?, ?)',
                [eventId, section.name, 0]
            );
            const sectionId = secResult.insertId;

            for (const row of section.rows) {
                await connection.query(
                    'INSERT INTO seat_rows (section_id, row_label, total_seats) VALUES (?, ?, ?)',
                    [sectionId, row.name, row.totalSeats]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Event created successfully', eventId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to create event' });
    } finally {
        connection.release();
    }
};

// Get Event Availability
export const getEventAvailability = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [availability]: any = await db.query(`
      SELECT 
        s.id AS sectionId, s.name AS sectionName, s.total_seats AS sectionCapacity,
        r.id AS rowId, r.row_label, r.total_seats AS rowCapacity,
        COALESCE(SUM(b.tickets), 0) AS bookedTickets
      FROM sections s
      JOIN seat_rows r ON s.id = r.section_id
      LEFT JOIN bookings b ON r.id = b.seat_row_id
      WHERE s.event_id = ?
      GROUP BY r.id
    `, [id]);

        res.json(availability);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching availability' });
    }
};

// Purchase Tickets
export const purchaseTickets = async (req: Request, res: Response) => {
    const { event_id, section_id, seat_row_id, tickets } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Lock the row and check availability (Prevents Race Conditions)
        const [rows]: any = await connection.query(
            `SELECT total_seats FROM seat_rows WHERE id = ? FOR UPDATE`,
            [seat_row_id]
        );

        const [booked]: any = await connection.query(
            `SELECT SUM(tickets) as total FROM bookings WHERE seat_row_id = ?`,
            [seat_row_id]
        );

        const available = rows[0].total_seats - (booked[0].total || 0);

        if (tickets > available) {
            await connection.rollback();
            return res.status(400).json({ message: 'Not enough seats available' });
        }

        // Apply group discount if quantity >= 4
        const groupDiscount = tickets >= 4;

        // Insert Booking
        await connection.query(
            `INSERT INTO bookings (event_id, section_id, seat_row_id, tickets, discount_applied) 
       VALUES (?, ?, ?, ?, ?)`,
            [event_id, section_id, seat_row_id, tickets, groupDiscount]
        );

        await connection.commit();
        res.status(200).json({ message: 'Purchase successful', groupDiscount });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Transaction failed' });
    } finally {
        connection.release();
    }
};