const jwt = require('jsonwebtoken');

const generarJWT = (payload) => {
    return jwt.sign({
        payload
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '12h' });
}

const validarJWT = (token) => {
    let data = null;
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err){
            console.log(err);
        }else{
            data = decoded;
        }
    }
    );
    return data;
}

module.exports = {
    generarJWT,
    validarJWT
}