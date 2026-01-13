const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// Show all user bookings
router.get("/", isLoggedIn, bookingController.userBookings);

// Show specific booking
router.get("/:bookingId", isLoggedIn, bookingController.showBooking);

// Cancel booking
router.delete("/:bookingId", isLoggedIn, bookingController.cancelBooking);

module.exports = router;
