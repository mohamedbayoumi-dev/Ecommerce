

import mongoose from "mongoose"

export const dbConnection = async () => {
  return await mongoose.connect(process.env.CONNECTION_DB_CLOUD)
    .then((res) => console.log("Db Connection Success .."))
    .catch((error) => console.log("Db Connection Fail", error))
}