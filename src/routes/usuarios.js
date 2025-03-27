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

router.get('/verificar_token', auth, async (req, res) => {
    try {
        // Buscar el usuario con el token activo
        const usuario = await Usuario.findOne({ _id: req.usuario._id, 'tokens.token': req.token });

        if (!usuario) {
            return res.status(401).json({ message: 'Token inválido o expirado' });
        }

        res.status(200).json({
            message: 'Token válido',
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                perfil: usuario.perfil,
            }
        });
    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.status(500).json({ message: 'Error al verificar el token' });
    }
});
//whasa
const axios = require('axios'); // Para enviar la solicitud a WhatsApp

const nodemailer = require('nodemailer');

router.post('/recuperar', async (req, res) => {
    try {
        const { telefono } = req.body;

        if (!telefono) {
            return res.status(400).json({ message: 'El teléfono es obligatorio' });
        }

        // Buscar el usuario por número de teléfono
        const usuario = await Usuario.findOne({ telefono });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Generar token de recuperación (válido por 1 hora)
        const tokenRecuperacion = jwt.sign(
            { id: usuario._id, correo: usuario.correo },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Guardar el token en la base de datos
        usuario.token_recuperacion = tokenRecuperacion;
        await usuario.save();

        // Enlace para restablecer la contraseña
        const urlRecuperacion = `https://condominio-gray.vercel.app/usuario/recuperar_contra/${tokenRecuperacion}`;

        // Configurar Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Configurar el correo
        const mailOptions = {
            from: `"Soporte" <${process.env.EMAIL_USER}>`,
            to: usuario.correo, // Se usa el correo asociado al teléfono
            subject: 'Recuperación de contraseña',
            html: `
                <p>Hola ${usuario.nombre},</p>
                <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
                <a href="${urlRecuperacion}" target="_blank">Restablecer contraseña</a>
                <p>Este enlace es válido por 1 hora.</p>
                <p>Si no solicitaste este cambio, ignora este mensaje.</p>
            `,
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Token de recuperación enviado al correo registrado' });
    } catch (error) {
        console.error('Error en la recuperación:', error);
        res.status(500).json({ message: 'Error al generar token de recuperación' });
    }
});


router.post('/validar_token_recuperacion', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'El token es obligatorio' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const usuario = await Usuario.findById(decoded.id);

        if (!usuario || usuario.token_recuperacion !== token) {
            return res.status(401).json({ message: 'Token inválido o expirado' });
        }

        res.status(200).json({ message: 'Token válido', userId: usuario._id });
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
});

// Ruta para cambiar contraseña con token de recuperación
router.post('/cambiar_contra_recuperacion', async (req, res) => {
    try {
        const { token, nuevaContraseña } = req.body;

        if (!token || !nuevaContraseña) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Verificar el token
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        // Buscar al usuario por ID y validar el token de recuperación
        const usuario = await Usuario.findById(payload.id);
        if (!usuario || usuario.token_recuperacion !== token) {
            return res.status(400).json({ message: 'Token no válido' });
        }

        // Hashear la nueva contraseña
        usuario.contraseña = await bcrypt.hash(nuevaContraseña, 10);

        // Eliminar el token de recuperación después del uso
        usuario.token_recuperacion = null;

        await usuario.save();

        res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña por recuperación:', error);
        res.status(500).json({ message: 'Error al cambiar contraseña' });
    }
});


module.exports = router;
