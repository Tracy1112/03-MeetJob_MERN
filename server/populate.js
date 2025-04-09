import { readFile } from 'fs/promises'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

import Job from './models/JobModel.js'
import User from './models/UserModel.js'

try {
  await mongoose.connect(process.env.MONGO_URL)

  const user = await User.findOne({ email: 'lucyking@gmail.com' })
  if (!user) {
    console.log('User not found!')
    process.exit(1) // Exit if user doesn't exist
  }

  const jsonJobs = JSON.parse(
    await readFile(new URL('./utils/mockData.json', import.meta.url))
  )

  console.log('Mock Data:', jsonJobs) // Log the mock data to see if it's loaded properly

  const jobs = jsonJobs.map((job) => {
    return { ...job, createdBy: user._id }
  })
  console.log('Jobs to insert:', jobs) // Log jobs to confirm mapping

  await Job.deleteMany({ createdBy: user._id })
  await Job.create(jobs)

  const insertedJobs = await Job.find({ createdBy: user._id })
  console.log('Inserted Jobs:', insertedJobs)

  console.log('Success!!!')
  process.exit(0)
} catch (error) {
  console.log(error)
  process.exit(1)
}
