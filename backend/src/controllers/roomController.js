// backend/src/controllers/roomController.js
const Room = require("../models/Room");
const playersData = require("../data/players.json");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');


// Oda oluşturma
exports.createRoom = async (req, res) => {
  const { roomName, maxPlayers, leagues, password } = req.body;
  const { _id: userId, username } = req.user;

  try {
    const roomExists = await Room.findOne({ roomName });
    if (roomExists) {
      return res.status(400).json({ message: "Bu oda adı zaten kullanılıyor." });
    }

    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const newRoom = new Room({
      roomName,
      password: hashedPassword,
      creator: userId,
      players: [
        {
          user: userId,
          name: username,
          team: { squad: [] },
        },
      ],
      maxPlayers,
      leagues,
    });

    await newRoom.save();
    res.status(201).json({ message: "Oda başarıyla oluşturuldu.", room: newRoom });
  } catch (error) {
    console.error("Oda oluşturma hatası:", error);
    res.status(500).json({ message: "Oda oluşturulurken bir hata oluştu." });
  }
};

// Oda listesini getirme
exports.getRooms = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Lütfen giriş yapın." });

    const rooms = await Room.find().populate("players.user", "username email");
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Oda listesi hatası:", error);
    res.status(500).json({ message: "Oda listesi alınamadı." });
  }
};

// Odaya katılma
exports.joinRoom = async (req, res) => {
  const { roomId, password } = req.body;
  const { _id: userId, username } = req.user;


  try {
    const room = await Room.findById(roomId).populate("players.user", "username email");
    if (!room) return res.status(404).json({ message: "Oda bulunamadı." });

    // Şifre kontrolü
    if (room.password) {
      const isMatch = await bcrypt.compare(password, room.password);
      if (!isMatch) return res.status(401).json({ message: "Yanlış oda şifresi." });
    }

    // Kullanıcı zaten odadaysa tekrar ekleme
    const currentPlayer = room.players.find(p => p.user._id.toString() === userId.toString());
    if (currentPlayer) return res.status(200).json({ message: "Zaten odadasınız.", room });

    // Oda doluluk kontrolü
    if (room.players.length >= room.maxPlayers) return res.status(400).json({ message: "Oda dolu." });
    const alreadyInRoom = room.players.some(p => p.user.toString() === req.user.id);

    if (alreadyInRoom) {
      // Hata yerine odayı döndür
      return res.json({ message: "Zaten odadasınız", room });
    }
    // Oyuncuyu odaya ekle
    room.players.push({ user: userId, name: username, team: { squad: [] } });
    await room.save();

    const updatedRoom = await Room.findById(roomId).populate("players.user", "username email");

    if (req.io) {
      req.io.to(roomId).emit("updateRoom", updatedRoom);
    }

    res.status(200).json({ message: "Odaya başarıyla katıldınız.", room: updatedRoom });
  } catch (error) {
    console.error("Odaya katılma hatası:", error);
    res.status(500).json({ message: "Odaya katılırken bir hata oluştu." });
  }
};

// backend/src/controllers/roomController.js
exports.setReady = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Oda bulunamadı" });

    const player = room.players.find(p => p.user.toString() === userId.toString());
    if (!player) return res.status(400).json({ message: "Oyuncu odada bulunamadı" });

    // isReady durumunu tersine çevir
    player.isReady = !player.isReady;

    // Tüm oyuncuların hazır olup olmadığını kontrol et
    const roomIsFull = room.players.length === room.maxPlayers;
    const allPlayersReady = room.players.every(p => p.isReady);

    if (roomIsFull && allPlayersReady && room.status === "waiting") {
      room.status = "drafting";
    }

    // DÜZELTME: Mongoose'a 'players' dizisinin değiştiğini bildiriyoruz.
    room.markModified('players');

    await room.save(); // <-- Artık değişikliği kaydedecek

    // Güncel oda bilgisini tüm istemcilere gönder
    const updatedRoom = await Room.findById(roomId).populate('players.user', 'username');

        console.log(`[SOCKET_DEBUG] Oda ID ${roomId} için 'updateRoom' yayılıyor. req.io var mı? ${!!req.io}`);


    if (req.io) {
      req.io.to(roomId).emit("updateRoom", updatedRoom);
    }


    res.status(200).json(updatedRoom);
  } catch (err) {
    console.error("Hazır olma hatası:", err);
    res.status(500).json({ message: "Hazır olma hatası", error: err.message });
  }
};


