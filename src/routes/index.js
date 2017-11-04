import home from './home';
import users from './users';
import sessions from './sessions';

const controllers = [
  home,
  users,
  sessions,
];

export default (router, container) => controllers.forEach(f => f(router, container));
