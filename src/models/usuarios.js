const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  telefono: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  contraseña: { type: String, required: true },
  perfil: {
    type: String,
    enum: ['Administrador', 'Jefe', 'Usuario'],
    default: 'Usuario', // Predeterminado
  },
  departamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Departamento', default: null }, // Relación con Departamento
}, {
  timestamps: true,
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
