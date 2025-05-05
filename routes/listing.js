const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const {isLoggedIn, isOwner} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer')
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage })

router
    .route("/")
    .get(listingController.index)                                                          // index
    .post(isLoggedIn, upload.single("listing[image]"), listingController.createListing);   // create

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    .get(listingController.showListing)                              // show
    .put(isLoggedIn, isOwner, upload.single("listing[image]"), listingController.updateListing)       // update
    .delete(isLoggedIn, isOwner, listingController.destroyListing);  // delete

//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, listingController.renderEditForm);

module.exports = router;