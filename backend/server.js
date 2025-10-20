// src/server.js
require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "https://ilkonbirkur.com",
            "http://ilkonbirkur.com",
            "http://localhost:5173",
            "http://localhost:3000"
        ],
        methods: ["GET", "POST"],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    pingTimeout: 60000,
    pingInterval: 25000
});


const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  req.io = io;
  next();
});


app.set('io', io);

app.use('/data', express.static(path.join(__dirname, 'src', 'data')));

const userRoutes = require('./src/routes/userRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const roomRoutes = require('./src/routes/roomRoutes');
const playerRoutes = require('./src/routes/playerRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const squadBuilderRoutes = require('./src/routes/squadBuilderRoutes');
const sharedSquadRoutes = require('./src/routes/sharedSquadRoutes');
const singlePlayerRoutes = require('./src/routes/singlePlayerRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const pickPlayerRoutes = require('./src/routes/pickPlayerRoutes');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB bağlı"))
  .catch(err => console.error("MongoDB bağlanamadı:", err));

app.use('/api/contact', contactRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/squad-builder', squadBuilderRoutes);
app.use('/api/shared-squads', sharedSquadRoutes);
app.use('/api/single-player', singlePlayerRoutes);
app.use('/api/stats', statsRoutes);

io.on('connection', (socket) => {
    console.log(`Yeni bir kullanıcı bağlandı: ${socket.id}`);

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} ${roomId} odasına katıldı`);
    });

    socket.on('disconnect', () => {
        console.log(`Kullanıcı bağlantısı kesildi: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});
