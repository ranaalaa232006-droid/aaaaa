const mongoose = require('mongoose');
const slugify = require('slugify'); // convert words to slug appropriate to URL 
//const User = require ('./userModel');

const tourSchema = new mongoose.Schema( // design of schema 
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true, // delete space 
      maxlength: [40, 'A tour name must have less or equal 40 characters'],
      minlength: [10, 'A tour name must have more or equal 10 characters'],
    },

    slug: String, // the forest  to the-forest

    duration: { // num of days (tour)
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    maxGroupSize: { // max num of people 
      type: Number, 
      required: [true, 'A tour must have a group size'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: { // value must be one of those
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'], 
      set: val => Math.round(val * 10) / 10, // to make the value like as 4.8 instead of 4.76
    },

    ratingsQuantity: { // num of people made rating
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },

    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String], // array every item must be string

    createdAt: { // date of created tour
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date], // array of dates 

    secretTour: { 
      type: Boolean,
      default: false,
    },

    // GeoJSON
    startLocation: { 
      type: {
        type: String,
        default: 'Point', // point of geo
        enum: ['Point'], // allow for point only if user put location must be point
      },
      coordinates: [Number], // [longitude, latitude]
      address: String,
      description: String,
    },

    locations: [ // all places tour visited
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
  {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
]
  },
  {
    toJSON: { virtuals: true }, // if tour transform to json or obj don't forget virtual 
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1 , ratingsAverage: -1 });// Index price for faster queries
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () { // if duration 14 this mean 2 weeks and don't save it in DB 
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review', // document located in review model
  foreignField: 'tour', // on review collection find the field (tour)
  localField: '_id' // use id in local tour  
});  

tourSchema.pre('save', function () { // before save use slugify 
  this.slug = slugify(this.name, { lower: true }); 
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(
//     async id => await User.findById(id)
//   );

//   this.guides = await Promise.all(guidesPromises);

//   next();
// }); 

tourSchema.pre(/^find/, function() {

  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();

});

tourSchema.post(/^find/, function(docs, next) { // docs = value return from query+
  console.log( `Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function() {
  this.populate({
    path: 'guides',
    select: '-__v'
  });

});

// AGGREGATION MIDDLEWARE

tourSchema.pre('aggregate', function () {
  const pipeline = this.pipeline(); // Get the aggregation pipeline

  if (pipeline[0] && pipeline[0].$geoNear) { // Check if the first stage is $geoNear
    pipeline.splice(1, 0, { // Add $match after $geoNear because $geoNear must always be first
      $match: { secretTour: { $ne: true } } // Exclude secret tours
    });
  } else {
    pipeline.unshift({ // Add $match at the beginning if there is no $geoNear
      $match: { secretTour: { $ne: true } } // Exclude secret tours
    });
  }

  console.log(pipeline); // Print the final pipeline to the console
}); 

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
