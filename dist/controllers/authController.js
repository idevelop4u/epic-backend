"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const User_1 = require("../models/User");
const signup = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        // Validate input
        if (!email || !password || !username) {
            res.status(400).json({ message: 'Email, password, and username are required' });
            return;
        }
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            res.status(400).json({ message: 'User with this email or username already exists' });
            return;
        }
        // Create new user (password hashing is handled in the model pre-save hook)
        const newUser = new User_1.default({ email, username, password });
        await newUser.save();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser._id, email: newUser.email, username: newUser.username }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        // Find user by email
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        // Compare passwords
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, email: user.email, username: user.username }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
exports.login = login;
//# sourceMappingURL=authController.js.map