const mongoose = require('mongoose');

const DepartamentoSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },  // Puedes definirlo como String o Number según tus necesidades.
  lugar: { type: String, required: true },
}, {
  timestamps: true,  // Esto crea campos `createdAt` y `updatedAt` automáticamente.
});

module.exports = mongoose.model('Departamento', DepartamentoSchema);
