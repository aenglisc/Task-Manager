export default (router, {
  auth,
  exists,
  buildFormObj,
  logger,
  User,
}) => {
  const authorise = action => auth(
    router,
    'users#show',
    `A profile can only be ${action} by its owner`,
    User,
  );

  const userExists = exists(
    router,
    User,
    'User was not found',
  );

  router
    .get('users#index', '/users', async (ctx) => {
      const users = await User.findAll();
      ctx.render('users/index', { users });
    })

    .get('users#new', '/users/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })

    .get('users#show', '/users/:id', userExists, async (ctx) => {
      const user = await User.findById(ctx.params.id);
      ctx.render('users/show', { user });
    })

    .post('users#create', '/users', async (ctx) => {
      const { form } = ctx.request.body;
      const user = await User.build(form);
      try {
        await user.save();
        ctx.flash.set({ type: 'success', text: `${user.fullName} has been created` });
        ctx.redirect(router.url('users#show', user.dataValues.id));
      } catch (err) {
        logger('Error encountered', err);
        const notUniqueMessage = err.errors
          .filter(e => e.type === 'unique violation')
          .map(e => e.message);
        ctx.flash.set({ type: 'danger', text: notUniqueMessage || 'Unable to sign up', now: true });
        ctx.response.status = 422;
        ctx.render('users/new', { f: buildFormObj(user, err) });
      }
    })

    .get('users#edit', '/users/:id/edit', userExists, authorise('edited'), async (ctx) => {
      const user = await User.findById(ctx.params.id);
      ctx.render('users/edit', { user, f: buildFormObj(user) });
    })

    .patch('users#update', '/users/:id', userExists, authorise('edited'), async (ctx) => {
      const { form } = ctx.request.body;
      const user = await User.findById(ctx.params.id);
      const { firstName, lastName } = user;
      try {
        await user.update(form, { where: { id: ctx.params.id } });
        ctx.flash.set({ type: 'success', text: 'User info has been updated', now: true });
        ctx.render('users/edit', { user, f: buildFormObj(user) });
      } catch (err) {
        logger('Error encountered', err);
        ctx.flash.set({ type: 'danger', text: 'Unable to sign up', now: true });
        ctx.response.status = 422;
        ctx.render('users/edit', { firstName, lastName, f: buildFormObj(user, err) });
      }
    })

    .delete('users#destroy', '/users/:id', userExists, authorise('deleted'), async (ctx) => {
      const user = await User.findById(ctx.params.id);
      await User.destroy({ where: { id: ctx.params.id } });
      ctx.session = {};
      ctx.flash.set({ type: 'success', text: `${user.fullName}'s profile has been deleted` });
      ctx.redirect(router.url('home'));
    });
};
