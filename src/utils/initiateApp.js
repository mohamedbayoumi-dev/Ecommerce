

import * as allRouters from '../../src/modules/index.routes.js'
import { dbConnection } from '../../DB/connection.js'
import { globalError } from '../utils/errorHandling.js'
import { cronToChangeCouponStatus } from './crons.js'
import cors from 'cors'

export const initiateApp = (app, express) => {

  const port = process.env.PORT || 5000

  app.use(express.json())
  dbConnection()
  app.use(cors())
  app.use('/category', allRouters.categoryRouter)
  app.use('/subCategory', allRouters.subCategoryRouter)
  app.use('/brand', allRouters.brandRouter)
  app.use('/product', allRouters.product)
  app.use('/coupon', allRouters.coupon)
  app.use('/auth', allRouters.auth)
  app.use('/cart', allRouters.cart)
  app.use('/order', allRouters.order)

  app.all('*', (req, res, next) => {
    next(new Error('404 NOT FOUND URL', { cause: 404 }))
  })

  app.use(globalError)
  // cronToChangeCouponStatus()


  app.get('/', (req, res) => res.send('Hello World!'))
  app.listen(port, () => console.log(`Example app listening on port ${port}!`))

}