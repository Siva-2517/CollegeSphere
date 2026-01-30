const jwt=require('jsonwebtoken')

exports.protect= (roles=[])=>{
    return async(req,res,next)=>{
    try{
        const head=req.headers.authorization
        if(!head || !head.startsWith('Bearer ')){
            return res.status(401).json({msg:'No token Provided,authorization denied'})
        }
        const token=head.split(' ')[1];
        if(!token){
            return res.status(401).json({msg:'No token Provided,authorization denied'})
        }
            const decoded=jwt.verify(token,process.env.JWT_SECRET)
            req.user=decoded
            
            if (req.user.role === "organizer" && !req.user.isApproved) {
            return res.status(403).json({
            message: "Admin approval pending. Access denied."
            });
            }

            if(roles.length && !roles.includes(req.user.role)){
                return res.status(403).json({msg:'User role not authorized'})
            }
            next();
        }
        catch(err){
            console.error('Auth middleware error:', err.message)
            return res.status(401).json({msg:'Token is not valid'})
        }
    };
};
