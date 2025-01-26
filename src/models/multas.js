const mongoose = require('mongoose');

const MultaSchema = new mongoose.Schema({
    monto: { type: String, required: true },
    descripcion: { type: String, required: true },
    fecha: { type: Date, required: true },
    departamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Departamento', required: true }, // Aquí agregamos el departamento
}, {
    timestamps: true, // Opcional: agrega createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Multa', MultaSchema);
