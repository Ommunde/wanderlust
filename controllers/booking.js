const Booking = require("../models/booking");
const Listing = require("../models/listing");

// Create Booking
module.exports.createBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, guests } = req.body.booking;
        
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkInDate < today) {
            req.flash("error", "Check-in date cannot be in the past!");
            return res.redirect(`/listings/${id}`);
        }

        if (checkOutDate <= checkInDate) {
            req.flash("error", "Check-out date must be after check-in date!");
            return res.redirect(`/listings/${id}`);
        }

        // Check for overlapping bookings
        const overlappingBookings = await Booking.find({
            listing: id,
            status: { $in: ["pending", "confirmed"] },
            $or: [
                {
                    checkIn: { $lte: checkOutDate },
                    checkOut: { $gte: checkInDate }
                }
            ]
        });

        if (overlappingBookings.length > 0) {
            req.flash("error", "These dates are already booked! Please choose different dates.");
            return res.redirect(`/listings/${id}`);
        }

        // Calculate total price
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalPrice = listing.price * nights * guests;

        // Create booking
        const booking = new Booking({
            listing: id,
            user: req.user._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: parseInt(guests),
            totalPrice: totalPrice,
            status: "confirmed"
        });

        await booking.save();
        req.flash("success", "Booking confirmed successfully!");
        res.redirect(`/bookings/${booking._id}`);
    } catch (error) {
        req.flash("error", "Error creating booking. Please try again.");
        res.redirect(`/listings/${req.params.id}`);
    }
};

// Show Booking Details
module.exports.showBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate("listing")
            .populate("user");

        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/bookings");
        }

        // Check if user owns the booking
        if (!booking.user._id.equals(req.user._id)) {
            req.flash("error", "You don't have permission to view this booking!");
            return res.redirect("/bookings");
        }

        res.render("bookings/show.ejs", { booking });
    } catch (error) {
        req.flash("error", "Error loading booking details.");
        res.redirect("/bookings");
    }
};

// Show User's Bookings
module.exports.userBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate("listing")
            .sort({ createdAt: -1 });
        
        res.render("bookings/index.ejs", { bookings });
    } catch (error) {
        req.flash("error", "Error loading your bookings.");
        res.redirect("/listings");
    }
};

// Cancel Booking
module.exports.cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/bookings");
        }

        // Check if user owns the booking
        if (!booking.user.equals(req.user._id)) {
            req.flash("error", "You don't have permission to cancel this booking!");
            return res.redirect("/bookings");
        }

        // Check if booking can be cancelled (at least 1 day before check-in)
        const checkInDate = new Date(booking.checkIn);
        const today = new Date();
        const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilCheckIn < 1) {
            req.flash("error", "Cannot cancel booking less than 1 day before check-in!");
            return res.redirect(`/bookings/${bookingId}`);
        }

        booking.status = "cancelled";
        await booking.save();

        req.flash("success", "Booking cancelled successfully!");
        res.redirect("/bookings");
    } catch (error) {
        req.flash("error", "Error cancelling booking.");
        res.redirect("/bookings");
    }
};
