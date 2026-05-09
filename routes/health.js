import express from 'express';

const router = express.Router();

// Full health check (for debugging/monitoring)
router.get('/', (req, res) => {
    const mem = process.memoryUsage();
    res.status(200).json({
        success: true,
        status: 'healthy',
        service: 'Malaf Legal ERP Backend',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        // R8-FIX: Memory info for monitoring dashboards
        memory: {
            heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
            rssMB: Math.round(mem.rss / 1024 / 1024),
        },
        version: process.env.npm_package_version || '1.0.0',
    });
});

// R8-FIX: Lightweight ping for UptimeRobot / cold-start prevention
// Configure UptimeRobot to hit GET /api/health/ping every 5 minutes
// This prevents Render free-tier instances from sleeping (15 min timeout)
router.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

export default router;
