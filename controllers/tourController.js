const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const factory = require('../utils/factoryHandler'); // import factort function
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourPhoto = catchAsync(async (req, res, next) => { // Create a middleware to resize all uploaded tour images
  if (!req.files.imageCover || !req.files.images) return next(); // If there are no tour images, skip this middleware

  // 1) Cover image
  req.files.imageCover[0].filename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; // Create a unique filename for the cover image

  await sharp(req.files.imageCover[0].buffer) // Get the cover image from memory
    .resize(2000, 1333) // Resize the cover image to 2000x1333 pixels
    .toFormat('jpeg') // Convert the image to JPEG format
    .jpeg({ quality: 90 }) // Set JPEG quality to 90%
    .toFile(`public/img/tours/${req.files.imageCover[0].filename}`); // Save the resized cover image to the tours folder

  req.body.imageCover = req.files.imageCover[0].filename; // Save the cover image filename in req.body

  req.body.images = []; // Create an array to store the filenames of the other images

  // 2) Other images
  await Promise.all(
    req.files.images.map(async (file, i) => { // Loop through all additional tour images
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`; // Create a unique filename for each image

      await sharp(file.buffer) // Get the current image from memory
        .resize(2000, 1333) // Resize the image to 2000x1333 pixels
        .toFormat('jpeg') // Convert the image to JPEG format
        .jpeg({ quality: 90 }) // Set JPEG quality to 90%
        .toFile(`public/img/tours/${filename}`); // Save the resized image to the tours folder

      req.body.images.push(filename); // Add the filename to the images array
    })
  );

  next(); // Move to the next middleware
});
exports.aliasTopTours = (req, res, next) => { // shortcut
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price'; // high rate and if two has same rate sort by low price
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}; 

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);

  // إرسال الاستجابة بنجاح
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // تحويل السنة إلى رقم، مثل: 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    }
  ]);

  // إرسال الاستجابة بنجاح
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

exports.getToursWithin = async (req, res, next) => { // controller to find tours within a specified radius
  const { distance, unit } = req.params; // get the distance and unit from the URL parameters

  const [lat, lng] = req.params.latlng.split(','); // split latitude and longitude from the URL

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // convert distance to radians based on miles or kilometers

  if (!lat || !lng) { // check if latitude or longitude is missing
    return next( // pass the error to the global error handling middleware
      new AppError( // create a new application error
        'Please provide latitude and longitude in the format lat,lng.', // error message explaining the correct format
        400 // bad request status code
      )
    );
  }

  const tours = await Tour.find({ // find all tours that match the geospatial query
    startLocation: { // search using the start location of each tour
      $geoWithin: { // find locations within a specified geographic area
        $centerSphere: [[lng, lat], radius] // define the center coordinates and radius of the search area
      }
    }
  });

  res.status(200).json({ // send a successful response
    status: 'success', // indicate that the request was successful
    results: tours.length, // send the number of tours found
    data: { // wrap the returned data
      data: tours // send the tours that are within the specified radius
    }
  });
};

exports.getDistances = async (req, res, next) => { // controller to calculate the distance from a point to each tour
  const { latlng, unit } = req.params; // get latitude/longitude and unit from the URL parameters

  const [lat, lng] = latlng.split(','); // split latitude and longitude into separate variables

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // convert the distance from meters to miles or kilometers

  if (!lat || !lng) { // check if latitude or longitude is missing
    return next( // pass the error to the global error handler
      new AppError( // create a new application error
        'Please provide latitude and longitude in the format lat,lng.', // explain the required coordinate format
        400 // send a bad request status code
      )
    );
  }

  const distances = await Tour.aggregate([ // use aggregation to calculate distances for tours
    {
      $geoNear: { // find documents near a geographic point and calculate their distances
        near: { // define the reference point
          type: 'Point', // specify the GeoJSON geometry type
          coordinates: [lng * 1, lat * 1] // convert coordinates to numbers and use [longitude, latitude]
        },
        distanceField: 'distance', // store the calculated distance in a field called distance
        distanceMultiplier: multiplier // convert the distance from meters to the requested unit
      }
    },
    {$project: {
      distance:1,
      name:1  
    }}
  ]);

  res.status(200).json({ // send a successful response
    status: 'success', // indicate that the request was successful
    data: { // wrap the response data
      data: distances // send all tours with their calculated distances
    }
  });
};

exports.createTour = factory.createOne(Tour); // create one tour
 
exports.updateTour = factory.updateOne(Tour); // update one tour

exports.deleteTour = factory.deleteOne(Tour); // delete one tour 

exports.getAllTours = factory.getAll(Tour);
 
exports.getTour = factory.getOne(Tour, {path :'reviews'});