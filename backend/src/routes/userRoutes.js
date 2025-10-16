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
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

router.post('/request-email-change', protect, requestEmailChange);
router.get('/confirm-email/:token', confirmEmailChange);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;