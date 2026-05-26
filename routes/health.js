import express from 'express';

const router = express.Router();

// Lightweight health check for Render / Cold-start prevention
router.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString() 
    });
});

// R8-FIX: Lightweight ping for UptimeRobot / cold-start prevention
// Configure UptimeRobot to hit GET /api/health/ping every 5 minutes
// This prevents Render free-tier instances from sleeping (15 min timeout)
router.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

export default router;
