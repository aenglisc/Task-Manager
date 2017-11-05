import Sequelize from 'sequelize';

export default connect => connect.define('TaskStatus', {
  name: {
    type: Sequelize.STRING,
    defaultValue: 'New',
    validate: {
      notEmpty: {
        args: true,
        msg: 'The task status should not be empty.',
      },
    },
  },
}, {
  timestamps: false,
});
