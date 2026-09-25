class APIFeatures { // take url and query and return the query with the features applied
  constructor(query, queryString) {
    this.query = query; // query = Tour.find()
    this.queryString = queryString; // URL query string = req.query
  }

  filter() {
    const queryObj = { ...this.queryString }; // ... = copy the query string object to avoid mutating it

    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj); // convert the query object to a string to use regex

    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt)\b/g, // ><=, >=, <, <= operators in the query string
      match => `$${match}` // add $ to the operators to use them in the query
    );

    this.query = this.query.find(JSON.parse(queryStr)); // parse (string to obj)

    return this;
  }

  sort() {
    if (this.queryString.sort) { // if user send sort in URL (sort price)
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); // sort descending (defult) 
    }

    return this;
  }

  limitFields() { // determine any field from every document appear in response 
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // __ = exclude v field 
    }

    return this;
  }

  paginate() { // divide result on pages
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;

    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;