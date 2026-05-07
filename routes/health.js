import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        service: 'Malaf Legal ERP Backend',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
