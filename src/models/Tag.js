import Sequelize from 'sequelize';

export default connect => connect.define('Tag', {
  name: {
    type: Sequelize.STRING,
    unique: true,
    validate: {
      notEmpty: {
        args: true,
        msg: 'Please enter a name for your tag',
      },
    },
  },
}, {
  freezeTableName: true,
  timestamps: false,
});
