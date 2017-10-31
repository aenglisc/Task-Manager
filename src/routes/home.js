export default (router) => {
  router.get('root', '/', (ctx) => {
    // ctx.body = 'Hello World';
    ctx.render('home/index');
  });
};
