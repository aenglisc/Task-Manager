import buildFormObj from '../lib/formObjectBuilder';
import log from '../lib/logger';

export default (router, { User }) => {
  router
    .get('users-all', '/users', async (ctx) => {
      log('GET /users || All users page');
      const users = await User.findAll();
      ctx.render('users/all', { users });
    })

    .get('users-new', '/users/new', (ctx) => {
      log('GET /users/new || Sign up page');
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })

    .get('users-show', '/users/:id', async (ctx) => {
      log(`GET /users/${ctx.params.id} || Show user`);
      const user = await User.findById(ctx.params.id);
      ctx.render('users/show', { user });
    })

    .get('users-edit', '/users/:id/edit', async (ctx) => {
      log(`GET /users/${ctx.params.id}/edit || Edit user`);
      log(ctx.state.id === ctx.params.id);
      if (ctx.state.id && Number(ctx.state.id) === Number(ctx.params.id)) {
        const user = await User.findById(ctx.params.id);
        log(user);
        ctx.render('users/edit', { user, f: buildFormObj(user) });
      } else {
        ctx.redirect(router.url('users-show', ctx.params.id));
      }
    })

    .post('users-create', '/users', async (ctx) => {
      log('POST /users || User creation');
      const { form } = ctx.request.body;
      const user = await User.build(form);
      try {
        await user.save();
        log('POST /users || A user has been created');
        ctx.flash.set({
          type: 'success',
          text: `${form.firstName} ${form.lastName} has been created`,
        });
        ctx.redirect(router.url('users-show', user.dataValues.id));
      } catch (err) {
        log('POST /users || Error encountered', err);
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

    .patch('users-patch', '/users/:id/edit', async (ctx) => {
      log('PATCH /users || Editing user info');
      const { form } = ctx.request.body;
      const user = await User.findById(ctx.params.id);
      const { firstName, lastName } = user;
      try {
        await user.update(form, { where: { id: ctx.params.id } });
        log('PATCH /users || User info has been successfully edited');
        ctx.state.flash = {
          get: () => ({
            type: 'success',
            text: 'User info has been successfully edited',
          }),
        };
        ctx.render('users/edit', { user, f: buildFormObj(user) });
      } catch (err) {
        log('PATCH /users || Error encountered', err);
        ctx.state.flash = {
          get: () => ({
            type: 'danger',
            text: 'Unable to edit user info',
          }),
        };
        ctx.render('users/edit', { firstName, lastName, f: buildFormObj(user, err) });
        ctx.response.status = 422;
      }
    })

    .delete('users-delete', '/users/:id', async (ctx) => {
      log('DELETE /users || Delete user');
      const { firstName, lastName } = await User.findById(ctx.params.id);
      await User.destroy({
        where: {
          id: ctx.params.id,
        },
      });
      log('DELETE /users || User has been deleted');
      ctx.session = {};
      ctx.flash.set({
        type: 'success',
        text: `${firstName} ${lastName}'s profile has been deleted`,
      });
      ctx.redirect(router.url('users-all'));
    });
};
