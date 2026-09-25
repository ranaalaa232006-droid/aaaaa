const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError')
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug }) .populate({
    path: 'reviews',
    fields: 'review rating user'
  });
   if (!tour) {
     return next(new AppError('There is no tour with that name.', 404));
   }
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
}

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.updateUserData = catchAsync(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  }, {
    new: true,
    runValidators: true
  });

   res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => { // Create a controller to get the tours booked by the current user
  const bookings = await Booking.find({ user: req.user.id }); // Find all bookings that belong to the currently logged-in user
  const tourIDs = bookings.map(el => el.tour); // Extract the tour ID from each booking
  const tours = await Tour.find({ _id: { $in: tourIDs } }); // Find all tours whose IDs are included in the tourIDs array

  res.status(200).render('overview', { // Render the overview page and send the tours data to the template
    title: 'My Tours', // Set the title of the page
    tours // Pass the tours array to the Pug template
  });
});