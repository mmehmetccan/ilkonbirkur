// backend/src/routes/userRoutes.js

const express = require("express");
const { 
    registerUser, 
    authUser, 
    forgotPassword, 
    resetPassword, 
    getProfile, 
    updateProfile, 
    requestEmailChange, 
    confirmEmailChange, 
    getMyAccount
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware"); // Auth middleware'nizin adı

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);

// Şifre Sıfırlama
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// E-posta Değiştirme
router.post('/request-email-change', protect, requestEmailChange);
router.get('/confirm-email/:token', confirmEmailChange); // Kullanıcı linke tıklar, token body'de değil, URL'de (params) gelir.

// Profil
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;