
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Import Stripe and initialize
const Tour = require('../models/tourModel'); // Import the Tour model to get the tour information from the database
const catchAsync = require('../utils/catchAsync');
const Booking = require('../models/bookingModel'); // NEW: Import the Booking model
const factory = require('../utils/factoryHandler'); // import factort function

exports.getCheckoutSession = catchAsync(async (req, res) => { // Create the controller that creates a Stripe Checkout Session

  const tour = await Tour.findById(req.params.tourId);// 1) Get the currently booked tour

  const session = await stripe.checkout.sessions.create({ // Create a new Stripe Checkout Session
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tours= ${req.params.tourId}&user= ${req.user.Id}&price= ${req.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email, // Use the logged-in user's email as the customer's email
    client_reference_id: req.params.tourId, // Store the tour ID as a reference for this checkout session

    line_items: [ // Define the products/items that the customer will pay for
      {
        price_data: {
          currency: 'usd',

          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          },

          unit_amount: tour.price * 100 // Stripe expects the amount in the smallest currency unit
        },
        quantity: 1
      }
    ],
    mode: 'payment' // Tell Stripe that this is a one-time payment
  });

  res.status(200).json({// 3) Send session to the client
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.createBooking = factory.createOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);  