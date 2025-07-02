import express from "express";
import Event from "../Models/event.js";
import LockedSeats from "../Models/lockedseats.js";
import mongoose from "mongoose";

mongoose
  .connect("mongodb://localhost:27017/lockSeat")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const app = express();
app.use(express.json());

//let flag = false;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/availableseats/:movieName", async (req, res) => {
  const { movieName } = req.params;
  console.log("Event Name:", movieName);
  const event = await Event.findOne({
    eventName: { $regex: movieName, $options: "i" },
  });
  console.log("Event Details:", event);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  console.log("seats:", event.seatsAvailable);
  res.json({ availableSeatQuantity: event.seatsAvailable });
});

app.post("/lockseat", async (req, res) => {
  const { seatNumbersList, eventName } = req.body;
  console.log(seatNumbersList, eventName);

  let event = await Event.findOne({
    eventName: { $regex: eventName, $options: "i" },
  });
  let lockedSeats = event.lockedSeatsList;
  console.log("event:", event, "lockedSeats:", lockedSeats);

  for (let seatNumber of seatNumbersList) {
    if (lockedSeats.includes(seatNumber)) {
      return res.status(400).json({ error: "some seats is already locked" });
    }
  }

  seatNumbersList.forEach((seatNumber) => {
    lockedSeats.push(seatNumber);
  });
  console.log("before update lockedSeats:", lockedSeats);
  let totalSeats = event.seatsAvailable;
  let newEventdetails = await Event.findOneAndUpdate(
    { eventName: eventName },
    {
      $set: {
        lockedSeatsList: lockedSeats,
        seatsLocked: lockedSeats.length,
        seatsAvailable: totalSeats - lockedSeats.length,
      },
    },
    { new: true }
  );
  console.log("after update lockedSeats:", newEventdetails);
  let existingLockedSeats = await LockedSeats.findOne({
    eventName: eventName,
  });
  console.log("existingLockedSeats:", existingLockedSeats);

  if (existingLockedSeats) {
    let updateLockedSeates = await LockedSeats.findOneAndUpdate(
      { eventName: eventName },
      {
        $set: {
          lockedSeatsList: lockedSeats,
        },
      },
      { new: true }
    );
  } else {
    let createLockedSeats = await LockedSeats.create({
      eventName: eventName,
      lockedSeatsList: lockedSeats,
    });
    console.log("Created:", createLockedSeats);
  }

  //flag = true;
  unlockSeats();
  return res.json({ lockedSeats: newEventdetails });
});

// if (flag) {
//   unlockSeats();
// }
function unlockSeats() {
  setInterval(async () => {
    let getlockedSeatsEvent = await LockedSeats.findOne();
    console.log("lockedSeats:", getlockedSeatsEvent);
    if (!getlockedSeatsEvent) {
      return res
        .status(404)
        .json({ error: "No locked seats found for this event" });
    }
    let eventName = getlockedSeatsEvent.eventName;
    let clearLockedSeats = await LockedSeats.findOneAndUpdate(
      { eventName: eventName },
      { lockedSeatsList: [] },
      { new: true }
    );
    let clearSeatsEvent = await Event.findOneAndUpdate(
      { eventName: eventName },
      {
        $set: {
          lockedSeatsList: [],
          seatsLocked: 0,
          seatsAvailable: 100,
        },
      },
      { new: true }
    );
    console.log("Cleared Locked Seats:", clearLockedSeats);
    console.log("Cleared Seats Event:", clearSeatsEvent);
  }, 5 * 60000); // 1 minutes
}
//----------------------------------------
// app.post("/createevent", async (req, res) => {
//   const { eventName, seatsAvailable } = req.body;
//   console.log("Event Name:", eventName);
//   console.log("Seats Available:", seatsAvailable);
//   if (!eventName || !seatsAvailable) {
//     return res
//       .status(400)
//       .json({ error: "Event name and seats available are required" });
//   }
//   const existingEvent = await Event.find({
//     eventName: { $regex: eventName, $options: "i" },
//   });
//   if (existingEvent.length > 0) {
//     return res.status(400).json({ error: "Event already exists" });
//   }
//   const newEvent = new Event({
//     eventName: eventName,
//     seatsAvailable: seatsAvailable,
//     seatsLocked: 0,
//     lockedSeatsList: [],
//   });
//   await newEvent.save();
//   console.log("New Event Created:", newEvent);
//   res.status(201).json(newEvent);
// });
export default app;
