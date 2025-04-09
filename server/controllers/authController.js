import { StatusCodes } from 'http-status-codes'
import User from '../models/UserModel.js'
import { hashPassword, comparePassword } from '../utils/passwordUtils.js'
import { UnauthenticatedError } from '../errors/customErrors.js'
import { createJWT } from '../utils/tokenUtils.js'

export const register = async (req, res) => {
  // 1. admin or user, set 'role' property
  const isFirstAccount = (await User.countDocuments()) === 0
  req.body.role = isFirstAccount ? 'admin' : 'user'
  // 2. create hash password to protect user data
  const hashedPassword = await hashPassword(req.body.password)
  req.body.password = hashedPassword
  // 3. store data
  const user = await User.create(req.body)

  res.status(StatusCodes.CREATED).json({ msg: 'user created', user })
}

export const login = async (req, res) => {
  // 1. check if user exists
  // 2. check if password is correct
  const user = await User.findOne({ email: req.body.email })
  const isValidUser =
    user && (await comparePassword(req.body.password, user.password))
  if (!isValidUser) throw new UnauthenticatedError('invalid credentials')

  // 3. create jwt
  const token = createJWT({ userId: user.id, role: user.role })

  // 4. send HTTP-Only cookie
  const oneDay = 1000 * 60 * 60 * 24
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'Strict',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + oneDay),
  })

  //   5. send response
  res.status(StatusCodes.OK).json({ msg: 'user logged in', user })
}

export const logout = (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  })
  res.status(StatusCodes.OK).json({ msg: 'user logged out!' })
}
