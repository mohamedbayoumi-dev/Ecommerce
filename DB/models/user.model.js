
import { systemRoles } from '../../src/utils/systemRoles.js'
import mongoose, { Schema } from 'mongoose'
import pkg from 'bcrypt'

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      lowercase: true
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true
    },
    isConfirmed: {
      type: Boolean,
      required: true,
      default: 'false'
    },
    role: {
      type: String,
      enum: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
      default: systemRoles.USER
    },
    address: [
      {
        type: String,
        required: true
      }
    ],
    profile_Picture: [{
      secure_url: {
        type: String
      },
      public_id: {
        type: String
      }
    },],
    coverPictures: [
      {
        secure_url: String,
        public_id: String,
      },
    ],
    status: {
      type: String,
      enum: ['Online', 'Offline'],
      default: 'Offline'
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'Not Specified'],
      default: 'Not Specified'
    },
    age: Number,
    token: String,
    forgetCode: String
  },
  {
    timestamps: true
  }
)

userSchema.pre('save', function (next, hash) {
  this.password = pkg.hashSync(this.password, parseInt(process.env.SALT_ROUNDS))
  next()
})

export const userModel = mongoose.model('User', userSchema)