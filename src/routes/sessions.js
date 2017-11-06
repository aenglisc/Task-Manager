import buildFormObj from '../lib/formObjectBuilder';
import encrypt from '../lib/encrypt';

export default (router, { logger, User }) => {
  router
    .get('sessions#new', '/sessions/new', async (ctx) => {
      logger('Rendering the sign in page...');
      await ctx.render('sessions/new', { f: buildFormObj({}) });
      logger('Rendered!');
    })

    .post('sessions#create', '/sessions', async (ctx) => {
      logger('Signing in...');
      const { email, password } = ctx.request.body.form;
      const user = await User.findOne({
        where: {
          email,
        },
      });
      if (user && user.passwordDigest === encrypt(password)) {
        logger('Success!');
        ctx.flash.set({
          type: 'success',
          text: 'You have successfully signed in',
        });
        ctx.session.id = user.id;
        ctx.session.email = user.email;
        logger('Redirecting to the homepage...');
        ctx.redirect(router.url('home'));
      } else {
        logger('Unable to sign in');
        ctx.state.flash = {
          get: () => ({
            type: 'danger',
            text: 'Unable to sign in, please check your credentials',
          }),
        };
        ctx.render('sessions/new', { f: buildFormObj({ email }) });
        ctx.response.status = 422;
      }
    })

    .delete('sessions#destroy', '/sessions', (ctx) => {
      logger('Logging out...');
      ctx.session = {};
      ctx.flash.set({
        type: 'success',
        text: 'You have successfully signed out',
      });
      logger('Redirecting to the homepage...');
      ctx.redirect(router.url('home'));
    });
};
