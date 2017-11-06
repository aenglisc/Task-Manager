export default (router, { logger, User }) => {
  router.get('home', '/', async (ctx) => {
    logger('Rendering the home page...');
    const user = await User.findById(ctx.state.id);
    ctx.render('home/index', { user });
  });
};
