import { body, param, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from '../errors/customErrors.js'
import { JOB_TYPE, JOB_STATUS } from '../utils/constants.js'
import Job from '../models/JobModel.js'

import User from '../models/UserModel.js'

// utility middleware, to attach validation rules and handle errors
const withValidationErrors = (validationvalues) => {
  return [
    ...validationvalues,
    (req, res, next) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg)
        if (errorMessages[0].startsWith('not authorized')) {
          throw new UnauthenticatedError(errorMessages)
        }

        if (errorMessages[0].startsWith('no job')) {
          throw new NotFoundError(errorMessages)
        }
        throw new BadRequestError(errorMessages)
      }
      next()
    },
  ]
}

// validate rule 1: request body for job creation and update
export const validateJobInput = withValidationErrors([
  body('company').notEmpty().withMessage('Company is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('jobStatus')
    .isIn(Object.values(JOB_STATUS))
    .withMessage('Invalid job status'),
  body('jobType').isIn(Object.values(JOB_TYPE)).withMessage('Invalid job type'),
])

// validate rule 2: ensure that only admins and the creator of the job can access or manipulate job data
export const validateIdParam = withValidationErrors([
  param('id').custom(async (value, { req }) => {
    // id format
    const isValidId = mongoose.Types.ObjectId.isValid(value)
    if (!isValidId) throw new BadRequestError('Invalid MongoDB ID')
    // id exists
    const job = await Job.findById(value)
    if (!job) throw new NotFoundError(`No job found with ID:${value}`)
    // Admin check: admin can access all jobs
    const isAdmin = req.user.role === 'admin'
    // Owner check: only the job creator can modify or delete the job
    const isOwner = req.user.userId === job.createdBy.toString()
    if (!isAdmin && !isOwner)
      throw UnauthenticatedError('not authorized to access this route')
  }),
])

export const validateRegisterInput = withValidationErrors([
  body('name').notEmpty().withMessage('name is required'),
  body('email')
    .notEmpty()
    .withMessage('email is required')
    .isEmail()
    .withMessage('invalid email format')
    .custom(async (email) => {
      const user = await User.findOne({ email })
      if (user) {
        throw new BadRequestError('email already exists')
      }
    }),
  body('password')
    .notEmpty()
    .withMessage('password is required')
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters long'),
  body('location').notEmpty().withMessage('location is required'),
  body('lastName').notEmpty().withMessage('last name is required'),
])

export const validateLoginInput = withValidationErrors([
  body('email')
    .notEmpty()
    .withMessage('email is required')
    .isEmail()
    .withMessage('invalid email format'),
  body('password').notEmpty().withMessage('password is required'),
])

export const validateUpdateUserInput = withValidationErrors([
  body('name').notEmpty().withMessage('name is required'),
  body('email')
    .notEmpty()
    .withMessage('email is required')
    .isEmail()
    .withMessage('invalid email format')
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email })
      if (user && user._id.toString() !== req.user.userId) {
        throw new Error('email already exists')
      }
    }),
  body('lastName').notEmpty().withMessage('last name is required'),
  body('location').notEmpty().withMessage('location is required'),
])