// Odadan ayrılma
exports.leaveRoom = async (req, res) => {
  const { roomId } = req.body;
  const userId = req.user._id;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Oda bulunamadı." });
    // Eğer odada sadece bu kullanıcı varsa, oda silinsin
    if (room.players.length === 1 && room.players[0].user.toString() === userId.toString()) {
      await Room.findByIdAndDelete(roomId);
      // Socket ile odadaki diğer kullanıcı yok, emit gerek yok
      return res.status(200).json({ message: "Odadan ayrıldınız ve oda silindi." });
    }

    room.players = room.players.filter(p => p.user.toString() !== userId.toString());
     // Eğer ayrılan kişi oda lideriyse, kalanlardan rastgele birini lider yap
    if (room.creator.toString() === userId.toString() && room.players.length > 0) {
      const randomIndex = Math.floor(Math.random() * room.players.length);
      room.creator = room.players[randomIndex].user;
    }
    await room.save();

    const updatedRoom = await Room.findById(roomId).populate("players.user", "username email");
    if (req.io) {
      req.io.to(roomId).emit("updateRoom", updatedRoom);
    }
    res.status(200).json({ message: "Odadan ayrıldınız.", room: updatedRoom });
  } catch (error) {
    console.error("Odadan ayrılma hatası:", error);
    res.status(500).json({ message: "Odadan ayrılırken bir hata oluştu." });
  }
};

exports.kickPlayer = async (req, res) => {
    const { roomId, playerId } = req.body;
    const userId = req.user._id;

    try {
        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ message: "Oda bulunamadı." });

        // Sadece oda sahibi kick atabilir
        if (room.creator.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Sadece oda sahibi oyuncu çıkarabilir." });
        }

        const playerIndex = room.players.findIndex(p => p.user.toString() === playerId);
        if (playerIndex === -1) return res.status(404).json({ message: "Oyuncu odada bulunamadı." });

        room.players.splice(playerIndex, 1); // oyuncuyu çıkar
        await room.save();

        // Güncel oda bilgisi tüm istemcilere gönder
        const updatedRoom = await Room.findById(roomId).populate("players.user", "username email");

        res.status(200).json({ message: "Oyuncu odadan çıkarıldı.", room: updatedRoom });
        if (req.io) {
      req.io.to(roomId).emit("updateRoom", updatedRoom);
    }

    } catch (error) {
        console.error("Oyuncu çıkarma hatası:", error);
        res.status(500).json({ message: "Oyuncu çıkarılamadı." });
    }
};

// Arkadaş daveti (socket emit)
exports.inviteFriend = async (req, res) => {
  const { roomId, friendId } = req.body;

  try {
    if (req.app.get("io")) {
      req.app.get("io").to(friendId).emit("roomInvite", { roomId, from: req.user.username });
    }

    res.status(200).json({ message: "Davet gönderildi." });
  } catch (error) {
    console.error("Davet gönderme hatası:", error);
    res.status(500).json({ message: "Davet gönderilemedi." });
  }
};

// Tek bir odayı getirme
exports.getRoomById = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId).populate("players.user", "email username");
    if (!room) return res.status(404).json({ message: "Oda bulunamadı." });

    res.status(200).json(room);
  } catch (error) {
    console.error("Oda bilgisi hatası:", error);
    res.status(500).json({ message: "Oda bilgisi alınamadı." });
  }
};

