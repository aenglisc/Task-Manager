import encrypt from '../lib/encrypt';

export default (router, { buildFormObj, logger, User }) => {
  router
    .get('sessions#new', '/sessions/new', async (ctx) => {
      await ctx.render('sessions/new', { f: buildFormObj({}) });
    })

    .post('sessions#create', '/sessions', async (ctx) => {
      try {
        const { email, password } = ctx.request.body.form;
        const user = await User.findOne({ where: { email, passwordDigest: encrypt(password) } });
        ctx.session.id = user.id;
        ctx.flash.set({ type: 'success', text: 'You have successfully signed in' });
        ctx.redirect(router.url('home'));
      } catch (err) {
        logger('Unable to sign in', err);
        ctx.flash.set({ type: 'danger', text: 'Please check your credentials', now: true });
        ctx.render('sessions/new', { f: buildFormObj(ctx.request.body.form, err) });
        ctx.response.status = 422;
      }
    })

    .delete('sessions#destroy', '/sessions', (ctx) => {
      ctx.session = {};
      ctx.flash.set({ type: 'success', text: 'You have successfully signed out' });
      ctx.redirect(router.url('home'));
    });
};
