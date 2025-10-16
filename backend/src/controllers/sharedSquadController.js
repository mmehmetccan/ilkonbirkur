const SharedSquad = require('../models/SharedSquad');

exports.createSharedSquad = async (req, res) => {
    const { title, description, squad, formation, squadImageUrl } = req.body;

    let authorId = null;
    let authorName = "Misafir";

    if (req.user) {
        authorId = req.user._id;
        authorName = req.user.username;
    }

    try {
        const newSharedSquad = new SharedSquad({
            title,
            description,
            squad,
            formation,
            squadImageUrl,
            author: authorId,
            authorName
        });

        const savedSquad = await newSharedSquad.save();
        res.status(201).json(savedSquad);
    } catch (error) {
        res.status(500).json({ message: "Kadro kaydedilirken bir hata oluştu.", error: error.message });
    }
};
exports.getSharedSquads = async (req, res) => {
    try {
        const squads = await SharedSquad.find().sort({ createdAt: -1 }); // En yeniler en üstte
        res.status(200).json(squads);
    } catch (error) {
        res.status(500).json({ message: "Kadrolar getirilirken bir hata oluştu." });
    }
};

exports.getSharedSquadById = async (req, res) => {
    try {
        const squad = await SharedSquad.findById(req.params.id);
        if (!squad) {
            return res.status(404).json({ message: "Kadro bulunamadı." });
        }
        res.status(200).json(squad);
    } catch (error) {
        res.status(500).json({ message: "Kadro detayı getirilirken bir hata oluştu." });
    }
};

exports.likeSquad = async (req, res) => {
    try {
        const squad = await SharedSquad.findById(req.params.id);
        const userId = req.user._id;

        squad.dislikes.pull(userId);

        const hasLiked = squad.likes.includes(userId);
        if (hasLiked) {
            squad.likes.pull(userId);
        } else {
            squad.likes.push(userId);
        }

        const updatedSquad = await squad.save();
        res.status(200).json(updatedSquad);
    } catch (error) {
        res.status(500).json({ message: "Beğenme işlemi sırasında hata oluştu." });
    }
};

exports.dislikeSquad = async (req, res) => {
    try {
        const squad = await SharedSquad.findById(req.params.id);
        const userId = req.user._id;

        squad.likes.pull(userId);

        const hasDisliked = squad.dislikes.includes(userId);
        if (hasDisliked) {
            squad.dislikes.pull(userId);
        } else {
            squad.dislikes.push(userId);
        }

        const updatedSquad = await squad.save();
        res.status(200).json(updatedSquad);
    } catch (error) {
        res.status(500).json({ message: "Beğenmeme işlemi sırasında hata oluştu." });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const squad = await SharedSquad.findById(req.params.id);

        const newComment = {
            user: req.user._id,
            username: req.user.username,
            text: text,
        };

        squad.comments.push(newComment);
        const updatedSquad = await squad.save();
        res.status(201).json(updatedSquad);
    } catch (error) {
        res.status(500).json({ message: "Yorum eklenirken bir hata oluştu." });
    }
};