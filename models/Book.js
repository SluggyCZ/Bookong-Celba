const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  isbn: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      len: [10, 17] // ISBN-10 or ISBN-13
    }
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  warehouseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Warehouses',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = Book;
