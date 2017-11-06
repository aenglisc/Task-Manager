import buildFormObj from '../lib/formObjectBuilder';

const getTags = rawTagsData =>
  rawTagsData.split(',')
    .map(tagName => tagName.trim())
    .filter(tagName => tagName.length > 0);

export default (router, {
  logger,
  Tag,
  TaskStatus,
  Task,
  User,
}) => {
  router
    .get('tasks#index', '/tasks', async (ctx) => {
      logger('GET /tasks || All tasks page');

      // const { query } = ctx.request;
      const tasks = await Task.findAll({
        include: [
          { model: User, as: 'assignedTo' },
          { model: User, as: 'creator' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });

      logger(tasks);
      ctx.render('tasks/index', { tasks });
    })

    .get('tasks#new', '/tasks/new', async (ctx) => {
      logger('GET /tasks/new || New task page');
      if (ctx.state.id) {
        const task = Task.build();
        const users = await User.findAll();
        ctx.render('tasks/new', { users, f: buildFormObj(task) });
      } else {
        ctx.flash.set({
          type: 'danger',
          text: 'Only authorised users can create tasks',
        });
        ctx.redirect(router.url('tasks#show'));
      }
    })

    .post('tasks#create', '/tasks', async (ctx) => {
      logger('POST /tasks || Create new task');
      if (ctx.state.id) {
        const { form } = ctx.request.body;
        form.creatorId = ctx.state.id;

        const tags = await getTags(form.tags);
        const task = await Task.build(form);
        const users = await User.findAll();

        try {
          if (tags.length > 0) {
            Promise.all(tags.map(async (tagName) => {
              const tag = await Tag.findOne({ where: { name: tagName } });
              if (tag) {
                await task.addTags(tag);
              } else {
                const addTag = await Tag.create({ name: tagName });
                await task.addTags(addTag);
              }
            }));
          }
          await task.save();
          ctx.flash.set({
            type: 'success',
            text: `${form.name} has been created`,
          });
          logger('POST /tasks || A task has been created');
          ctx.redirect(router.url('tasks#show', task.dataValues.id));
        } catch (err) {
          logger('POST /tasks || Error encountered', err);
          ctx.state.flash = {
            get: () => ({
              type: 'danger',
              text: 'Unable to create task',
            }),
          };
          form.id = ctx.params.id;
          form.assignedTo = { id: form.assignedToId };
          ctx.render('tasks/new', { users, f: buildFormObj(form, err) });
          ctx.response.status = 422;
        }
      } else {
        ctx.flash.set({
          type: 'danger',
          text: 'Only authorised users can create tasks',
        });
        ctx.redirect(router.url('tasks#show', ctx.params.id));
      }
    })

    .get('tasks#show', '/tasks/:id', async (ctx) => {
      logger(`GET /tasks/${ctx.params.id} || Show task page`);
      const task = await Task.findById(ctx.params.id, {
        include: [
          { model: User, as: 'assignedTo' },
          { model: User, as: 'creator' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      ctx.render('tasks/show', { task });
    })

    .get('tasks#edit', '/tasks/:id/edit', async (ctx) => {
      logger(`GET /tasks/${ctx.params.id}/edit || Edit task page`);
      const users = await User.findAll();
      const statuses = await TaskStatus.findAll();
      const task = await Task.findById(ctx.params.id, {
        include: [
          { model: User, as: 'assignedTo' },
          { model: User, as: 'creator' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      task.tags = task.Tags.map(item => item.name).join(', ');
      logger(task.tags);
      if (ctx.state.id && Number(ctx.state.id) === Number(task.creator.id)) {
        ctx.render('tasks/edit', {
          name: task.name,
          users,
          statuses,
          f: buildFormObj(task),
        });
      } else {
        ctx.flash.set({
          type: 'danger',
          text: 'Tasks can only be edited by their creators',
        });
        ctx.redirect(router.url('tasks#show', ctx.params.id));
      }
    })

    .patch('tasks#update', '/tasks/:id', async (ctx) => {
      logger('tasks PATCH');
      const { form } = ctx.request.body;
      logger('tasks PATCH form:', form);
      const task = await Task.findById(ctx.params.id, {
        include: [
          { model: User, as: 'assignedTo' },
          { model: User, as: 'creator' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      const { name } = task;
      const tags = await getTags(form.tags);
      await task.setTags([]);
      try {
        if (tags.length > 0) {
          Promise.all(tags.map(async (tagName) => {
            const tag = await Tag.findOne({ where: { name: tagName } });
            if (tag) {
              await task.addTags(tag);
            } else {
              const addTag = await Tag.create({ name: tagName });
              await task.addTags(addTag);
            }
          }));
        }
        await task.update(form, { where: { id: ctx.params.id } });
        ctx.flash.set({ type: 'success', text: 'The task has been updated' });
        ctx.redirect(router.url('tasks#edit', ctx.params.id));
      } catch (e) {
        const users = await User.findAll();
        const statuses = await TaskStatus.findAll();
        form.id = ctx.params.id;
        form.status = { id: form.statusId };
        form.assignedTo = { id: form.assignedToId };
        ctx.state.flash = {
          get: () => ({
            type: 'danger',
            text: 'Unable to edit the task',
          }),
        };
        ctx.render('tasks/edit', {
          name,
          users,
          statuses,
          f: buildFormObj(form, e),
        });
        ctx.response.status = 422;
      }
    })

    .delete('tasks#destroy', '/tasks/:id', async (ctx) => {
      logger('DELETE /tasks || Delete task');
      const { name, creator } = await Task.findById(ctx.params.id, {
        include: [{ model: User, as: 'creator' }],
      });
      if (ctx.state.id && Number(ctx.state.id) === Number(creator.id)) {
        await Task.destroy({
          where: {
            id: ctx.params.id,
          },
        });
        logger('DELETE /users || User has been deleted');
        ctx.flash.set({
          type: 'success',
          text: `${name} has been deleted`,
        });
        ctx.redirect(router.url('tasks#index'));
      } else {
        ctx.flash.set({
          type: 'danger',
          text: 'A task can only be deleted by its creator',
        });
        ctx.redirect(router.url('tasks#show', ctx.params.id));
      }
    });
};
