import Sequelize from 'sequelize';

export default (connect) => {
  const TaskStatus = connect.define('TaskStatus', {
    name: {
      type: Sequelize.STRING,
      defaultValue: 'Created',
      validate: {
        notEmpty: {
          args: true,
          msg: 'The task status should not be empty.',
        },
      },
    },
  }, {
    classMethods: {
      associate: (models) => {
        TaskStatus.hasMany(models.Task, { foreignKey: 'statusId', as: 'status' });
      },
    },
    freezeTableName: true,
    timestamps: false,
  });

  return TaskStatus;
};
