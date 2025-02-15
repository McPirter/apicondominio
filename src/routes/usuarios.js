const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuarios');
const Departamento = require('../models/departamento');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Notificacion = require('../models/notificacion');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');  // Importar el middleware

// Crear usuario
router.post('/crear_usuario', async (req, res) => {
    try {
        const { telefono, nombre, contraseña, perfil, departamento } = req.body;

        if (!telefono || !nombre || !contraseña) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const hashedPassword = await bcrypt.hash(contraseña, 10);

        let departamentoObj = null;
        if (departamento && departamento !== 'No aplica') {
            departamentoObj = await Departamento.findById(departamento);
            if (!departamentoObj) {
                return res.status(400).json({ message: 'Departamento no encontrado' });
            }
        }

        const nuevoUsuario = new Usuario({
            telefono,
            nombre,
            contraseña: hashedPassword,
            perfil,
            departamento: departamentoObj ? departamentoObj._id : null,
        });

        await nuevoUsuario.save();
        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
});

// Login con generación de token
router.post('/login', async (req, res) => {
    try {
        const { telefono, contraseña } = req.body;

        if (!telefono || !contraseña) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const usuario = await Usuario.findOne({ telefono });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!isMatch) {
            return res.status(400).json({ message: 'Usuario o Contraseña incorrecta' });
        }

        // Generar el token con duración de 3 horas
        const token = jwt.sign({ id: usuario._id, perfil: usuario.perfil }, process.env.JWT_SECRET, { expiresIn: '3h' });

        res.status(200).json({ message: 'Login exitoso', token });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});

// Rutas protegidas con autenticación
router.get('/notificaciones/:usuarioId', auth, async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId;
        if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ message: 'ID de usuario no válido' });
        }
        const notificaciones = await Notificacion.find({ usuario: usuarioId, leida: false });
        res.json(notificaciones);
    } catch (error) {
        console.error('Error al obtener las notificaciones:', error);
        res.status(500).json({ message: 'Error al obtener las notificaciones' });
    }
});

module.exports = router;
