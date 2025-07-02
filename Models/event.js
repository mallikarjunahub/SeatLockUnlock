import mongoose from "mongoose";
const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  seatsAvailable: { type: Number, default: 100 },
  seatsLocked: { type: Number, default: 0 },
  lockedSeatsList: { type: [Number], default: [] },
});

export default mongoose.model("Event", eventSchema);
