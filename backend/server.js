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
        transports: ['websocket', 'polling'] // Fallback ekleyin
    },
    pingTimeout: 60000,
    pingInterval: 25000
});


const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(cors());
app.use(express.json());

// ✅ KRİTİK DÜZELTME: Bu middleware bloğunu tüm API rotalarından önce getirin
app.use((req, res, next) => {
  // `req.io` kullanarak Express'e Socket.IO nesnesini ekle
  req.io = io;
  next();
});


app.set('io', io);

// Statik dosyalar için middleware
app.use('/data', express.static(path.join(__dirname, 'src', 'data')));

// API rotaları
const userRoutes = require('./src/routes/userRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const roomRoutes = require('./src/routes/roomRoutes');
const playerRoutes = require('./src/routes/playerRoutes');
const contactRoutes = require('./src/routes/contactRoutes');

const pickPlayerRoutes = require('./src/routes/pickPlayerRoutes');

// MongoDB Atlas Bağlantısı
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB bağlı"))
  .catch(err => console.error("MongoDB bağlanamadı:", err));

// API rotalarını buraya ekleyeceğiz
app.use('/api/contact', contactRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/rooms', roomRoutes);


// Socket.IO Bağlantısı
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

// app.listen yerine server.listen kullanın
server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});
