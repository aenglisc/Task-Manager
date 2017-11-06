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
    freezeTableName: true,
    timestamps: false,
  });
  TaskStatus.associate = (models) => {
    TaskStatus.hasMany(models.Task, { foreignKey: 'statusId', as: 'status' });
  };
  return TaskStatus;
};
