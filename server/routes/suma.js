// route for sum two numbers
const express = require('express');
const app = express();
const _ = require('underscore');

app.post('/suma', (req, res) => {
    let body = req.body;
    let num1 = body.num1;
    let num2 = body.num2;
    let suma = num1 + num2;
    res.json({
        ok: true,
        msg: 'Suma exitosa',
        suma
    });
});

module.exports = app;