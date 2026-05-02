/**
 * ApiFeatures class for building advanced MongoDB queries
 * Handles filtering, searching, sorting, and pagination
 */
class ApiFeatures {
     /**
     * Create an instance of ApiFeatures
     * @param {Object} query - Mongoose query object (e.g., User.find())
     * @param {Object} queryObj - Query parameters from req.query
     */
    constructor(query, queryObj) {
        this.query = query;
        this.queryObj = queryObj;

        // Build custom query object for mongoose query
        this.customQueryObj = {...queryObj};
    }

    /**
     * Apply filters to the query
     * Supports:
     * - Field filtering (e.g., ?role=admin)
     * - Multiple values using commas (e.g., ?role=admin,member)
     * - Comparison operators: gte, gt, lte, lt (e.g., ?createdAt[gte]=2024-01-01)
     * @returns {ApiFeatures} - Returns this for method chaining
     */
    filter() {
        // Remove page limit sort search query fields for further query make
        ['page', 'limit', 'sort', 'search'].forEach(el => delete this.customQueryObj[el])

        // Convert comma-separated values to MongoDB $in operator
        // Example: ?role=admin,member → { role: { $in: ['admin', 'member'] } }
        Object.keys(this.customQueryObj).forEach(key => {
            if(typeof this.customQueryObj[key] === 'string' && this.customQueryObj[key].includes(',')) {
                const values = this.customQueryObj[key].split(',');
                this.customQueryObj[key] = { $in: values};
            }
        })

        // Convert comparison operators to MongoDB format
        // Example: ?price[gte]=100 → { price: { $gte: 100 } }
        let queryStr = JSON.stringify(this.customQueryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        this.customQueryObj = JSON.parse(queryStr);

        // Apply the filter to the query
        this.query = this.query.find(this.customQueryObj);
        return this;
    }

    /**
     * Apply text search across multiple fields
     * @param {...string} fields - Field names to search in (e.g., 'name', 'email')
     * @returns {ApiFeatures} - Returns this for method chaining
     * @example .search('name', 'email') // Searches both fields for the term
     */
    search(...fields) {
        if(this.queryObj.search) {         
            this.customQueryObj.$or = fields.map((field) => {
                return    { [field]: { $regex: this.queryObj.search, $options: 'i' } }
            })

            this.query = this.query.find(this.customQueryObj);
        }
        return this;
    }

    /**
     * Apply sorting to the query
     * Default sort: newest first (-createdAt)
     * @returns {ApiFeatures} - Returns this for method chaining
     * @example ?sort=name,-createdAt (sort by name ascending, then newest first)
     */
    sort() {
        this.query = (this.queryObj.sort) 
            ? this.query.sort(this.queryObj.sort.split(",").join(" "))
            : this.query.sort('-createdAt');

        return this;
    }

    /**
     * Apply pagination to the query
     * Default: page=1, limit=10
     * @returns {ApiFeatures} - Returns this for method chaining
     * @example ?page=2&limit=20 (gets 20 items from page 2)
     */
    pagination() {
        this.page = +this.queryObj.page || 1;
        this.limit = +this.queryObj.limit || 10;
        this.skip = (this.page - 1) * this.limit;

        this.query = this.query.skip(this.skip).limit(this.limit)
        return this
    }
}

module.exports = ApiFeatures;
