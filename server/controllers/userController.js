import { StatusCodes } from 'http-status-codes'
import User from '../models/UserModel.js'
import Job from '../models/JobModel.js'

import cloudinary from 'cloudinary'
import { formatImage } from '../middleware/multerMiddleware.js'

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.userId })
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'User not found' })
    }
    res.status(StatusCodes.OK).json({ user })
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error' })
  }
}

export const getApplicationStats = async (req, res) => {
  const users = await User.countDocuments()
  const jobs = await Job.countDocuments()
  res.status(StatusCodes.OK).json({ users, jobs })
}

export const updateUser = async (req, res) => {
  const currentUser = await User.findById(req.user.userId)
  const newUser = { ...req.body }
  delete newUser.password
  delete newUser.role

  if (req.file) {
    const file = formatImage(req.file)
    const response = await cloudinary.v2.uploader.upload(file)
    newUser.avatar = response.secure_url
    newUser.avatarPublicId = response.public_id
  }
  const updatedUser = await User.findByIdAndUpdate(req.user.userId, newUser, {
    new: true,
  })

  if (
    currentUser.avatarPublicId &&
    currentUser.avatarPublicId !== newUser.avatarPublicId
  ) {
    await cloudinary.v2.uploader.destroy(currentUser.avatarPublicId) // Remove old avatar from Cloudinary
  }

  res.status(StatusCodes.OK).json({ msg: 'update user', updatedUser })
}
