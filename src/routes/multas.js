const express = require('express');
const router = express.Router();
const Multa = require('../models/multas');
const Departamento = require('../models/departamento');
const Notificacion = require('../models/notificacion');
const Usuario = require('../models/usuarios');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');  // Importar el middleware

// Obtener multas (protegida)
router.get('/obtener_multas', auth, async (req, res) => {
    try {
        const multas = await Multa.find().populate('departamento');
        res.json(multas);
    } catch (error) {
        console.error('Error al obtener las multas:', error);
        res.status(500).json({ error: 'Error al obtener las multas' });
    }
});

// Agregar multa (protegida)
router.post('/agregar_multa', auth, async (req, res) => {
    try {
        const { monto, descripcion, fecha, departamento } = req.body;

        if (!monto || !descripcion || !fecha || !departamento) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const departamentoObj = await Departamento.findById(departamento);
        if (!departamentoObj) {
            return res.status(400).json({ message: 'Departamento no encontrado' });
        }

        const usuario = await Usuario.findOne({ departamento: departamentoObj._id });
        if (!usuario) {
            return res.status(400).json({ message: 'No se encuentra un usuario para este departamento' });
        }

        const nuevaMulta = new Multa({
            monto,
            descripcion,
            fecha,
            departamento: departamentoObj._id,
        });
        await nuevaMulta.save();

        const nuevaNotificacion = new Notificacion({
            mensaje: `Nueva multa registrada: ${descripcion}`,
            usuario: usuario._id,
        });

        await nuevaNotificacion.save();

        res.status(201).json({ message: 'Multa y notificación registrada exitosamente' });
    } catch (error) {
        console.error('Error al registrar la multa:', error);
        res.status(500).json({ message: 'Error al registrar la multa' });
    }
});

module.exports = router;
