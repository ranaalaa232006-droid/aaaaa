const express = require('express'); // Import express

const reviewController = require('../controllers/reviewcontroller'); // Import review controller

const authController = require('../controllers/authController'); // Import auth controller

const router = express.Router({ mergeParams: true }); // Get params from parent route

router.use(authController.protect); // Protect all review routes

router
  .route('/')
  .get(reviewController.getAllReviews) // GET all reviews
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router; // Export router