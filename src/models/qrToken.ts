// src/models/qrToken.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface QRToken extends Document {
  _id: Types.ObjectId;
  userId: string;
  status: string;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QRTokenSchema = new Schema<QRToken>({
  userId: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending','approved'],
    default: 'pending',
  },
  expiry: {
    type: Date,
    required: true,
    default: new Date(Date.now() + 2 * 60 * 1000),
  },
}, {timestamps: true});

const QRTokenModel = (mongoose.models.QRToken) as mongoose.Model<QRToken> || (mongoose.model<QRToken>('QRToken', QRTokenSchema))
export default QRTokenModel
