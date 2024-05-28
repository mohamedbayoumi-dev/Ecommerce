

import { subCategoryModel } from "../../../DB/models/subCategory.model.js"
import { categoryModel } from "../../../DB/models/category.model.js"
import { productModel } from "../../../DB/models/product.model.js"
import cloudinary from "../../utils/cloudinaryConfigrations.js"
import { brandModel } from "../../../DB/models/brand.model.js"
import { customAlphabet } from "nanoid"
import slugify from "slugify"

const nanoid = customAlphabet('147852369-_/mohamed', 5)

// ======================= createCategory =========================================
export const createBrand = async (req, res, next) => {

  const { _id } = req.authUser
  const { subCategoryId, categoryId } = req.query
  const { name } = req.body

  const categoryExists = await categoryModel.findOne({ _id: categoryId, createdBy: _id })
  if (!categoryExists) {
    return next(new Error('In-valid CategoryId', { cause: 400 }))
  }

  const subCategoryExists = await subCategoryModel.findOne({ _id: subCategoryId, createdBy: _id })
  if (!subCategoryExists) {
    return next(new Error('invalid subCategoryId', { cause: 400 }))
  }

  const brandExists = await brandModel.findOne({ name })
  if (brandExists) {
    return next(new Error('duplicate name', { cause: 400 }))
  }

  const slug = slugify(name, {
    replacement: '_',
    lower: true,
  })

  if (!req.file) {
    return next(new Error('please upload your logo', { cause: 400 }))
  }

  const customId = nanoid()
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${customId}`
    },
  )
  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${customId}`

  const brandObject = {
    name,
    slug,
    logo: {
      secure_url,
      public_id
    },
    categoryId,
    subCategoryId,
    createdBy: _id,
    customId,
  }

  const Brand = await brandModel.create(brandObject)
  if (!Brand) {
    await cloudinary.uploader.destroy(public_id)
    return next(new Error('try again later', { cause: 400 }))
  }
  res.status(201).json({ message: 'Added Done', Brand })
}

// ======================= update Category =========================================
export const updateCategory = async (req, res, next) => {

  const { _id } = req.authUser
  const { categoryId, subCategoryId, brandId } = req.query
  const { name } = req.body

  const categoryExists = await categoryModel.findOne({ _id: categoryId, createdBy: _id })
  if (!categoryExists) {
    return next(new Error('In-valid categoryId', { cause: 400 }))
  }

  const subCategoryExists = await subCategoryModel.findOne({ _id: subCategoryId, createdBy: _id })
  if (!subCategoryExists) {
    return next(new Error('In-valid subCategoryId', { cause: 400 }))
  }

  const brandExists = await brandModel.findOne({ _id: brandId, createdBy: _id })
  if (!brandExists) {
    return next(new Error('In-valid brandId', { cause: 400 }))
  }

  if (name) {
    if (brandExists.name == name.toLowerCase()) {
      return next(new Error('Please enter different name from the old brand name',
        { cause: 400 }))
    }

    const brandName = await brandModel.findOne({ name })
    if (brandName) {
      return next(new Error('Please enter different brand name , duplicate name ',
        { cause: 400 }))
    }

    brandExists.name = name
    brandExists.slug = slugify(name, '_')
  }

  if (req.file) {
    await cloudinary.uploader.destroy(brandExists.logo.public_id)

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}`
      }
    )
    brandExists.logo = { secure_url, public_id }
  }

  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}`

  brandExists.updatedBy = _id,
    await brandExists.save()
  res.status(200).json({ messame: 'Updated Done', brandExists })


}

// ======================= delete Brand ===========================================
export const getAllBrands = async (req, res, next) => {

  const allBrands = await brandModel.find().populate(
    [
      {
        path: 'subCategoryId',
        select: 'slug',
        populate: [
          {
            path: 'Brands',
            select: 'slug',
            populate: [
              {
                path: 'Products',
                select: 'slug',
              }
            ]

          }
        ]
      }
    ]

  )
  res.status(200).json({ message: 'Done', allBrands })
}

// ======================= delete Brand ===========================================
export const deletedBrand = async (req, res, next) => {

  const { _id } = req.authUser
  const { categoryId, subCategoryId, brandId } = req.query

  const categoryExists = await categoryModel.findById(categoryId)
  if (!categoryExists) {
    return next(new Error('In-valid categoryId', { cause: 400 }))
  }

  const subCategoryExists = await subCategoryModel.findById(subCategoryId)
  if (!subCategoryExists) {
    return next(new Error('In-valid subCategoryId', { cause: 400 }))
  }

  const brandExists = await brandModel.findOneAndDelete({ _id: brandId, createdBy: _id })
  if (!brandExists) {
    return next(new Error('In-valid brandId', { cause: 400 }))
  }

  //=========== Delete from cloudinary ==============
  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}`,

  )

  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}`,
  )

  // =========== Delete from DB ==============
  const deleteRelatedProduct = await productModel.deleteMany({ categoryId, subCategoryId, brandId })
  if (!deleteRelatedProduct.deletedCount) {
    return next(new Error('Delete Product Fail', { cause: 400 }))
  }

  res.status(200).json({ messsage: 'Deleted Done' })
}

