import buildFormObj from '../lib/formObjectBuilder';

export default (router, { logger, User }) => {
  router
    .get('users#index', '/users', async (ctx) => {
      logger('GET /users || All users page');
      const users = await User.findAll();
      ctx.render('users/index', { users });
    })

    .get('users#new', '/users/new', (ctx) => {
      logger('GET /users/new || Sign up page');
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })

    .get('users#show', '/users/:id', async (ctx) => {
      logger(`GET /users/${ctx.params.id} || Show user page`);
      const user = await User.findById(ctx.params.id);
      if (user) {
        ctx.render('users/show', { user });
      } else {
        logger(`GET /users/${ctx.params.id} || Unable to find user`);
        ctx.throw(404);
      }
    })

    .get('users#edit', '/users/:id/edit', async (ctx) => {
      logger(`GET /users/${ctx.params.id}/edit || Edit user page`);
      if (ctx.state.id && Number(ctx.state.id) === Number(ctx.params.id)) {
        const user = await User.findById(ctx.params.id);
        ctx.render('users/edit', { user, f: buildFormObj(user) });
      } else {
        ctx.flash.set({
          type: 'danger',
          text: 'A profile can only be edited by its owner',
        });
        ctx.redirect(router.url('users#show', ctx.params.id));
      }
    })

    .post('users#create', '/users', async (ctx) => {
      logger('POST /users || User creation');
      const { form } = ctx.request.body;
      const user = await User.build(form);
      try {
        await user.save();
        logger('POST /users || A user has been created');
        ctx.flash.set({
          type: 'success',
          text: `${form.firstName} ${form.lastName} has been created`,
        });
        ctx.redirect(router.url('users#show', user.dataValues.id));
      } catch (err) {
        logger('POST /users || Error encountered', err);
        ctx.state.flash = {
          get: () => ({
            type: 'danger',
            text: 'Unable to sign up',
          }),
        };
        ctx.render('users/new', { f: buildFormObj(user, err) });
        ctx.response.status = 422;
      }
    })

    .patch('users#update', '/users/:id', async (ctx) => {
      logger('PATCH /users || Editing user info');
      if (ctx.state.id === ctx.params.id) {
        const { form } = ctx.request.body;
        const user = await User.findById(ctx.params.id);
        const { firstName, lastName } = user;
        try {
          await user.update(form, { where: { id: ctx.params.id } });
          logger('PATCH /users || User info has been successfully edited');
          ctx.state.flash = {
            get: () => ({
              type: 'success',
              text: 'User info has been successfully edited',
            }),
          };
          ctx.render('users/edit', { user, f: buildFormObj(user) });
        } catch (err) {
          logger('PATCH /users || Error encountered', err);
          ctx.state.flash = {
            get: () => ({
              type: 'danger',
              text: 'Unable to edit user info',
            }),
          };
          ctx.render('users/edit', { firstName, lastName, f: buildFormObj(user, err) });
          ctx.response.status = 422;
        }
      } else {
        ctx.flash.set({
          type: 'danger',
          text: 'A profile can only be edited by its owner',
        });
        ctx.redirect(router.url('users#show', ctx.params.id));
      }
    })

    .delete('users#destroy', '/users/:id', async (ctx) => {
      logger('DELETE /users || Delete user');

      if (ctx.state.id && Number(ctx.state.id) === Number(ctx.params.id)) {
        const { firstName, lastName } = await User.findById(ctx.params.id);
        await User.destroy({
          where: {
            id: ctx.params.id,
          },
        });
        logger('DELETE /users || User has been deleted');
        ctx.session = {};
        ctx.flash.set({
          type: 'success',
          text: `${firstName} ${lastName}'s profile has been deleted`,
        });
        ctx.redirect(router.url('home'));
      } else {
        ctx.flash.set({
          type: 'danger',
          text: 'A profile can only be deleted by its owner',
        });
        ctx.redirect(router.url('users#show', ctx.params.id));
      }
    });
};
