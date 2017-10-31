import home from './home';

const controllers = [
  home,
];

export default (router, container) => controllers.forEach(item => item(router, container));
