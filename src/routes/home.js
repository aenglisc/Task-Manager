export default (router, { User }) => {
  router.get('home', '/', async (ctx) => {
    const user = await User.findById(ctx.state.id);
    ctx.render('home/index', { user });
  });
};
