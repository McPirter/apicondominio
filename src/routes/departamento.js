const express = require('express');
const router = express.Router();
const Departamento = require('../models/departamento');  // Asegúrate de tener la ruta correcta al modelo

// Crear nuevo departamento
router.post('/agregar_depa', async (req, res) => {
  try {
    const { numero, lugar } = req.body;

    if (!numero || !lugar) {
      return res.status(400).json({ message: 'El número y lugar son obligatorios' });
    }

    // Crear nuevo departamento
    const nuevoDepartamento = new Departamento({
      numero,
      lugar,
    });

    await nuevoDepartamento.save();
    res.status(201).json({ message: 'Departamento agregado exitosamente' });
  } catch (error) {
    console.error('Error al agregar departamento:', error);
    res.status(500).json({ message: 'Error al agregar departamento' });
  }
});

// Obtener todos los departamentos
router.get('/departamentos', async (req, res) => {
  try {
    const departamentos = await Departamento.find();
    res.status(200).json({ departamentos });
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    res.status(500).json({ message: 'Error al obtener departamentos' });
  }
});

// Obtener departamentos
router.get('/obtener_departamentos', async (req, res) => {
  try {
    const departamentos = await Departamento.find();
    res.json(departamentos);
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    res.status(500).json({ message: 'Error al obtener departamentos' });
  }
});



module.exports = router;
