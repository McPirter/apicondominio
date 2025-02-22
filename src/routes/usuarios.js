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
router.post('/crear_usuario', auth, async (req, res) => {
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
            return res.status(400).json({ message: 'Usuario o contraseña incorrecta' });
        }

        // Generar el token con duración de 3 horas
        const token = jwt.sign({ id: usuario._id, perfil: usuario.perfil }, process.env.JWT_SECRET, { expiresIn: '3h' });

        // Limitar la cantidad de tokens activos (por ejemplo, 5 sesiones máximo)
        if (usuario.tokens.length >= 5) {
            usuario.tokens.shift(); // Elimina el token más antiguo
        }

        usuario.tokens.push({ token });
        await usuario.save();

        res.status(200).json({ message: 'Login exitoso', token, perfil: usuario.perfil, userId: usuario._id });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});


// Rutas protegidas con autenticación
router.get('/notificaciones/:usuarioId', auth, async (req, res) => {
  try {
      const usuarioId = req.params.usuarioId;  // ID de usuario de la URL
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

router.put('/cambiar_contra/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { contraseñaActual, nuevaContraseña } = req.body;

        if (!contraseñaActual || !nuevaContraseña) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const usuario = await Usuario.findById(userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar la contraseña actual
        const isMatch = await bcrypt.compare(contraseñaActual, usuario.contraseña);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        }

        // Hashear la nueva contraseña
        usuario.contraseña = await bcrypt.hash(nuevaContraseña, 10);

        // Vaciar tokens para cerrar todas las sesiones activas
        usuario.tokens = [];

        await usuario.save();

        res.status(200).json({ message: 'Contraseña cambiada exitosamente. Por favor, inicie sesión nuevamente.' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ message: 'Error al cambiar contraseña' });
    }
});



router.post('/logout', auth, async (req, res) => {
    try {
        const { recordarme } = req.body; // Recibir el valor de "Recordarme" desde el frontend

        if (!recordarme) { 
            // Si "Recordarme" es falso, eliminar el token actual (cerrar solo esta sesión)
            req.usuario.tokens = req.usuario.tokens.filter(t => t.token !== req.token);
        } 
        // Si "Recordarme" es true, no hacemos nada, el token sigue activo

        await req.usuario.save();
        res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al cerrar sesión.' });
    }
});




router.post('/logoutAll', auth, async (req, res) => {
    try {
        req.usuario.tokens = []; // Vaciar la lista de sesiones
        await req.usuario.save();
        res.status(200).json({ message: 'Cerraste sesión en todos los dispositivos.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al cerrar sesión en todos los dispositivos.' });
    }
});


module.exports = router;
