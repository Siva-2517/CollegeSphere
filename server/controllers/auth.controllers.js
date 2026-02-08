const User = require('../modals/User')
const OTP = require('../modals/OTP')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/sendEmail')

// Send OTP to email
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ msg: 'Email is required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any existing OTPs for this email
        await OTP.deleteMany({ email });

        // Save new OTP
        await OTP.create({ email, otp });

        // Send OTP email
        const emailSubject = "Your CollegeSphere Verification Code";
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #1f2937; margin-bottom: 20px;">Email Verification</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Thank you for registering with CollegeSphere! Please use the following verification code to complete your registration:
                    </p>
                    
                    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="color: #1e40af; font-size: 14px; margin-bottom: 10px;">Your Verification Code</p>
                        <p style="color: #1e3a8a; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0;">${otp}</p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                        This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
                    </p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        Best regards,<br/>
                        <strong>The CollegeSphere Team</strong>
                    </p>
                </div>
            </div>
        `;

        try {
            await sendEmail(email, emailSubject, emailHtml);
        } catch (emailError) {
            console.error('Resend API error:', emailError);
        }

        res.status(200).json({ msg: 'OTP sent successfully to your email' });
    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ msg: 'Failed to send OTP', error: err.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, collegeId, otp } = req.body

        // Verify OTP first
        if (!otp) {
            return res.status(400).json({ msg: 'OTP is required' });
        }

        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

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

        // Delete OTP after successful registration
        await OTP.deleteOne({ email, otp });

        try {
            let emailSubject = "Welcome to CollegeSphere - Account Created Successfully 🎉";
            let emailHtml = '';

            if (safeRole === 'student') {
                emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to CollegeSphere, ${name}! 🎓</h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Your student account has been created successfully.</p>
                            
                            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">What's next?</p>
                                <ul style="color: #1e3a8a; line-height: 1.8;">
                                    <li>Browse upcoming events from colleges</li>
                                    <li>Register for events that interest you</li>
                                    <li>Manage your registrations from your dashboard</li>
                                </ul>
                            </div>
                            
                            <p style="color: #4b5563; font-size: 16px; margin-top: 20px;">Happy exploring!</p>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                Best regards,<br/>
                                <strong>The CollegeSphere Team</strong>
                            </p>
                        </div>
                    </div>
                `;
            } else if (safeRole === 'organizer') {
                emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to CollegeSphere, ${name}! 🎯</h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Your organizer account has been created successfully.</p>
                            
                            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                                <p style="color: #92400e; font-weight: bold; margin-bottom: 10px;">⏳ Pending Approval</p>
                                <p style="color: #78350f; line-height: 1.6;">Your account is currently under review by our admin team. You'll receive a notification once your account is approved.</p>
                            </div>
                            
                            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #065f46; font-weight: bold; margin-bottom: 10px;">Once approved, you'll be able to:</p>
                                <ul style="color: #047857; line-height: 1.8;">
                                    <li>Create and manage college events</li>
                                    <li>Track event registrations</li>
                                    <li>View participant details</li>
                                </ul>
                            </div>
                            
                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                Best regards,<br/>
                                <strong>The CollegeSphere Team</strong>
                            </p>
                        </div>
                    </div>
                `;
            }

            await sendEmail(email, emailSubject, emailHtml);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError.message);
        }

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

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.Id;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ msg: 'Name is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.name = name.trim();
        await user.save();

        res.status(200).json({
            msg: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                collegeId: user.collegeId
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Failed to update profile', error: err.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.Id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'New password must be at least 6 characters long' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword; // Will be hashed by pre-save middleware
        await user.save();

        res.status(200).json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Failed to update password', error: err.message });
    }
};
