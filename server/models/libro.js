const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let libroSchema = new Schema({
    titulo: {
        type: String,
        required: [true, 'El titulo es necesario']
    },
    usuario: {
        type: String,
        required: [true, 'El usuario es necesario']
    },
    descripcion: {
        type: String,
        required: [true, 'La descripcion es necesaria']
    },
    categoria: {
        type: String,
        required: [true, 'La categoria es necesaria']
    },
    img: {
        type: String,
        required: false,
        default: 'book.svg'
    },
    estado: {
        type: Boolean,
        default: true
    },
    private: {
        type: Boolean,
        default: false
    },
});