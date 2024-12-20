import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessRecord extends Document {
  userId: string;
  name: string;
  success: boolean;
  error?: string;
  status: string;
  reportGenerated: boolean;
  pdfGenerated: boolean;
  timestamp: Date;
}

const ProcessRecordSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  success: { type: Boolean, required: true },
  error: { type: String },
  status: { type: String, required: true },
  reportGenerated: { type: Boolean, default: false },
  pdfGenerated: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

export const ProcessRecord = mongoose.model<IProcessRecord>('ProcessRecord', ProcessRecordSchema); 