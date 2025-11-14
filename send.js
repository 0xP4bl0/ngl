const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/send-stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const username = req.query.username;
    const question = req.query.question;
    const count = parseInt(req.query.count);

    res.write(`data: ${JSON.stringify({ type: "start" })}\n\n`);

    for (let i = 1; i <= count; i++) {
        res.write(`data: ${JSON.stringify({ type: "progress", message: i })}\n\n`);

        try {
            await sendSingleMessage(username, question, i);
            res.write(`data: ${JSON.stringify({ type: "success", id: i })}\n\n`);
        } catch (err) {
            res.write(`data: ${JSON.stringify({ type: "fail", id: i })}\n\n`);
        }

        await new Promise(r => setTimeout(r, 500));

        if (i % 30 === 0) {
            res.write(`data: ${JSON.stringify({ type: "cd", message: "Pausing 5 seconds..." })}\n\n`);
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
});

async function sendSingleMessage(username, question, num) {
    const data = new URLSearchParams({
        username,
        question,
        deviceId: "ada4122a-1453-4c73-b359-5822b9448d8d"
    });

    return axios.post("https://ngl.link/api/submit", data, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla"
        }
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
