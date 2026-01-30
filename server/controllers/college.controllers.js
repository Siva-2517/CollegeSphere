const College = require('../modals/College')

exports.createCollege = async (req, res) => {
    try {
        const { name, location, emailDomain } = req.body;
        const exist = await College.findOne({ name });    

        if(exist){
            return  res.status(400).json({ message: 'College already exists' });
        }
        const college=await College.create({
            name,
            location,
            emailDomain,
            isVerified:true
        });
        res.status(201).json({ message: 'College created successfully', college });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.getColleges = async (req, res) => {
    try {
        const colleges = await College.find();
        res.status(200).json({ colleges });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}