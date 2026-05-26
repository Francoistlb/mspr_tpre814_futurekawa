const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', pays: process.env.PAYS }));
app.use('/lots', require('./routes/lots'));
app.use('/mesures', require('./routes/mesures'));

module.exports = app;