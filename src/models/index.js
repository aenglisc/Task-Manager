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

  Object.values(models).forEach((model) => {
    if ('associate' in model) {
      model.associate(models);
    }
  });
  return models;
};
