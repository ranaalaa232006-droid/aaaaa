const mongoose = require('mongoose');
const dotenv = require('dotenv'); // read env variables from config.env file

dotenv.config({ path: './config.env' }); // load environment variables from config.env file
const app = require('./app'); // import the express app from app.js

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => {  // wait for the connection to be established
    console.log('DB connection successful!');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

const port = process.env.PORT || 3000;

app.listen(port, () => {   // start the server and listen on the specified port
  console.log(`Server is running on port ${port}`);
});