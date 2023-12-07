const mongoose = require('mongoose');
const validator = require('validator')
const jwt = require('jsonwebtoken')

let Schema = mongoose.Schema;

let usuarioSchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    email: {
        type: String,
        required: [true, 'El correo es necesario'],
        unique: true,
        lowercase: true,
        validate: value => {
            if (!validator.isEmail(value)) {
                throw new Error({error: 'Invalid Email address'})
            }
        }
    },
    password: {
        type: String, 
        required: [true, 'La contraseña es necesaria']
    },
    img: {
        type: String,
        required: false,
        default: 'user.svg'
    },
    role: {
        type: String, 
        default: 'USER_ROLE'
    },
    estado: {
        type: Boolean,
        default: true
    },
    token: {
        type: String,
        required: true
    },
    verify: {
        type: Boolean,
        default: false
    },
    termsConformity: {
        type: Boolean,
        required:true
    }
});

module.exports = mongoose.model('Usuario',usuarioSchema);
