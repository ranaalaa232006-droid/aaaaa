const express = require('express'); // Import Express
const userController = require('../controllers/userController'); // Import user controller
const authController = require('../controllers/authController'); // Import authentication controller
const viewController = require('../controllers/viewController');
const router = express.Router(); // Create Express router

router.post('/signup', authController.signup); // Create a new user
router.post('/login', authController.login); // Login user
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use (authController.protect);

router.patch('/updateMyPassword',authController.updatePassword );
router.patch('/updateMe', authController.protect, userController.uploadUserPhoto,userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);
router.post('/submit-user-data', authController.protect, viewController.updateUserData); // Update user data from the form
router.patch('/updateMyPassword', authController.protect,userController.resizeUserPhoto,userController.updateMyPassword);

router
  .route('/')
  .get(
    authController.protect, // User must be logged in (protect = Authentication)
    authController.restrictTo('admin'), // Only admin can get all users   (restricted to = Authorization)
    userController.getAllUsers // Get all users
  )
  .post(
    authController.protect, // User must be logged in
    authController.restrictTo('admin'), // Only admin can create users
    userController.createUser // Create a user
  );

router ///me MUST come before /:id
  .route('/me')
  .get(
    userController.getMe, // Get the logged-in user's ID
    userController.getUser // Get that user's data
  );

router
  .route('/:id')
  .get(
    authController.protect, // User must be logged in
    authController.restrictTo('admin'), // Only admin can get users by ID
    userController.getUser // Get user
  )
  .patch(
    authController.protect, // User must be logged in
    authController.restrictTo('admin'), // Only admin can update users
    userController.updateUser // Update user
  )
  .delete(
    authController.protect, // Check if user is logged in
    authController.restrictTo('admin'), // Only admin can delete
    userController.deleteUser // Delete user
  );

module.exports = router; // Export router