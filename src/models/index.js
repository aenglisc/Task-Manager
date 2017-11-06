import getUser from './User';
import getTask from './Task';
import getTag from './Tag';
import getTaskTag from './TaskTag';
import getTaskStatus from './TaskStatus';

export default (connect) => {
  const models = {
    User: getUser(connect),
    Task: getTask(connect),
    Tag: getTag(connect),
    TaskStatus: getTaskStatus(connect),
    TaskTag: getTaskTag(connect),
  };

  models.User.hasMany(models.Task, { foreignKey: 'creatorId', as: 'creator' });
  models.User.hasMany(models.Task, { foreignKey: 'assignedToId', as: 'assignedTo' });

  models.Task.belongsTo(models.User, { as: 'creator' });
  models.Task.belongsTo(models.User, { as: 'assignedTo' });
  models.Task.belongsTo(models.TaskStatus, { as: 'status' });
  models.Task.belongsToMany(models.Tag, { through: 'TaskTag' });

  models.TaskStatus.hasMany(models.Task, { foreignKey: 'statusId', as: 'status' });

  models.Tag.belongsToMany(models.Task, { through: 'TaskTag' });

  return models;
};
