const User = require('../modals/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, collegeId } = req.body
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' })
        }
        const allowedRoles = ['organizer', 'student']
        const safeRole = allowedRoles.includes(role) ? role : 'student'

        if (role === 'admin') {
            return res.status(403).json({ msg: 'Cannot register as admin' })
        }
        const newUser = await User.create({
            name,
            email,
            password,
            role: safeRole,
            collegeId: collegeId || null,
            isApproved: role === 'organizer' ? false : true
        })
        console.log("User college ids:", collegeId);
        res.status(201).json({ msg: 'User registered successfully', user: newUser })
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ err })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials NO User found!' })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid email or password' })
        }

        const token = jwt.sign(
            {
                Id: user._id,
                role: user.role,
                isApproved: user.isApproved || false,
                collegeId: user.collegeId || null
            },
            process.env.JWT_SECRET,
            { expiresIn: '3h' }
            // console.log("User college ids:", user.collegeId);
        )
        res.status(200).json({
            msg: 'Login successful', token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ err })
    }
}
