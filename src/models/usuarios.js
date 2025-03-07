const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  telefono: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  contraseña: { type: String, required: true },
  perfil: { type: String, enum: ['Administrador', 'Jefe', 'Usuario'], default: 'Usuario' },
  departamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Departamento', default: null },
  tokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],
  token_recuperacion: { type: String, default: null, expires: 3600 } // Expira en 1 hora
}, {
  timestamps: true,
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
