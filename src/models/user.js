'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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