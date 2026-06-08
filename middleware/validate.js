import { ValidationError } from './errorHandler.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err.errors) {
        const paths = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(`Validation failed: ${paths}`));
      } else {
        next(new ValidationError('Validation failed'));
      }
    }
  };
};
