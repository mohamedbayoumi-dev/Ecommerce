

import { initiateApp } from './src/utils/initiateApp.js'
import express from 'express'
import { config } from 'dotenv'
import Path from 'path'
config({
  path: Path.resolve('./config/config.env')
})
const app = express()

initiateApp(app,express)