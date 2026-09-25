const express = require('express'); // Import Express
const tourController = require('../controllers/tourController'); // Import tour controller
const authController = require('../controllers/authController'); // Import authentication controller
const reviewRouter = require('./reviewRoutes'); // Import review routes
const viewsController = require('../controllers/viewController');

const router = express.Router(); // Create Express router

router.use('/:tourId/reviews', reviewRouter); // /tours/:tourId/reviews



router // TOP 5 TOURS
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours); // Get top 5 tours

router // TOUR STATS
  .route('/tour-stats')
  .get(tourController.getTourStats); // Get tour statistics

router // MONTHLY PLAN
  .route('/monthly-plan/:year')
  .get(
    authController.protect, // User must be logged in
    authController.restrictTo('admin', 'lead-guide'), // Only admin and lead-guide can access
    tourController.getMonthlyPlan // Get monthly plan
  );
  
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit') // route to find tours within a certain distance from a location
  .get(tourController.getToursWithin); // call the getToursWithin controller (endpoint)

router
  .route('/distances/:latlng/unit/:unit') // route to calculate the distance from a point to each tour
  .get(tourController.getDistances); // call the getDistances controller

router // ALL TOURS + CREATE TOUR
  .route('/')
  .get(tourController.getAllTours) // Get all tours
  .post(
    authController.protect, // User must be logged in
    authController.restrictTo('admin', 'lead-guide'), // Only admin and lead-guide can create tours
    tourController.createTour // Create a new tour
  );

router // SINGLE TOUR
  .route('/:id')
  .get(tourController.getTour) // Get one tour
  .patch(
    authController.protect, // User must be logged in
    tourController.uploadTourImages,
    tourController.resizeTourPhoto,
    authController.restrictTo('admin', 'lead-guide'), // Only admin and lead-guide can update tours
    tourController.updateTour // Update tour
  )
  .delete(
    authController.protect, // User must be logged in
    authController.restrictTo('admin', 'lead-guide'), // Only admin and lead-guide can delete tours
    tourController.deleteTour // Delete tour
  );

router.get(
  '/tour/:slug',
  authController.protect,
  viewsController.getTour
);

module.exports = router; // Export router