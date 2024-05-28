
import subCategoryRouter from '../modules/subCategories/subCategory.routes.js'
import categoryRouter from '../modules/Categories/category.routes.js'
import product from '../modules/Products/product.routes.js'
import brandRouter from '../modules/Brands/brand.routes.js'
import coupon from '../modules/Coupons/coupon.routes.js'
import auth from '../modules/Auth/auth.routes.js'
import cart from './Carts/cart.routes.js'
import order from './Orders/order.routes.js'


export {
  categoryRouter,
  subCategoryRouter,
  brandRouter,
  product,
  coupon,
  auth,
  cart,
  order
}