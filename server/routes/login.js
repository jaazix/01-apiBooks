const express = require('express');
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario');
const usuario = require('../models/usuario');
const app = express();

app.post('/login', (req, res) => {
    let body = req.body;

    Usuario.findOne({ email: body.email }, (err, usrDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                msg: 'Ocurrio un error al momento del logueo',
                err
            });
        }

        if (!usrDB) {
            return res.status(400).json({
                ok: false,
                msg: 'Mail incorrecto o inexistente, intentelo de nuevo'
            });
        }

        if (usrDB.estado == false){
            return res.status(401).json({
                ok: false,
                msg: 'tu Cuenta a sido bloqueada, contacta a un administrador para reestablecerla'
            });
        }

        if (bcrypt.compareSync(body.password, usrDB.password)) {
            Usuario.findOneAndUpdate({email: body.email}, { failedAttempts: 0 }, { new: true }, (err) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'error de servidor',
                        err
                    });
                }
            })
            return res.json({
                ok: true,
                msg: `Bienvenido ${usrDB.nombre}`,
                usrDB
            });
        } else {
            if(usrDB.failedAttempts <= 3){
            Usuario.findOneAndUpdate({email: body.email}, { failedAttempts: usrDB.failedAttempts + 1 }, { new: true }, (err, usrDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    msg: 'error de servidor',
                    err
                });
            }
            res.status(401).json({
                ok: false,
                msg: 'Contraseña incorrecta, tienes ' + usrDB.failedAttempts + '/3 intentos fallidos'
            })
        })}else{
            Usuario.findOneAndUpdate({email: body.email}, { estado: false }, { new: true }, (err, usrDB) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'error de servidor',
                        err
                    });
                }
                res.status(401).json({
                    ok: false,
                    msg: 'tu Cuenta a sido bloqueada, contacta a un administrador para reestablecerla'
                })
            })
        }
        }
    });
});

module.exports = app;