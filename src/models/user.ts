import mongoose, { Document, Schema, Types } from "mongoose";

export interface User extends Document {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    verifyCode: string;
    verifyCodeExpiry: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema<User> = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: [true, 'username is required'],
        unique: true,
        trim: true,
        match: [/.+\@.+\..+/, 'please use a valid email address']
    },
    password: {
        type: String,
        required: true,
    },
    verifyCode: {
        type: String,
        required: [true, "verify code is required"],
    },
    verifyCodeExpiry: {
        type: Date,
        reruired: [true, "verify code expiry is required"],
    },
}, {timestamps: true})

const UserModel = (mongoose.models.User) as mongoose.Model<User> || (mongoose.model<User>("User", UserSchema))
export default UserModel
