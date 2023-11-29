const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const Usuario = require('../models/usuario');
const app = express();
const jwt = require('jsonwebtoken');


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
    const token = jwt.sign({user},"my_secret_key");
    let body = req.body;
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

module.exports = app;