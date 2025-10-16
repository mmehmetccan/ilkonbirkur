// backend/src/controllers/pickPlayerController.js
import Room from "../models/Room.js";
import fs from "fs";
import path from "path";

const playersPath = path.resolve("./src/data/players.json");
const players = JSON.parse(fs.readFileSync(playersPath, "utf8"));

export const pickPlayer = async (req, res) => {
    const { playerName, assignedPosition } = req.body;
    const { roomId } = req.params;
    const userId = req.user._id;

    try {
        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ message: "Oda bulunamadı" });

        const currentPickerIndex = room.draft.currentPick;
        const currentPickerId = room.players[currentPickerIndex].user.toString();

        if (userId.toString() !== currentPickerId) {
            return res.status(403).json({ message: "Sıra sizde değil." });
        }
        const positionGroups = {
          RW: ["RW", "RM"],
          RM: ["RW", "RM"],

          LW: ["LW", "LM"],
          LM: ["LW", "LM"],

          ST: ["ST", "CF"],
          CB: ["CB", "RCB", "LCB"],
        };

        const player = players.find(
          p => p.short_name === playerName || p.player_name === playerName
        );
        if (!player) return res.status(400).json({ message: "Oyuncu bulunamadı" });

        const currentPlayer = room.players.find(p => p.user.toString() === userId.toString());
        if (!currentPlayer) return res.status(400).json({ message: "Bu odada değilsiniz" });

        const alreadyPicked = room.players.some(p =>
            p.team.squad.some(s => s.short_name === playerName)
        );
        if (alreadyPicked) {
            return res.status(400).json({ message: "Bu oyuncu zaten seçildi" });
        }

        if (currentPlayer.team.squad.length >= 11) {
            return res.status(400).json({ message: "Zaten 11 oyuncu seçtiniz" });
        }

        const playerWithAssignedPosition = { ...player, assignedPosition };
        currentPlayer.team.squad.push(playerWithAssignedPosition);

        let nextPickIndex = (room.draft.currentPick + 1) % room.players.length;
        const allSquadsFull = room.players.every(p => p.team.squad.length >= 11);

        if (allSquadsFull) {
            room.status = "draft_finished";
            room.draft.isDrafting = false;
        } else {
            room.draft.currentPick = nextPickIndex;
        }

        await room.save();

        const updatedRoom = await Room.findById(roomId).populate('players.user', 'username');

        if (req.io) {
            req.io.to(roomId).emit("updateRoom", updatedRoom);

        }

        res.status(200).json({ message: "Oyuncu başarıyla seçildi.", room: updatedRoom });
    } catch (error) {
        console.error("Oyuncu seçme hatası:", error);
        res.status(500).json({ message: "Oyuncu seçilirken bir hata oluştu." });
    }
};


export const setFormation = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { formation } = req.body;
    const userId = req.user._id.toString();

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Oda bulunamadı." });

    room.formation.set(userId, formation);

    await room.save();
    const updatedRoom = await Room.findById(roomId).populate('players.user', 'username');
if (req.io) {
        req.io.to(roomId).emit("updateRoom", updatedRoom);
    }

    res.json({ message: "Formasyon kaydedildi.", formation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};
