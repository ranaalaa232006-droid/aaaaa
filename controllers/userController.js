//place where put all users functions like getAllUsers, getUser, createUser, updateUser, deleteUser 
const User = require('../models/userModel'); 
const catchAsync = require('../utils/catchAsync'); 
const AppError = require('../utils/appError'); 
const factory = require('../utils/factoryHandler'); // import factory function  
const { createSendToken } = require('./authController'); // send new JWT token after updating password 
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.memoryStorage()({ // Configure how and where uploaded files are stored
//   destination: (req, file, cb) => { // Define the folder where the uploaded file will be saved
//     cb(null, 'public/img/users'); // Save the file inside public/img/users
//   }, 
//   filename: (req, file, cb) => { // Define the name of the uploaded file
//     const ext = file.mimetype.split('/')[1]; // Get the file extension from the MIME type
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); // Create a unique filename using user ID and current timestamp
//   } 
// }); 
 
const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => { // Create a filter to allow only image files
  if (file.mimetype.startsWith('image')) { // Check if the uploaded file is an image
    cb(null, true); // No error, and allow the file to be uploaded
  } else { // If the uploaded file is not an image
    cb(new AppError('Not an image! Please upload only images.', 400), false); // Create an error and reject the file
  }
};

const upload = multer({ // Create the Multer middleware
  storage: multerStorage, // Use our storage configuration
  fileFilter: multerFilter // Use our image filter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => { // Resize the uploaded user photo
  if (!req.file) return next(); // If there is no uploaded photo, continue to the next middleware

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; // Create a unique filename for the resized image

  await sharp(req.file.buffer) // Take the uploaded image from memory
    .resize(500, 500) // Resize the image to 500x500 pixels
    .toFormat('jpeg') // Convert the image to JPEG format
    .jpeg({ quality: 90 }) // Set JPEG quality to 90%
    .toFile(`public/img/users/${req.file.filename}`); // Save the resized image to the users folder

  next(); // Move to the next middleware
});
 
const filterObj = (obj, ...allowedFields) => { //....=any number of arguments, ...allowedFields=an array of allowed fields to be updated 
  const newObj = {}; 
    Object.keys(obj).forEach(el => { 
      if (allowedFields.includes(el)) newObj[el] = obj[el]; 
    }); 
  return newObj;  
}; 
 
exports.getMe = (req, res, next) => { // Get the logged-in user's ID from req.user 
  req.params.id = req.user.id; // Move to the next middleware (getUser) 
  next(); 
}; 
 
exports.updateMe = catchAsync(async (req, res, next) => { 
  // 1) Create error if user POSTs password data 
  if (req.body.password || req.body.confirmPassword) { 
    return next(new AppError('You cannot update your password here. Please use the updateMyPassword endpoint.', 400)); 
  } 
    // 2) Update user document 
  const filteredBody = filterObj(req.body, 'username', 'email'); // filter the request body to only allow name and email to be updated 
  if (req.file) filteredBody.photo = req.file.filename; // Save the resized image filename in the database
 
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { 
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

exports.updateMyPassword = catchAsync(async (req, res) => {// 197 - Update logged-in user's password using the API
  
  const user = await User.findById(req.user.id).select('+password');// 1) Get user from collection
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {// 2) Check if posted current password is correct
    return next(new AppError('Your current password is wrong.', 401));
  }
  
  user.password = req.body.password;// 3) If so, update password
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  createSendToken(user, 200, res); // 4) Log user in, send JWT
});
 
exports.deleteMe = catchAsync(async (req, res, next) => { 
  await User.findByIdAndUpdate(req.user.id, { active: false }); 
 
  res.status(204).json({ 
    status: 'success', 
    data: null 
  }); 
}); 
 
exports.createUser = factory.createOne(User); // Create one User 
exports.updateUser = factory.updateOne(User); // Update one User 
exports.deleteUser = factory.deleteOne(User); // delete one user   
exports.getAllUsers = factory.getAll(User); 
exports.getUser = factory.getOne(User);