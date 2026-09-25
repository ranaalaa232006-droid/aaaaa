const express = require('express'); // express is a function that creates an express application
const morgan = require('morgan');  // request inside the console
const rateLimit = require('express-rate-limit'); // to limit the number of requests from the same IP address
const helmet = require ('helmet') // response http security (reduce problems of security)
const mongoSanitize = require('express-mongo-sanitize'); // to prevent NoSQL injection attacks
const xss = require('xss-clean'); // clean input
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const path = require('path'); // to work with file and directory paths
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const viewRouter = require('./routes/viewRoutes'); // Import view routes     
const reviewRouter = require('./routes/reviewRoutes'); // Import review routes
const bookingRouter = require('./routes/bookingRoutes');

const app = express();
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // to parse data from forms (urlencoded data)

app.set('view engine', 'pug'); // set pug as the view engine
app.set('views', path.join(__dirname, 'views')); // set the views directory

app.use(helmet()); 

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); 
}

const limiter = rateLimit({
  max: 100, // maximum number of requests from the same IP address
  windowMs: 60 * 60 * 1000, // time window in milliseconds
  message: 'Too many requests from this IP, please try again in an hour!' // message to send when the limit is exceeded
});
app.use('/api', limiter);

//body reding data from body into req.body
app.use(express.json({limit:'10kb'}));
app.use(cookieParser());
app.use((req, res, next) => {
  console.log(req.cookies);
  next();
});

//app.use(mongoSanitize()); // data sanitization against NoSQL query injection
//app.use(xss()); // data sanitization against XSS (cross-site scripting) attacks (harmful things)
app.use(hpp({
  whitelist: ['duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price']
})); // prevent parametar population 

app.use(express.static(path.join(__dirname, 'public'))); // to serve static files from the public folder

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // link the tourRouter
app.use('/api/v1/users', userRouter); // link the userRouter
app.use('/api/v1/reviews', reviewRouter); // Review routes
app.use('/api/v1/bookings', bookingRouter);

app.all('/{*splat}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // unknown route error handling
});

app.use(globalErrorHandler); // any error from next(err) send to globalerror

module.exports = app;