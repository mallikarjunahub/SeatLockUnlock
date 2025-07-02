import mongoose from "mongoose";

const lockedSeatsSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  lockedSeatsList: { type: [Number], default: [] },
});

export default mongoose.model("LockedSeats", lockedSeatsSchema);
