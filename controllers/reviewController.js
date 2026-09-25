const Review = require('../models/reviewModel.js'); // Import Review model
const factory = require('../utils/factoryHandler'); // import factort function

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review); // create one review

exports.updateReview = factory.updateOne(Review); // update one review

exports.deleteReview = factory.deleteOne(Review); // delete one review

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);