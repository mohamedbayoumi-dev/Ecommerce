
import { subCategoryModel } from "../../../DB/models/subCategory.model.js"
import { categoryModel } from "../../../DB/models/category.model.js"
import { productModel } from "../../../DB/models/product.model.js"
import cloudinary from "../../utils/cloudinaryConfigrations.js"
import { brandModel } from "../../../DB/models/brand.model.js"
import { paginationFunction } from "../../utils/pagination.js"
import { ApiFeatures } from "../../utils/apiFeatures.js"
import { customAlphabet } from "nanoid"
import slugify from "slugify"

const nanoid = customAlphabet('147852369-_/mohamed', 5)

// ======================= create Product ===========================================
export const createProduct = async (req, res, next) => {

  const { title, desc, price, appliedDiscount, colors, sizes, stock } = req.body
  const { categoryId, subCategoryId, brandId } = req.query
  const { _id } = req.authUser

  const categoryExists = await categoryModel.findOne({ _id: categoryId, createdBy: _id })
  if (!categoryExists) {
    return next(new Error('In-valid CategoryId', { cause: 400 }))
  }

  const subCategoryExists = await subCategoryModel.findOne({ _id: subCategoryId, createdBy: _id })
  if (!subCategoryExists) {
    return next(new Error('In-valid subCategoryId', { cause: 400 }))
  }

  const brandExists = await brandModel.findOne({ _id: brandId, createdBy: _id })
  if (!brandExists) {
    return next(new Error('In-valid BrandId', { cause: 400 }))
  }

  const slug = slugify(title, {
    replacement: '_',
    lower: true,
  })

  const priceAfterDiscount = price * (1 - (appliedDiscount || 0) / 100)

  if (!req.files) {
    return next(new Error('please upload pictures', { cause: 400 }))
  }

  const customId = nanoid()
  const Images = []
  const publicIds = []

  for (const file of req.files) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${customId}`,

      }
    )
    Images.push({ secure_url, public_id })
    publicIds.push(public_id)
  }

  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${customId}`

  const productObject = {
    title, desc, colors, sizes, stock, slug,
    price, priceAfterDiscount, appliedDiscount,
    Images, customId,
    categoryId, subCategoryId, brandId, createdBy: _id,
  }

  const product = await productModel.create(productObject)
  if (!product) {
    await cloudinary.api.delete_resources(publicIds)
    return next(new Error('try agin later', { cause: 400 }))
  }
  res.status(200).json({ message: 'Added Done ', product })
}

// ======================= update Product ===========================================
export const updateProduct = async (req, res, next) => {

  const { _id } = req.authUser
  const { categoryId, subCategoryId, brandId, productId } = req.query
  const { title, desc, price, appliedDiscount, colors, sizes, stock } = req.body

  //  ============ check Id
  const product = await productModel.findOne({ _id: productId, createdBy: _id })
  if (!product) {
    return next(new Error('In-valid ProductId', { cause: 400 }))
  }

  const categoryExists = await categoryModel.findById(categoryId || product.categoryId)
  if (categoryId) {
    if (!categoryExists) {
      return next(new Error('In-valid Category', { cause: 400 }))
    }
    product.categoryId = categoryId
  }

  const subCategoryExists = await subCategoryModel.findById(subCategoryId || product.subCategoryId)
  if (subCategoryId) {
    if (!subCategoryExists) {
      return next(new Error('In-valid subCategoryId', { cause: 400 }))
    }
    product.subCategoryId = subCategoryId
  }

  const brandExists = await brandModel.findById(brandId || product.brandId)
  if (brandId) {
    if (!brandExists) {
      return next(new Error('In-valid Brand', { cause: 400 }))
    }
    product.brandId = brandId
  }

  //  ============== update price ====================================================
  if (appliedDiscount && price) {
    const priceAfterDiscount = price * (1 - (appliedDiscount || 0) / 100)
    product.priceAfterDiscount = priceAfterDiscount
    product.price = price
    product.appliedDiscount = appliedDiscount
  } else if (price) {
    const priceAfterDiscount = price * (1 - (product.appliedDiscount || 0) / 100)
    product.priceAfterDiscount = priceAfterDiscount
    product.price = price
  } else if (appliedDiscount) {
    const priceAfterDiscount = product.price * (1 - (appliedDiscount || 0) / 100)
    product.priceAfterDiscount = priceAfterDiscount
    product.appliedDiscount = appliedDiscount
  }

  //  =============== update Image ================================================

  if (req.files?.length) {
    let ImageArr = []
    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${product.customId}`,
        }
      )
      ImageArr.push({ secure_url, public_id })
    }

    req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${product.customId}`

    let public_ids = []
    for (const image of product.Images) {
      public_ids.push(image.public_id)
    }
    await cloudinary.api.delete_resources(public_ids)
    product.Images = ImageArr
  }

  if (title) {
    product.title = title
    product.slug = slugify(title, '_')
  }

  if (desc) product.desc = desc
  if (colors) product.colors = colors
  if (stock) product.stock = stock
  if (sizes) product.sizes = sizes

  product.updatedBy = _id,
    await product.save()
  res.status(200).json({ message: 'updated Product Done', product })

}

// ======================= get All Product paginationFunction =======================
export const getAllProduct = async (req, res, next) => {

  const { page, size } = req.query
  const { limit, skip } = paginationFunction({ page, size })

  const Products = await productModel.find().limit(limit).skip(skip)
  res.status(200).json({ message: 'Done Get Products', Products })

}

// ======================= get Products By Title =====================================
export const getAllProductsByTitle = async (req, res, next) => {

  const { searchkey, page, size } = req.query
  const { limit, skip } = paginationFunction({ page, size })

  const Products = await productModel.find({
    $or: [
      { title: { $regex: searchkey, $options: 'i' } },
      { desc: { $regex: searchkey, $options: 'i' } }
    ]
  }
  ).limit(limit).skip(skip)
  res.status(200).json({ message: 'Done search title or desc', Products })

}

// ======================= list Products =====================================
export const listProducts = async (req, res, next) => {

  const ApiFeaturesInstance = new ApiFeatures(productModel.find({}), req.query)
    .pagination()
    .sort()
    .filters()

  const products = await ApiFeaturesInstance.mongooseQuery
  res.status(200).json({ message: 'Done', products })

}

// ======================= delete Product ===========================================
export const deletedProduct = async (req, res, next) => {

  const { categoryId, subCategoryId, brandId, productId } = req.query
  const { _id } = req.authUser

  //  ============ check Id
  const product = await productModel.findOneAndDelete({ _id: productId, createdBy: _id })
  if (!product) {
    return next(new Error('In-valid ProductId', { cause: 400 }))
  }

  const categoryExists = await categoryModel.findById(categoryId || product.categoryId)
  if (categoryId) {
    if (!categoryExists) {
      return next(new Error('In-valid Category', { cause: 400 }))
    }
    product.categoryId = categoryId
  }

  const subCategoryExists = await subCategoryModel.findById(subCategoryId || product.subCategoryId)
  if (subCategoryId) {
    if (!subCategoryExists) {
      return next(new Error('In-valid subCategoryId', { cause: 400 }))
    }
    product.subCategoryId = subCategoryId
  }

  const brandExists = await brandModel.findById(brandId || product.brandId)
  if (brandId) {
    if (!brandExists) {
      return next(new Error('In-valid Brand', { cause: 400 }))
    }
    product.brandId = brandId
  }

  //=========== Delete from cloudinary ==============
  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${product.customId}`,
  )

  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${product.customId}`,
  )

  res.status(200).json({ message: 'Done', product })
}