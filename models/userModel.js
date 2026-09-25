const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs'); // hashing password for security purpose
const crypto = require('crypto'); // used to create password reset tokens 

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'] 
  },

 role: {
  type: String,
  default: 'user', 
  enum: ['user', 'admin', 'lead-guide', 'guide', 'tourist-guide']
},

photo: {
  type: String,
  default: 'default.jpg' 
},

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // to not show password in any output
  },

  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password; //el is the value of confirmPassword
      },
      message: 'Passwords are not the same!'
    }
  },

  passwordChangedAt: Date, // to check if password is changed after token is issued
  passwordResetToken: String, // to store the reset token
  passwordResetExpires: Date, // to store the expiration time of the reset token
  active: {
    type: Boolean,
    default: true,
    select: false // to not show active status in any output
  }
});

userSchema.pre('save', async function () { // pre save hook to hash the password before saving it to the database
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);

  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // to ensure that the token is issued after the password is changed
  }

  this.confirmPassword = undefined;
});

 userSchema.pre('save', function () { // pre save hook to set the passwordChangedAt property
   if (!this.isModified('password') || this.isNew) return  // if the password is not modified or the document is new,
    // do not set the passwordChangedAt property
   this.passwordChangedAt = Date.now() - 1000; // keep the date of password change 
 });

 userSchema.pre(/^find/, function () { // starting with find, to filter out inactive users from the query results
   this.find({ active: { $ne: false } }); // ne is not equal to, so it will find all users whose active property is not false
   // any time we take any user from the database, we will take only active users  
 });

userSchema.methods.correctPassword = async function ( // login authentication method to check if password is correct
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt( // value to intger to compare with JWTTimestamp
      this.passwordChangedAt.getTime() / 1000,
      10   // decimal base 10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

module.exports = mongoose.model('User', userSchema); 