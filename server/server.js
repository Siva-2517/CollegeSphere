const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const session = require('express-session')
const passport = require('./config/passport')

dotenv.config()

const connectDB = require('./config/db')
const authRoutes = require('./routes/auth.routes')
const eventRoutes = require('./routes/event.routes')
const collegeRoutes = require('./routes/college.routes')
const regisRoutes = require('./routes/regis.routes')
const adminRoutes = require('./routes/admin.routes')
connectDB()

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Session config (required for Passport OAuth flow)
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

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