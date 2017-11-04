import log from '../lib/logger';

export default (router, { User }) => {
  router.get('home', '/', async (ctx) => {
    log('Rendering the home page');
    log(ctx.state.id);
    const user = await User.findById(ctx.state.id);
    ctx.render('home/index', { user });
  });
};
