import Sequelize from 'sequelize';
import encrypt from '../lib/encrypt';

export default (connect) => {
  const User = connect.define('User', {
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: 'Please enter your first name',
        },
      },
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: 'Please enter your last name',
        },
      },
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'A user with this e-mail already exists',
      },
      validate: {
        isEmail: {
          args: true,
          msg: 'Invalid e-mail format',
        },
      },
    },
    passwordDigest: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    password: {
      type: Sequelize.VIRTUAL,
      set: function set(value) {
        this.setDataValue('passwordDigest', encrypt(value));
        this.setDataValue('password', value);
        return value;
      },
      allowNull: false,
      validate: {
        len: {
          args: [3, +Infinity],
          msg: 'Your password should be at least 3 symbols long',
        },
      },
    },
  }, {
    freezeTableName: true,
    getterMethods: {
      fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
    },
  });
  User.associate = (models) => {
    User.hasMany(models.Task, { foreignKey: 'creatorId', as: 'creator' });
    User.hasMany(models.Task, { foreignKey: 'assignedToId', as: 'assignedTo' });
  };
  return User;
};
