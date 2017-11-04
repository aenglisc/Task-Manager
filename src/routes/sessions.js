import buildFormObj from '../lib/formObjectBuilder';
import encrypt from '../lib/encrypt';
import log from '../lib/logger';

export default (router, { User }) => {
  router
    .get('sessions-new', '/sessions/new', async (ctx) => {
      log('GET /sessions/new || Sign in page');
      await ctx.render('sessions/new', { f: buildFormObj({}) });
    })

    .post('sessions-start', '/sessions', async (ctx) => {
      log('POST /sessions || Signing in...');
      const { email, password } = ctx.request.body.form;
      const user = await User.findOne({
        where: {
          email,
        },
      });
      if (user && user.passwordDigest === encrypt(password)) {
        log('POST /sessions || Signed in');
        ctx.flash.set({
          type: 'success',
          text: 'You have successfully signed in',
        });
        ctx.session.id = user.id;
        ctx.session.email = user.email;
        ctx.redirect(router.url('home'));
      } else {
        log('POST /sessions || Unable to sign in');
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

    .delete('sessions-stop', '/sessions', (ctx) => {
      log('DELETE /sessions || Signing out');
      ctx.session = {};
      ctx.flash.set({
        type: 'success',
        text: 'You have successfully signed out',
      });
      ctx.redirect(router.url('home'));
    });
};
