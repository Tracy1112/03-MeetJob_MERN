import {
  UnauthenticatedError,
  UnauthorizedError,
  BadRequestError,
} from '../errors/customErrors.js'
import { verifyJWT } from '../utils/tokenUtils.js'

export const authenticateUser = async (req, res, next) => {
  const { token } = req.cookies
  if (!token) {
    console.log('No token found, authentication failed') // Debug message
    throw new UnauthenticatedError('authentication invalid')
  }

  try {
    const { userId, role } = verifyJWT(token) // Assuming `verifyJWT` is a helper function to validate JWT
    const testUser = userId === '67ea212edeba5d2a9108142a'
    req.user = { userId, role, testUser } // Attach user info to the request
    next() // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Token verification failed:', error) // Log the error for debugging
    throw new UnauthenticatedError('authentication invalid')
  }
}

export const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError('Unauthorized to access this route')
    }
    next()
  }
}

export const checkForTestUser = (req, res, next) => {
  if (req.user.testUser) throw new BadRequestError('Demo User. Read Only!')
  next()
}
