
import { subCategoryModel } from "../../../DB/models/subCategory.model.js"
import { categoryModel } from "../../../DB/models/category.model.js"
import { productModel } from "../../../DB/models/product.model.js"
import cloudinary from "../../utils/cloudinaryConfigrations.js"
import { brandModel } from "../../../DB/models/brand.model.js"
import { customAlphabet } from "nanoid"
import slugify from "slugify"

const nanoid = customAlphabet('147852369-_/mohamed', 5)

// ======================= createCategory ===========================================
export const createCategory = async (req, res, next) => {

  const { _id } = req.authUser
  const { name } = req.body
  const slug = slugify(name, '_')

  const categoryName = await categoryModel.findOne({ name })
  if (categoryName) {
    return next(new Error('please enter different category name', { cause: 400 }))
  }

  if (!req.file) {
    return next(new Error('please upload a category image', { cause: 400 }))
  }

  const customId = nanoid()
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECT_FOLDER}/Categories/${customId}`
    }
  )
  //  ================  fail  ==========
  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${customId}`

  const categoryObject = {
    name,
    slug,
    Image:
      { secure_url, public_id },
    customId,
    createdBy: _id,
  }

  const category = await categoryModel.create(categoryObject)
  if (!category) {
    await cloudinary.uploader.destroy(public_id)
    return next(new Error('try agin later , fail to add your category', { cause: 400 }))
  }
  res.status(200).json({ message: 'Added Done ', category })
}

// ======================= updateCategory ===========================================
export const updateCategory = async (req, res, next) => {

  const { _id } = req.authUser
  const { categoryId } = req.params
  const { name } = req.body

  const category = await categoryModel.findOne({ _id: categoryId, createdBy: _id })
  if (!category) {
    return next(new Error('In-valid CategoryId', { cause: 400 }))
  }

  if (name) {
    if (category.name == name.toLowerCase()) {
      return next(new Error('Please enter different name from the old category name',
        { cause: 400 }))
    }

    const categoryName = await categoryModel.findOne({ name })
    if (categoryName) {
      return next(new Error('Please enter different category name , duplicate name ',
        { cause: 400 }))
    }

    category.name = name
    category.slug = slugify(name, '_')
  }

  if (req.file) {
    await cloudinary.uploader.destroy(category.Image.public_id)

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}`
      }
    )
    category.Image = { secure_url, public_id }
  }

  category.updatedBy = _id
  await category.save()
  res.status(200).json({ messame: 'Updated Done', category })

}

// ======================= get All Categories =======================================
export const getAllCategories = async (req, res, next) => {

  const Categories = await categoryModel.find().populate(
    [
      {
        path: 'subCategories',
        populate: [{
          path: 'Brands',
          populate: [{
            path: 'Products'
          }]
        }]
      }
    ]
  )

  if (!Categories.length) {
    return next(new Error('emty box', { cause: 200 }))
  }
  res.status(200).json({ message: 'Done', Categories })
}

// ======================= delete Categories ========================================
export const deleteCategory = async (req, res, next) => {

  const { _id } = req.authUser
  const { categoryId } = req.query

  const categoryExists = await categoryModel.findOneAndDelete({ _id: categoryId, createdBy: _id })

  if (!categoryExists) {
    return next(new Error('In_valid categoryId', { cause: 400 }))
  }

  //=========== Delete from cloudinary ==============
  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}`,
  )

  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}`,

  )

  // =========== Delete from DB ==============
  const deleteRelatedSubCategories = await subCategoryModel.deleteMany({ categoryId })
  if (!deleteRelatedSubCategories.deletedCount) {
    return next(new Error('delete fail subCategory', { cause: 400 }))
  }

  const deleteRelatedBrands = await brandModel.deleteMany({ categoryId })
  if (!deleteRelatedBrands.deletedCount) {
    return next(new Error('delete fail Brand', { cause: 400 }))
  }

  const deleteRelatedProduct = await productModel.deleteMany({ categoryId })
  if (!deleteRelatedProduct.deletedCount) {
    return next(new Error('delete fail Product', { cause: 400 }))
  }

  res.status(200).json({ messsage: 'Deleted Done', categoryExists })
}
