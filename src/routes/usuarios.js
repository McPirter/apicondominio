const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuarios');
const Departamento = require('../models/departamento');
const bcrypt = require('bcrypt');
const Notificacion = require('../models/notificacion');
const mongoose = require('mongoose');  // Asegúrate de importar mongoose

// Crear nuevo usuario
router.post('/crear_usuario', async (req, res) => {
  try {
    const { telefono, nombre, contraseña, perfil, departamento } = req.body;

    // Validación de campos requeridos
    if (!telefono || !nombre || !contraseña) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Cifrar la contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Verificar si el departamento existe
    let departamentoObj = null;
    if (departamento && departamento !== 'No aplica') {
      departamentoObj = await Departamento.findById(departamento);
      if (!departamentoObj) {
        return res.status(400).json({ message: 'Departamento no encontrado' });
      }
    }

    // Crear el nuevo usuario
    const nuevoUsuario = new Usuario({
      telefono,
      nombre,
      contraseña: hashedPassword,
      perfil,
      departamento: departamentoObj ? departamentoObj._id : null,  // Asociamos el departamento si existe
    });

    // Guardar el nuevo usuario en la base de datos
    await nuevoUsuario.save();
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { telefono, contraseña } = req.body;

    // Validación de campos
    if (!telefono || !contraseña) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Buscar usuario por teléfono
    const usuario = await Usuario.findOne({ telefono });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!isMatch) {
      return res.status(400).json({ message: 'Usuario o Contraseña incorrecta' });
    }

    // Si la contraseña es correcta, iniciar sesión y devolver el userId
    res.status(200).json({ message: 'Login exitoso', perfil: usuario.perfil, userId: usuario._id });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

// Obtener notificaciones del usuario
router.get('/notificaciones/:usuarioId', async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;

    // Verificar si el usuarioId tiene el formato correcto (24 caracteres hexadecimales)
    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }

    // Si el ID es válido, buscar las notificaciones
    const notificaciones = await Notificacion.find({ usuario: usuarioId, leida: false });
    res.json(notificaciones);  // Asegúrate de devolver un arreglo
  } catch (error) {
    console.error('Error al obtener las notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener las notificaciones' });
  }
});

// Marcar notificación como leída
router.put('/notificaciones/:notificacionId', async (req, res) => {
  try {
    const notificacion = await Notificacion.findByIdAndUpdate(req.params.notificacionId, { leida: true }, { new: true });
    res.json(notificacion);
  } catch (error) {
    console.error('Error al marcar la notificación como leída:', error);
    res.status(500).json({ message: 'Error al marcar la notificación como leída' });
  }
});

module.exports = router;
