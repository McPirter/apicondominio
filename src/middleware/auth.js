const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
   

    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No hay token.' });
    }

    try {
        const tokenSinBearer = token.split(' ')[1];  



        const decoded = jwt.verify(tokenSinBearer, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        console.error('Error en la verificación del token:', error);  // <-- Ver el error exacto
        res.status(401).json({ message: 'Token inválido.' });
    }
};
