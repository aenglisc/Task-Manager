import home from './home';
import sessions from './sessions';
import tasks from './tasks';
import users from './users';

const controllers = [
  home,
  sessions,
  tasks,
  users,
];

export default (router, container) => controllers.forEach(f => f(router, container));
