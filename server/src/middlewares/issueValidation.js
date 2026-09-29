import mongoose from 'mongoose';
import { AppError } from '../utils/appError.js';

/**
 * Validation middleware for civic issue creation
 */
export const validateCreateIssue = (req, res, next) => {
  const { title, description, category, serviceArea, landmark, coordinates } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 120) {
    errors.push({
      field: 'title',
      message: 'Title is required and must be between 5 and 120 characters',
    });
  }

  if (
    !description ||
    typeof description !== 'string' ||
    description.trim().length < 15 ||
    description.trim().length > 2000
  ) {
    errors.push({
      field: 'description',
      message: 'Description is required and must be between 15 and 2000 characters',
    });
  }

  if (!category || !mongoose.Types.ObjectId.isValid(category)) {
    errors.push({
      field: 'category',
      message: 'A valid civic issue category must be selected',
    });
  }

  if (serviceArea && !mongoose.Types.ObjectId.isValid(serviceArea)) {
    errors.push({
      field: 'serviceArea',
      message: 'Provided service area ID is invalid',
    });
  }

  if (!landmark || typeof landmark !== 'string' || landmark.trim().length < 2 || landmark.trim().length > 150) {
    errors.push({
      field: 'landmark',
      message: 'A prominent landmark is required (2 to 150 characters)',
    });
  }

  if (coordinates) {
    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      typeof coordinates[0] !== 'number' ||
      typeof coordinates[1] !== 'number'
    ) {
      errors.push({
        field: 'coordinates',
        message: 'Coordinates must be an array of [longitude, latitude] numbers',
      });
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Issue submission validation failed', 400, errors));
  }

  next();
};
