require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const logFile = path.join(__dirname, 'docstatus.log');

// Middleware de autenticación Basic
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const timestamp = new Date().toISOString();

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    const logEntry = `[${timestamp}] ERROR: Falta header de autorización`;
    fs.appendFileSync(logFile, logEntry + '\n', 'utf8');
    console.error(logEntry); // 👈 Render lo mostrará en Logs
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const [user, pass] = Buffer.from(base64Credentials, 'base64').toString().split(':');

  if (user !== process.env.AUTH_USER || pass !== process.env.AUTH_PASS) {
    const logEntry = `[${timestamp}] ERROR: Autenticación fallida para usuario=${user}`;
    fs.appendFileSync(logFile, logEntry + '\n', 'utf8');
    console.error(logEntry); // 👈 Render lo mostrará en Logs
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.authUser = user;
  next();
}

function writeLog(entry) {
  fs.appendFileSync(logFile, entry + '\n', 'utf8');
}

app.post('/docstatus/:docGUI', authMiddleware, (req, res) => {
  const docGUI = req.params.docGUI;
  const notification = req.body;
  const timestamp = new Date().toISOString();

  const logEntry = `[${timestamp}] DocGUI=${docGUI}, Estado=${notification.DocStatus}, Usuario=${req.authUser}`;
  writeLog(logEntry);

  console.log('📩 Notificación registrada:', logEntry);

  res.status(200).send();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servicio docStatus escuchando en puerto ${PORT}`);
});