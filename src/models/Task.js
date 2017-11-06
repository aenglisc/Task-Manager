import Sequelize from 'sequelize';

export default (connect) => {
  const Task = connect.define('Task', {
    name: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {
          args: true,
          msg: 'Please enter a name for the task',
        },
      },
    },
    description: {
      type: Sequelize.TEXT,
    },
    statusId: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      validate: {
        notEmpty: {
          args: true,
          msg: 'Please choose a status',
        },
      },
    },
    creatorId: {
      type: Sequelize.INTEGER,
      validate: {
        notEmpty: true,
      },
    },
    assignedToId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: 'Please choose an assignee',
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
  Task.associate = (models) => {
    Task.belongsTo(models.TaskStatus, { foreignKey: 'status' });
    Task.belongsTo(models.User, { as: 'assignedTo' });
    Task.belongsTo(models.User, { as: 'creator' });
    Task.belongsToMany(models.Tag, { through: 'TaskTag' });
  };
  return Task;
};
