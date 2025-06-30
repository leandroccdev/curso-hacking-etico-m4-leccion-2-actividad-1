require('dotenv').config();
const { Sequelize } = require('sequelize');

// Inicializa la conexión a MySQL
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        port: process.env.DB_PORT | 3306,
        // Habilita logging de SQL para ambiente de desarrollo
        logging: process.env.NODE_ENV === 'development' ? console.log : false
    }
);

// Testea la conexión a MySQL
sequelize.authenticate().catch(err => {
    process.stdout.write("\n[MySQL Error]: " + err.original.sqlMessage + "\n\n");
    process.exit(1);
});

module.exports = sequelize;