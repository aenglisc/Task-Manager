// import buildFormObj from '../lib/formObjectBuilder';

export default (router, {
  logger,
  User,
  // Task,
  // Tag,
  // TaskTag,
  // TaskStatus,
}) => {
  router
    .get('tasks#index', '/tasks', async (ctx) => {
      logger('GET /tasks || All tasks page');
      // const { query } = ctx.request;
      const users = await User.findAll();
      ctx.render('tasks/index', { users });
    })

    .get('tasks#new', '/tasks/new', (ctx) => {
      logger('GET /tasks/new || New task page');
      if (ctx.state.id) {
        ctx.render('tasks/new');
      } else {
        ctx.flash.set({
          type: 'danger',
          text: 'Only authorised users can create tasks',
        });
        ctx.redirect(router.url('tasks#show'));
      }
    })

    .get('tasks#show', '/tasks/:id', (ctx) => {
      logger(`GET /tasks/${ctx.params.id} || Show task page`);
      ctx.render('tasks/show');
    })

    .get('tasks#edit', '/tasks/:id/edit', (ctx) => {
      logger(`GET /tasks/${ctx.params.id}/edit || Edit task page`);
      if (ctx.state.id) {
        ctx.render('tasks/new');
      } else {
        ctx.flash.set({
          type: 'danger',
          text: 'Tasks can only be edited by their creators',
        });
        ctx.redirect(router.url('tasks#show'));
      }
    });
};
