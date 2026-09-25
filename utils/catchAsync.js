module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}; // catch error in async functions and pass it to the global error handling middleware