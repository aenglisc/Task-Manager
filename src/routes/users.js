export default (router, {
  auth,
  buildFormObj,
  logger,
  User,
}) => {
  const authorise = msg => auth(router, 'users#show', msg, () => User.findAll());
  router
    .get('users#index', '/users', async (ctx) => {
      const users = await User.findAll();
      ctx.render('users/index', { users });
    })

    .get('users#new', '/users/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })

    .get('users#show', '/users/:id', async (ctx) => {
      const user = await User.findById(ctx.params.id);
      if (user) {
        ctx.render('users/show', { user });
      } else {
        logger(`Unable to find user ${ctx.params.id}`);
        ctx.throw(404);
      }
    })

    .post('users#create', '/users', async (ctx) => {
      const { form } = ctx.request.body;
      logger('Form data:', form);
      const user = await User.build(form);
      try {
        await user.save();
        ctx.flash.set({ type: 'success', text: `${user.fullName} has been created` });
        ctx.redirect(router.url('users#show', user.dataValues.id));
      } catch (err) {
        logger('Error encountered', err);
        ctx.flash.set({ type: 'danger', text: 'Unable to sign up', now: true });
        ctx.render('users/new', { f: buildFormObj(user, err) });
        ctx.response.status = 422;
      }
    })

    .get('users#edit', '/users/:id/edit', authorise('A profile can only be edited by its owner'), async (ctx) => {
      const user = await User.findById(ctx.params.id);
      ctx.render('users/edit', { user, f: buildFormObj(user) });
    })

    .patch('users#update', '/users/:id', authorise('A profile can only be edited by its owner'), async (ctx) => {
      const { form } = ctx.request.body;
      const user = await User.findById(ctx.params.id);
      const { firstName, lastName } = user;
      try {
        await user.update(form, { where: { id: ctx.params.id } });
        ctx.flash.set({ type: 'success', text: 'User info has been updated', now: true });
        ctx.render('users/edit', { user, f: buildFormObj(user) });
      } catch (err) {
        logger('Error encountered', err);
        ctx.flash.set({ type: 'danger', text: 'Unable to edit user info', now: true });
        ctx.render('users/edit', { firstName, lastName, f: buildFormObj(user, err) });
        ctx.response.status = 422;
      }
    })

    .delete('users#destroy', '/users/:id', authorise('A profile can only be deleted by its owner'), async (ctx) => {
      const user = await User.findById(ctx.params.id);
      await User.destroy({ where: { id: ctx.params.id } });
      ctx.session = {};
      ctx.flash.set({ type: 'success', text: `${user.fullName}'s profile has been deleted` });
      ctx.redirect(router.url('home'));
    });
};
