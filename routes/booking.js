const express = require("express");
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// Create booking (POST /listings/:id/bookings)
router.post("/", isLoggedIn, bookingController.createBooking);

module.exports = router;
