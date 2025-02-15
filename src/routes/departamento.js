const express = require('express');
const router = express.Router();
const Departamento = require('../models/departamento');
const auth = require('../middleware/auth');  // Importar el middleware

// Agregar departamento (protegida)
router.post('/agregar_depa', auth, async (req, res) => {
    try {
        const { numero, lugar } = req.body;

        if (!numero || !lugar) {
            return res.status(400).json({ message: 'El número y lugar son obligatorios' });
        }

        const nuevoDepartamento = new Departamento({ numero, lugar });
        await nuevoDepartamento.save();
        res.status(201).json({ message: 'Departamento agregado exitosamente' });
    } catch (error) {
        console.error('Error al agregar departamento:', error);
        res.status(500).json({ message: 'Error al agregar departamento' });
    }
});

// Obtener departamentos (protegida)
router.get('/obtener_departamentos', auth, async (req, res) => {
    try {
        const departamentos = await Departamento.find();
        res.json(departamentos);
    } catch (error) {
        console.error('Error al obtener departamentos:', error);
        res.status(500).json({ message: 'Error al obtener departamentos' });
    }
});

module.exports = router;
