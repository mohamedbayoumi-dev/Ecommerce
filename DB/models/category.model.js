

import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    Image: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    customId: String
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true
  }
)

categorySchema.virtual('subCategories',
  {
    ref: 'subCategory',
    foreignField: 'categoryId',
    localField: '_id'

  }
)

categorySchema.virtual('Brands',
  {
    ref: 'Brand',
    foreignField: 'categoryId',
    localField: '_id'

  }
)


categorySchema.virtual('Products',
  {
    ref: 'Product',
    foreignField: 'categoryId',
    localField: '_id'

  }
)




export const categoryModel = mongoose.model('Category', categorySchema)