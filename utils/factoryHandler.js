const catchAsync = require('./catchAsync'); // Handle async errors
const AppError = require('./appError'); // Create custom errors
const APIFeatures = require('./apiFeatures');

exports.deleteOne = Model => // Create a function called deleteOne, and receive a Model and create general delete function
  catchAsync(async (req, res, next) => {  // Run async function and catch errors
    const doc = await Model.findByIdAndDelete(req.params.id); // Find the document using the ID from the URL, then delete it

    if (!doc) {
      return next(new AppError('No document found with that ID', 404)); // ID not found
    }

    res.status(204).json({
      status: 'success', // Success
      data: null // No data to send
    });
  });

exports.createOne = Model => // create general create function 
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body); // Create a new document using request data

    res.status(201).json({
      status: 'success', // Request was successful
      data: {
        data: doc // Send the created document
      }
    });
  });

exports.updateOne = Model => // Create a general update function
  catchAsync(async (req, res, next) => { // catchAsync catches any error and sends it to the error handler
    const doc = await Model.findByIdAndUpdate(  // Find a document by its ID and update it
      req.params.id, // Get the ID from the UR Example: PATCH /api/v1/tours/123
      req.body, // Get the new data from the request body Example: { "price": 500 }
      {
        new: true, // Return the UPDATED document Without this, Mongoose returns the OLD document
        runValidators: true // Run the schema validators during the update Example: min, max, required, etc.
      }
    );
    if (!doc) {
      return next(
        new AppError(
          'No document found with that ID',
          404
        )
      );
    }
    res.status(200).json({ // 200 means: OK
      status: 'success', // request succeeded
      data: {
        data: doc // Send the updated document back to the client
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
     let filter = {}; // Default: get all reviews and to allow for nested get reviews on tour

   if (req.params.tourId) {
     filter = { tour: req.params.tourId }; // Get reviews for this tour
   };
    const features = new APIFeatures(Model.find(filter), req.query)
     .filter()
     .sort()
     .limitFields()
     .paginate();
    const docs = await features.query;
  
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });