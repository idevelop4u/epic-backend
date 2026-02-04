"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const User_1 = require("../models/User");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            res.status(401).json({ message: 'Access token required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=authMiddleware.js.map