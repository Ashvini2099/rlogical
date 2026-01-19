import { Router } from 'express';
import { 
    getEvents, 
    getEventById, 
    createEvent, 
    getEventAvailability, 
    purchaseTickets 
} from '../controllers/events.controller';

const router = Router();

// Returns all events with basic details
router.get('/events', getEvents);

// Returns specific event with nested sections/rows
router.get('/events/:id', getEventById);

// Returns availability of each section and row
router.get('/events/:id/availability', getEventAvailability);

// Create a new event (for testing/setup)
router.post('/events', createEvent);

// Purchase tickets with availability validation
router.post('/events/:id/purchase', purchaseTickets);

export default router;