const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const Usuario = require('../models/usuario');
const app = express();
const jwt = require('jsonwebtoken');
const {transporter, htmlTemplate} = require('../config/mailer.config');

// list users
app.post('/usuario/list', verifyToken,(req, res) => {
    let desde = req.query.desde || 0;
    let hasta = req.query.hasta || 5; 

    jwt.verify(req.token, "my_secret_key", (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            if(authData.user.role == "ADMIN"){
                Usuario.find({ estado: true })
                .skip(Number(desde))
                .limit(Number(hasta))
                .exec((err, usuarios) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            msg: 'Ocurrio un error al momento de consultar',
                            err
                        });
                    }
        
                    res.json({
                        ok: true,
                        msg: 'Lista de usuarios obtenida con exito',
                        conteo: usuarios.length,
                        usuarios
                    });
                });}
                else{
                    return res.status(400).json({
                        ok: false,
                        msg: 'No tienes permisos para realizar esta operacion',
                        err
                    });
                }
        }
    });

});

// register user
app.post('/usuario', function(req, res) {
    const user = {
        email: req.body.email,
        role: "USER_ROLE"
    }
    const token = jwt.sign({user},process.env.JWT_KEY);
    let body = req.body;

    if(!validatePassword(body.password)){
        return res.status(400).json({
            ok: false,
            msg: `Contraseña Invalida: 
            La contraseña debe tener al menos 8 caracteres 
            Debe contener al menos una letra minúscula.Debe contener al menos una letra mayúscula.
            Debe contener al menos un número. <br> No debe contener números consecutivos.
            Ni debe contener letras consecutivas.`
        });
    }
    let usr = new Usuario({
        name: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        token: token,
        termsConformity: body.terms
    });


    const mail = htmlTemplate(token);
    const mailData = {
        from: process.env.CORREO,  // sender address
            to: body.email,   // list of receivers
            subject: 'Confirm your account',
            text: '',
            html: mail
        }

    usr.save((err, usrDB) => {
        if (err) {
            if(err.code == 11000){
                return res.status(400).json({
                    ok: false,
                    msg: 'El correo en uso, recupera tu contraseña si la has olvidado',
                    err
                });   
            }
            return res.status(400).json({
                ok: false,
                msg: 'Ocurrio un error',
                err
            });
        }

        transporter.sendMail(mailData,(error, info)=>{
            if(error){
                return console.log(error)
            }
        })

        res.json({
            ok: true,
            msg: 'Usuario insertado con exito',
            usrDB
        });
    });
});

// update user
app.put('/usuario/:token', function(req, res) {
    let id = req.params.token;
    let body = _.pick(req.body, ['nombre', 'email']);

    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true, context: 'query' },
        (err, usrDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Ocurrio un error al momento de actualizar',
                    err
                });
            }

            res.json({
                ok: true,
                msg: 'Usuario actualizado con exito',
                usuario: usrDB
            });
        });
});

// desactivate user
app.delete('/usuario/:id', function(req, res) {

    let id = req.params.id;

    Usuario.findByIdAndUpdate(id, { estado: false }, { new: true, runValidators: true, context: 'query' }, (err, usrDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'Ocurrio un error al momento de eliminar',
                err
            });
        }

        res.json({
            ok: true,
            msg: 'Usuario eliminado con exito',
            usrDB
        });
    });
});

// validate mail
app.get('/usuario/validate/:token', function(req, res) {
    let token = req.params.token;
    jwt.verify(token, process.env.JWT_KEY, (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            Usuario.findOneAndUpdate({ token: token }, { verify: true }, { new: true, runValidators: true, context: 'query' }, (err, usrDB) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'Ocurrio un error al momento de validar',
                        err
                    });
                }
                res.json({
                    ok: true,
                    msg: 'Usuario validado con exito',
                    usrDB
                });
            });
        }
    });
});

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403).json({
            message: 'Token not provided'
        }); 
    }
}

function validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])[a-zA-Z0-9!@#$%^&*()_+-={}|;:,.<>/?]+$/;
    return regex.test(password);
  }

module.exports = app;