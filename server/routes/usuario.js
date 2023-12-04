const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const Usuario = require('../models/usuario');
const app = express();
const jwt = require('jsonwebtoken');
const {transporter} = require('../config/mailer.config');

const contentHTML = `
<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tailwind CSS Simple Email Template Example </title>
        <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="flex items-center justify-center min-h-screen p-5 bg-blue-100 min-w-screen">
            <div class="max-w-xl p-8 text-center text-gray-800 bg-white shadow-xl lg:max-w-3xl rounded-3xl lg:p-12">
                <h3 class="text-2xl">Thanks for signing up for Websitename!</h3>
                <div class="flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 text-green-400" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                            d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                    </svg>
                </div>

                <p>We're happy you're here. Let's get your email address verified:</p>
                <div class="mt-4">
                    <button class="px-2 py-2 text-blue-200 bg-blue-600 rounded">Click to Verify Email</button>
                    <p class="mt-4 text-sm">If you’re having trouble clicking the "Verify Email Address" button, copy
                        and
                        paste
                        the URL below
                        into your web browser:
                        <a href="#" class="text-blue-600 underline">http://localhost:8000/email/verify/3/1ab7a09a3</a>
                    </p>
                </div>
            </div>
        </div>
    </body>
</html>
`

const mailData = {
    from: process.env.CORREO,  // sender address
        to: 'jaaziel.work@gmail.com',   // list of receivers
        subject: 'Sending Email using Node.js',
        text: 'That was easy!',
        html: `<!DOCTYPE html>
        <html lang="en">
        
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Tailwind CSS Simple Email Template Example </title>
                <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="flex items-center justify-center min-h-screen p-5 bg-blue-100 min-w-screen">
                    <div class="max-w-xl p-8 text-center text-gray-800 bg-white shadow-xl lg:max-w-3xl rounded-3xl lg:p-12">
                        <h3 class="text-2xl">Thanks for signing up for Websitename!</h3>
                        <div class="flex justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 text-green-400" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                            </svg>
                        </div>
        
                        <p>We're happy you're here. Let's get your email address verified:</p>
                        <div class="mt-4">
                            <button class="px-2 py-2 text-blue-200 bg-blue-600 rounded">Click to Verify Email</button>
                            <p class="mt-4 text-sm">If you’re having trouble clicking the "Verify Email Address" button, copy
                                and
                                paste
                                the URL below
                                into your web browser:
                                <a href="#" class="text-blue-600 underline">http://localhost:8000/email/verify/3/1ab7a09a3</a>
                            </p>
                        </div>
                    </div>
                </div>
            </body>
        </html>`,
    }

app.get('/mail',(req, res)=>{
    transporter.sendMail(mailData,(error, info)=>{
        if(error){
            return console.log(error)
        }
        res.status(200).send({message:"Mail send", message_id:info.messageId})
    })
})

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
            msg: 'Contraseña Invalida',
            err
        });
    }
    let usr = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        token: token
    });

    usr.save((err, usrDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'Ocurrio un error',
                err
            });
        }



        res.json({
            ok: true,
            msg: 'Usuario insertado con exito',
            usrDB
        });
    });
});

app.put('/usuario/:id', function(req, res) {
    let id = req.params.id;
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

app.delete('/usuario/:id', function(req, res) {
    // let id = req.params.id;

    // Usuario.deleteOne({ _id: id }, (err, usuarioBorrado) => {
    //     if (err) {
    //         return res.status(400).json({
    //             ok: false,
    //             msg: 'Ocurrio un error al momento de elimar',
    //             err
    //         });
    //     }

    //     res.json({
    //         ok: true,
    //         msg: 'Usuario eliminado con exito',
    //         usuarioBorrado
    //     });
    // });

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