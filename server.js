'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}
const applicationsTxtPath = path.join(dataDir, 'applications.txt');
if (!fs.existsSync(applicationsTxtPath)) {
	fs.writeFileSync(applicationsTxtPath, '', 'utf8');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (serves index.html and assets from the project directory)
app.use(express.static(__dirname));

// Health check
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Applications endpoint -> append to applications.txt as NDJSON (one JSON per line)
app.post('/api/applications', (req, res) => {
	const { name, email, phone, plan } = req.body || {};
	if (!name || !email || !phone) {
		return res.status(400).json({ error: 'Missing required fields' });
	}
	try {
		const record = {
			name: String(name).trim(),
			email: String(email).trim(),
			phone: String(phone).trim(),
			plan: plan ? String(plan).trim() : null,
			user_agent: req.get('user-agent') || null,
			referrer: req.get('referer') || null,
			ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || null,
			created_at: new Date().toISOString(),
		};
		fs.appendFileSync(applicationsTxtPath, JSON.stringify(record) + '\n', 'utf8');
		return res.status(201).json({ ok: true });
	} catch (err) {
		console.error('Failed to append application', err);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
