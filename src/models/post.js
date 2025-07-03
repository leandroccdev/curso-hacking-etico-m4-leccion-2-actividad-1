'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Post extends Model {

        static associate(models) {
            // Pertenece a un usuario
            this.belongsTo(
                models.User,
                {
                    foreignKey: 'id',
                    as: 'user'
                }
            );
        }
    }
    Post.init({
        title: {
            allowNull: false,
            type: DataTypes.STRING(40)
        },
        body: {
            allowNull: false,
            type: DataTypes.TEXT
        },
        userId: {
            allowNull: false,
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        freezeTableName: true,
        modelName: 'Post',
        tableName: 'post'
    });
    return Post;
};