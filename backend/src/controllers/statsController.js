const AppStat = require('../models/appStatModel');


exports.incrementPlayerAssignment = async (req, res) => {
    try {
        const stats = await AppStat.findOneAndUpdate(
            { name: 'global_stats' }, // Sabit dökümanımızı bul
            { $inc: { totalPlayerAssignments: 1 } }, // Sayacı 1 artır
            {
                upsert: true, // Eğer döküman yoksa oluştur
                new: true, // Güncellenmiş (veya yeni) dökümanı döndür
                setDefaultsOnInsert: true // Oluştururken şemadaki default'ları uygula
            }
        );

        // Başarılı olduğunu bildirir, sayaç ön yüzde kullanılmayacağı için
        // sadece 'ok' dönebiliriz.
        res.status(200).json({ status: 'ok', totalAssignments: stats.totalPlayerAssignments });

    } catch (error) {
        console.error("İstatistik (atama) güncellenirken hata:", error);
        // Hata olsa bile frontend'i kilitlememek için 500 dönebiliriz
        res.status(500).json({ message: "İstatistik güncellenemedi." });
    }
};