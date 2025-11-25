import mongoose, { Schema, Document, models } from "mongoose";

const FuelDetectionSchema = new Schema({
  "id": { type: String },
  "ทะเบียนพาหนะ": { type: String },
  "วันที่": { type: String },
  "datetime5mins": { type: Date, default: null },
  "mark_id": { type: Number },
  "chart_url": { type: String },
  "result": { type: String, enum: ['ปกติ', 'ผิดปกติ'], default: null },
  "liter": { type: Number, default: null },
  "fuel_diff_5min_ago": { type: Number, default: null },
  "updated_at": { type: Date, default: null }
}, {
  collection: "fuel-detection"
});


export const FuelDetection = mongoose.model("fuel-detection", FuelDetectionSchema);