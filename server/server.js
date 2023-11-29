require('./config');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json());
app.use(cors());
 
app.get('/', function (req, res) {
  res.status(200).json({
    ok: true,
    msg: '<h1> Bienvenido a mi servidor Rest </h1>'
});
});

app.use(require('./routes/login'));
app.use(require('./routes/usuario'));
app.use(require('./routes/chat'));
app.use(require('./routes/suma'));

 mongoose.connect('mongodb+srv://admin:password_server20@cluster0.nckh7.mongodb.net/books', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useFindAndModify: false,
    // useCreateIndex: true
 }).then(() => console.log('Base de datos ONLINE')).catch(err => console.log(err));

app.listen(process.env.PORT, () => {
  console.log('El servidor esta en linea por el puerto', process.env.PORT);
});
