const express = require('express');
const router = express.Router();
const Multa = require('../models/multas');
const Departamento = require('../models/departamento');
const Notificacion = require('../models/notificacion');
const Usuario = require('../models/usuarios');
const mongoose = require('mongoose');  // Asegúrate de importar mongoose


// Obtener multas
router.get('/obtener_multas', async (req, res) => {
    try {
        const multas = await Multa.find().populate('departamento'); // Agregamos populate para obtener los datos del departamento

        const formattedMultas = multas.map((multa) => ({
            id: multa._id,
            monto: multa.monto,
            descripcion: multa.descripcion,
            fecha: multa.fecha,
            departamento: multa.departamento ? multa.departamento.nombre : null, // Mostramos el nombre del departamento
        }));

        res.json(formattedMultas);
    } catch (error) {
        console.error('Error al obtener las multas:', error);
        res.status(500).json({ error: 'Error al obtener las multas' });
    }
});

// Insertar multa y notificación
router.post('/agregar_multa', async (req, res) => {
    try {
        const { monto, descripcion, fecha, departamento } = req.body;

        // Validar datos
        if (!monto || !descripcion || !fecha || !departamento) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Verificar si el departamento existe
        const departamentoObj = await Departamento.findById(departamento);
        if (!departamentoObj) {
            return res.status(400).json({ message: 'Departamento no encontrado' });
        }

        // Obtener el usuario que pertenece al departamento
        const usuario = await Usuario.findOne({ departamento: departamentoObj._id });
        if (!usuario) {
            return res.status(400).json({ message: 'No se encuentra un usuario para este departamento' });
        }

        // Crear nueva multa
        const nuevaMulta = new Multa({
            monto,
            descripcion,
            fecha,
            departamento: departamentoObj._id, // Asociamos el departamento
        });
        await nuevaMulta.save();

        // Crear una notificación para el usuario
        const mensaje = `Nueva multa registrada: ${descripcion}`;
        const nuevaNotificacion = new Notificacion({
            mensaje,
            usuario: usuario._id,  // Asociamos el ID del usuario con la notificación
        });

        // Intentar guardar la notificación
        await nuevaNotificacion.save();

        // Verificar si la notificación se guardó correctamente
        console.log('Notificación añadida correctamente:', nuevaNotificacion);
        
        // Responder con éxito
        res.status(201).json({ message: 'Multa y notificación registrada exitosamente', multa: nuevaMulta });
    } catch (error) {
        console.error('Error al registrar la multa y la notificación:', error);
        res.status(500).json({ message: 'Error al registrar la multa y la notificación' });
    }
});


module.exports = router;
