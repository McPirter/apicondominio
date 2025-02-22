const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarios');
require('dotenv').config();

module.exports = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No hay token.' });
    }

    try {
        const tokenSinBearer = token.split(' ')[1];  
        const decoded = jwt.verify(tokenSinBearer, process.env.JWT_SECRET);

        // Buscar el usuario en la base de datos
        const usuario = await Usuario.findById(decoded.id);

        if (!usuario) {
            return res.status(401).json({ message: 'Usuario no encontrado.' });
        }

        // Verificar si el token aún está en la lista de sesiones activas
        const tokenValido = usuario.tokens.some(t => t.token === tokenSinBearer);

        if (!tokenValido) {
            return res.status(401).json({ message: 'Token inválido o sesión cerrada.' });
        }

        req.usuario = usuario;  // Se pasa el usuario a la request
        req.token = tokenSinBearer; // Se almacena el token actual
        next();
    } catch (error) {
        console.error('Error en la verificación del token:', error);
        res.status(401).json({ message: 'Token inválido.' });
    }
};
