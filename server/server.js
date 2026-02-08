const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')

dotenv.config()

const connectDB = require('./config/db')
const authRoutes = require('./routes/auth.routes')
const eventRoutes = require('./routes/event.routes')
const collegeRoutes = require('./routes/college.routes')
const regisRoutes = require('./routes/regis.routes')
const adminRoutes = require('./routes/admin.routes')
connectDB()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/event', eventRoutes)
app.use('/api/college', collegeRoutes)
app.use('/api/registration', regisRoutes)
app.use('/api/admin', adminRoutes)


app.get('/', (req, res) => {
  res.send('College Events Management System API is running')
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})