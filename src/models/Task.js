import Sequelize from 'sequelize';

export default connect => connect.define('Task', {
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
    validate: {
      notEmpty: {
        args: true,
        msg: 'Please choose an assignee',
      },
    },
  },
});
