import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Need to make a user model 
// import User from '../models/User';

export const signUp = async (req: Request, res: Response) : Promise<void> =>
{
    try {
        const {email, password, username} = req.body;

        // Check if the User already exists

        // const existingUser = await User.findOne({email});
        // if (existingUser) {
        //     res.status(400).json({message: 'User already exists'});
        //     return;
        // }

        // Hash the password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and Save User (Pseudo code)
        // const newUser = new User({email, username, password: hashedPassword});
        // await newUser.save();

        res.status(201).json({message: "User registered successfully"});

    }
    catch (error) {
        res.status(500).json({message: "Server error during signup", error});
    }

};

