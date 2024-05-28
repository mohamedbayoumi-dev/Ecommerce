
import { subCategoryModel } from "../../../DB/models/subCategory.model.js"
import { categoryModel } from "../../../DB/models/category.model.js"
import { productModel } from "../../../DB/models/product.model.js"
import cloudinary from "../../utils/cloudinaryConfigrations.js"
import { brandModel } from "../../../DB/models/brand.model.js"
import { customAlphabet } from "nanoid"
import slugify from "slugify"

const nanoid = customAlphabet('147852369-_/mohamed', 5)

// ======================= create subCategory =====================================
export const createSubCategory = async (req, res, next) => {

  const { _id } = req.authUser
  const { categoryId } = req.params
  const { name } = req.body

  const categoryExists = await categoryModel.findOne({ _id: categoryId, createdBy: _id })
  if (!categoryExists) {
    return next(new Error('In-valid categoryId', { cause: 400 }))
  }

  const subCategoryExists = await subCategoryModel.findOne({ name })
  if (subCategoryExists) {
    return next(new Error('duplicate name', { cause: 400 }))
  }
  const slug = slugify(name, '_')


  if (!req.file) {
    return next(new Error('please upload subCategory image',
      { cause: 400 }))
  }

  const customId = nanoid()
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${customId}`
    }
  )

  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${customId}`

  const subCategoryObject = {
    name,
    slug,
    Image: {
      secure_url,
      public_id
    },
    categoryId,
    customId,
    createdBy: _id,
  }

  const subCategory = await subCategoryModel.create(subCategoryObject)
  if (!subCategory) {
    await cloudinary.uploader.destroy(public_id)
    return next(new Error('try agin later', { cause: 400 }))
  }
  res.status(201).json({ message: 'Added Done', subCategory })

}

// ======================= update subCategory =====================================
export const updateSubCategory = async (req, res, next) => {

  const { _id } = req.authUser
  const { categoryId, subCategoryId } = req.query
  const { name } = req.body


  const categoryExists = await categoryModel.findOne({ _id: categoryId, createdBy: _id })
  if (!categoryExists) {
    return next(new Error('In-valid categoryId', { cause: 400 }))
  }

  const subCategoryExists = await subCategoryModel.findOne({ _id: subCategoryId, createdBy: _id })
  if (!subCategoryExists) {
    return next(new Error('In-valid subcategoryId', { cause: 400 }))
  }

  if (name) {
    if (subCategoryExists.name == name.toLowerCase()) {
      return next(new Error('Please enter different name from the old subCategory name',
        { cause: 400 }))
    }

    const subCategoryName = await subCategoryModel.findOne({ name })
    if (subCategoryName) {
      return next(new Error('Please enter different subCategory name ,duplicate name',
        { cause: 400 }))
    }

    subCategoryExists.name = name
    subCategoryExists.slug = slugify(name, '_')
  }


  if (req.file) {
    await cloudinary.uploader.destroy(subCategoryExists.Image.public_id)
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}`
      }
    )
    subCategoryExists.Image = { secure_url, public_id }
  }

  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}`

  subCategoryExists.updatedBy = _id
  await subCategoryExists.save()
  res.status(200).json({ messame: 'Updated Done', subCategoryExists })
}

// ======================= get All subCategory =====================================
export const getAllSubCategories = async (req, res, next) => {

  const allSubCategories = await subCategoryModel.find().populate(
    [
      {
        path: 'categoryId',
        select: 'slug',
        populate: [{
          path: 'Brands',
          populate: [{
            path: 'Products'
          }]
        }]
      }
    ]
  )

  if (!allSubCategories.length) {
    return next(new Error('emty box', { cause: 200 }))
  }
  res.status(200).json({ message: 'Done', allSubCategories })

}

// ======================= delete subCategory =====================================
export const deletedSubCategory = async (req, res, next) => {

  const { _id } = req.authUser
  const { categoryId, subCategoryId } = req.query

  const categoryExists = await categoryModel.findOne({ _id: categoryId, createdBy: _id })
  if (!categoryExists) {
    return next(new Error('In-valid categoryId', { cause: 400 }))
  }

  const subCategoryExists = await subCategoryModel.findOneAndDelete(
    { _id: subCategoryId, createdBy: _id }
  )
  if (!subCategoryExists) {
    return next(new Error('In-valid categories', { cause: 400 }))
  }

  //=========== Delete from cloudinary ==============
  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}`,
  )

  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}`,

  )

  // =========== Delete from DB ==============
  const deleteRelatedBrands = await brandModel.deleteMany({ categoryId, subCategoryId })
  if (!deleteRelatedBrands.deletedCount) {
    return next(new Error('Delete Brand fail ', { cause: 400 }))
  }

  const deleteRelatedProduct = await productModel.deleteMany({ categoryId, subCategoryId })
  if (!deleteRelatedProduct.deletedCount) {
    return next(new Error('Delete Product fail ', { cause: 400 }))
  }

  res.status(200).json({ messsage: 'Deleted Done', subCategoryExists })
}