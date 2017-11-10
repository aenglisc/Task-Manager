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
      const { query } = ctx.request;
      const users = await User.findAll();
      const tags = await Tag.findAll();
      const statuses = await TaskStatus.findAll();

      const noQuery = Object.keys(query).length === 0;

      const tasks = await Task.findAll({
        include: [
          noQuery || query.assignedToId === '' ?
            { model: User, as: 'assignedTo' } :
            { model: User, as: 'assignedTo', where: { id: query.assignedToId } },
          noQuery || query.creatorId === '' ?
            { model: User, as: 'creator' } :
            { model: User, as: 'creator', where: { id: query.creatorId } },
          noQuery || query.statusId === '' ?
            { model: TaskStatus, as: 'status' } :
            { model: TaskStatus, as: 'status', where: { id: query.statusId } },
          noQuery || query.tag === '' ?
            { model: Tag } :
            { model: Tag, where: { id: query.tag } },
        ],
      });
      ctx.render('tasks/index', {
        statuses,
        tags,
        users,
        tasks,
        query,
      });
    })

    .get('tasks#new', '/tasks/new', async (ctx) => {
      if (ctx.state.id) {
        const task = Task.build();
        const users = await User.findAll();
        ctx.render('tasks/new', { users, f: buildFormObj(task) });
      } else {
        ctx.flash.set({ type: 'danger', text: 'Only authorised users can create tasks' });
        ctx.redirect(router.url('tasks#index'));
      }
    })

    .post('tasks#create', '/tasks', async (ctx) => {
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
          ctx.flash.set({ type: 'success', text: `${form.name} has been created` });
          await ctx.redirect(router.url('tasks#show', task.dataValues.id));
        } catch (err) {
          logger('Unable to create the task:', err);
          form.id = ctx.params.id;
          ctx.flash.set({ type: 'danger', text: 'Unable to create the task', now: true });
          ctx.render('tasks/new', { users, f: buildFormObj(form, err) });
          ctx.response.status = 422;
        }
      } else {
        ctx.flash.set({ type: 'danger', text: 'Only authorised users can create tasks' });
        ctx.redirect(router.url('tasks#show', ctx.params.id));
      }
    })

    .get('tasks#show', '/tasks/:id', async (ctx) => {
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
      const task = await Task.findById(ctx.params.id, {
        include: [
          { model: User, as: 'assignedTo' },
          { model: User, as: 'creator' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      if (ctx.state.id && Number(ctx.state.id) === Number(task.creator.id)) {
        const users = await User.findAll();
        const statuses = await TaskStatus.findAll();
        task.tags = task.Tags.map(item => item.name).join(', ');
        ctx.render('tasks/edit', {
          name: task.name,
          users,
          statuses,
          f: buildFormObj(task),
        });
      } else {
        ctx.flash.set({ type: 'danger', text: 'A task can only be edited by its creator' });
        ctx.redirect(router.url('tasks#show', ctx.params.id));
      }
    })

    .patch('tasks#update', '/tasks/:id', async (ctx) => {
      const { form } = ctx.request.body;
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
      } catch (err) {
        logger('Unable to edit the task:', err);
        const users = await User.findAll();
        const statuses = await TaskStatus.findAll();
        form.id = ctx.params.id;
        form.status = { id: form.statusId };
        form.assignedTo = { id: form.assignedToId };
        ctx.flash.set({ type: 'danger', text: 'Unable to edit the task', now: true });
        ctx.render('tasks/edit', {
          name,
          users,
          statuses,
          f: buildFormObj(form, err),
        });
        ctx.response.status = 422;
      }
    })

    .delete('tasks#destroy', '/tasks/:id', async (ctx) => {
      const { name, creator } = await Task.findById(ctx.params.id, {
        include: [{ model: User, as: 'creator' }],
      });
      if (ctx.state.id && Number(ctx.state.id) === Number(creator.id)) {
        await Task.destroy({ where: { id: ctx.params.id } });
        ctx.flash.set({ type: 'success', text: `${name} has been deleted` });
        ctx.redirect(router.url('tasks#index'));
      } else {
        ctx.flash.set({ type: 'danger', text: 'A task can only be deleted by its creator' });
        ctx.redirect(router.url('tasks#show', ctx.params.id));
      }
    });
};
