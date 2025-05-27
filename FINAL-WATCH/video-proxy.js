// video-proxy.js
const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PROXY_PORT || 4000;

app.get('/proxy', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('Missing video URL');

    try {
        const response = await axios.get(videoUrl, {
            responseType: 'stream',
            headers: {
                'Range': req.headers.range || '',
            }
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
        if (response.headers['content-length'])
            res.setHeader('Content-Length', response.headers['content-length']);
        if (response.headers['accept-ranges'])
            res.setHeader('Accept-Ranges', 'bytes');

        response.data.pipe(res);
    } catch (err) {
        console.error('Video proxy error:', err.message);
        res.status(500).send('Failed to stream video.');
    }
});

app.listen(PORT, () => {
    console.log(`🎥 Video Proxy Server running on http://localhost:${PORT}`);
});
