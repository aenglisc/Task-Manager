import buildFormObj from '../lib/formObjectBuilder';

export default (router, { logger, User }) => {
  router
    .get('users#index', '/users', async (ctx) => {
      logger('Loading the users index page...');
      const users = await User.findAll();
      ctx.render('users/index', { users });
    })

    .get('users#new', '/users/new', (ctx) => {
      logger('Loading the sign up page...');
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })

    .get('users#show', '/users/:id', async (ctx) => {
      logger(`Loading user ${ctx.params.id} profile...`);
      const user = await User.findById(ctx.params.id);
      if (user) {
        ctx.render('users/show', { user });
      } else {
        logger(`Unable to find user ${ctx.params.id}`);
        ctx.throw(404);
      }
    })

    .get('users#edit', '/users/:id/edit', async (ctx) => {
      logger('Loading the profile editor...');
      if (ctx.state.id && Number(ctx.state.id) === Number(ctx.params.id)) {
        logger('User is authorised, moving on');
        const user = await User.findById(ctx.params.id);
        ctx.render('users/edit', { user, f: buildFormObj(user) });
      } else {
        logger('User is not authorised');
        ctx.flash.set({
          type: 'danger',
          text: 'A profile can only be edited by its owner',
        });
        logger('Redirecting to user profile...');
        ctx.redirect(router.url('users#show', ctx.params.id));
      }
    })

    .post('users#create', '/users', async (ctx) => {
      logger('Signing up...');
      const { form } = ctx.request.body;
      logger('Form data:', form);
      const user = await User.build(form);
      try {
        await user.save();
        logger('Success!');
        ctx.flash.set({
          type: 'success',
          text: `${form.firstName} ${form.lastName} has been created`,
        });
        logger('Redirecting to user profile');
        ctx.redirect(router.url('users#show', user.dataValues.id));
      } catch (err) {
        logger('Error encountered', err);
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
      logger('Editing user info...');
      if (ctx.state.id === ctx.params.id) {
        logger('User is authorised, moving on');
        const { form } = ctx.request.body;
        logger('Form data:', form);
        const user = await User.findById(ctx.params.id);
        const { firstName, lastName } = user;
        try {
          await user.update(form, { where: { id: ctx.params.id } });
          logger('Success');
          ctx.state.flash = {
            get: () => ({
              type: 'success',
              text: 'User info has been successfully edited',
            }),
          };
          ctx.render('users/edit', { user, f: buildFormObj(user) });
        } catch (err) {
          logger('Error encountered', err);
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
        logger('User is not authorised');
        ctx.flash.set({
          type: 'danger',
          text: 'A profile can only be edited by its owner',
        });
        logger('Redirecting to user profile...');
        ctx.redirect(router.url('users#show', ctx.params.id));
      }
    })

    .delete('users#destroy', '/users/:id', async (ctx) => {
      logger(`Deleting user ${ctx.params.id}...`);

      if (ctx.state.id && Number(ctx.state.id) === Number(ctx.params.id)) {
        logger('User is authorised, moving on');
        const { firstName, lastName } = await User.findById(ctx.params.id);
        await User.destroy({
          where: {
            id: ctx.params.id,
          },
        });
        logger('Success!');
        ctx.session = {};
        ctx.flash.set({
          type: 'success',
          text: `${firstName} ${lastName}'s profile has been deleted`,
        });
        logger('Redirecting to the homepage...');
        ctx.redirect(router.url('home'));
      } else {
        logger('User is not authorised');
        ctx.flash.set({
          type: 'danger',
          text: 'A profile can only be deleted by its owner',
        });
        logger('Redirecting to user profile');
        ctx.redirect(router.url('users#show', ctx.params.id));
      }
    });
};
