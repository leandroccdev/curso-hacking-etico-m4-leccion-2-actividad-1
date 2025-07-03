'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // Tiene muchas sesiones
            this.hasMany(
                models.Session,
                {
                    foreignKey: 'userId',
                    as: 'session'
                }
            );
            // Tiene muchos posts
            this.hasMany(
                models.Post,
                {
                    foreignKey: 'userId',
                    as: 'post'
                }
            );
        }
    }
    User.init({
        name: {
            allowNull: false,
            type: DataTypes.STRING(40)
        },
        password: {
            allowNull: false,
            type: DataTypes.STRING(60)
        },
        isAdmin: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        }
    }, {
        sequelize,
        freezeTableName: true,
        modelName: 'User',
        tableName: 'user',
        underscored: false
    });
    return User;
};