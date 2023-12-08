const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const Usuario = require('../models/usuario');
const app = express();
const jwt = require('jsonwebtoken');
const {transporter, htmlTemplate, recoverTemplate } = require('../config/mailer.config');

// list users
app.post('/usuario/list', verifyToken,(req, res) => { 

    jwt.verify(req.token, "my_secret_key", (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            if(authData.user.role == "ADMIN"){
                Usuario.find({ estado: true })
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

// recover password
app.post('/usuario/recover', function(req, res) {
    let body = req.body;

    Usuario.findOne({ email: body.email }, (err, usrDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'Ocurrio un error al momento de recuperar',
                err
            });
        }

        if (!usrDB) {
            return res.status(400).json({
                ok: false,
                msg: 'Mail incorrecto o inexistente, intentelo de nuevo'
            });
        }

        const mail = recoverTemplate(usrDB.token);

        const mailData = {
            from: process.env.CORREO,  // sender address
                to: body.email,   // list of receivers
                subject: 'Recover your password',
                text: '',
                html: mail
            }
        transporter.sendMail(mailData,(error, info)=>{
            if(error){
                return console.log(error)
            }
        })

        res.json({
            ok: true,
            msg: 'Usuario recuperado con exito',
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
                res.send(
                    `<section class="bg-light py-3 py-md-5">
                    <div class="container">
                      <div class="row justify-content-md-center">
                        <div class="col-12 col-md-10 col-lg-8 col-xl-7 col-xxl-6">
                          <h2 class="mb-4 display-5 text-center">Congratulations</h2>
                          <p class="text-secondary mb-5 text-center">Your Account has Been Successfully Verified
                          .</p>
                          <hr class="w-50 mx-auto mb-5 mb-xl-9 border-dark-subtle">
                        </div>
                      </div>
                    </div>
                  </section>
                  <link rel="stylesheet" href="https://unpkg.com/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
                  <link rel="stylesheet" href="https://unpkg.com/bs-brain@2.0.3/components/contacts/contact-1/assets/css/contact-1.css" />`
                );
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
