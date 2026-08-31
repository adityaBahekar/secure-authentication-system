function validateRegister(req, res, next) {
    if (!req.body.name) {
        return res.status(400).json({
            message: 'name is missing'
        })
    }
    if (!req.body.password) {
        return res.status(400).json({
            message: 'password is missing'
        })
    }
    if(req.body.password.length<8){
        return res.status(400).json({
            message: 'password must be atleast 8 character long'
        })
    }
    if (!req.body.email) {
        return res.status(400).json({
            message: 'email is missing'
        })
    }
    next()
}

module.exports = {validateRegister} 