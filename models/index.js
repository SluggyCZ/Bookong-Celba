const sequelize = require('./database');
const User = require('./User');
const Warehouse = require('./Warehouse');
const Book = require('./Book');

// Define relationships after all models are loaded
Book.belongsTo(Warehouse, {
  foreignKey: 'warehouseId',
  as: 'warehouse',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Warehouse.hasMany(Book, {
  foreignKey: 'warehouseId',
  as: 'books'
});

module.exports = {
  sequelize,
  User,
  Warehouse,
  Book
};
