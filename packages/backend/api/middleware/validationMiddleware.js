// /middleware/validationMiddleware.js
/*
This file creates a generic, reusable middleware function.
Instead of writing validation logic inside every controller,
we use this function to check an incoming request against a
zod schema. If the data is bad, it stops the request and sends
a helpful error. If the data is good, it passes the request on to the controller.
*/
/**
 * A generic middleware factory for validating requests against a Zod schema.
 * @param {object} schema - The Zod schema to validate against.
 * @returns {function} An Express middleware function.
 */
const validate = (schema) => (req, res, next) => {
  try {
    // Zod's parse method will throw an error if validation fails.
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // If we reach here, validation was successful.
    next();
  } catch (error) {
    // Zod errors are rich with detail, which we can send to the client.
    res.status(400).json({
      error: 'Validation failed',
      details: error.errors, // This provides an array of specific field errors
    });
  }
};

export { validate };
