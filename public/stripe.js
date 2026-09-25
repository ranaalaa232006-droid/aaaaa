/* global Stripe */ 
import axios from 'axios'
import { showAlert } from './alert';
const stripe = Stripe ('pk_test_51UH6G5PBqhU878HeiW2wNPJgQkh6xgCloNItUkOCdIqzAPrEV8rhWHxWFDgGajzHhnCdtq9LdX3deUDt0U8yhJ7i00qsnZ9gq3');

export const bookTour = async tourId => { // Create a function to book a tour using its tour ID
  try { // Start a try block to handle possible errors
    const session = await axios( // Send a request to our backend to create a Stripe Checkout Session
      `/api/v1/bookings/checkout-session/${tourId}` // Call the backend endpoint and send the tour ID
    );

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });

  } catch (err) { // Catch any error that happens during the request
    console.log(err); // Print the error in the console for debugging
     showAlert('error', err);
  }
};