export default (router, {
  auth,
  buildFormObj,
  exists,
  logger,
  Tag,
  TaskStatus,
  Task,
  User,
}) => {
  const authoriseCreate = auth(
    router,
    'tasks#index',
    'A task can only be created by an authorised user',
  );

  const authoriseEdit = auth(
    router,
    'tasks#show',
    'A task can only be edited by its creator',
    Task,
  );

  const taskExists = exists(
    router,
    Task,
    'Task was not found',
  );

  const filterModel = (query, dataType, model, as) => {
    const noQuery = Object.keys(query).length === 0;
    return noQuery || query[dataType] === '' ?
      { model, as } :
      { model, as, where: { id: query[dataType] } };
  };

  const getTags = rawTagsData =>
    rawTagsData.split(',')
      .map(tagName => tagName.trim())
      .filter(tagName => tagName.length > 0);

  const getTasks = id => Task.findById(id, {
    include: [
      { model: User, as: 'assignedTo' },
      { model: User, as: 'creator' },
      { model: TaskStatus, as: 'status' },
      { model: Tag },
    ],
  });

  const updateTags = async (tags, task) => {
    if (tags.length > 0) {
      await tags.map(tag => Tag
        .findOne({ where: { name: tag } })
        .then(async result => (await result ?
          task.addTag(result) :
          task.createTag({ name: tag }))));
    }
  };

  const deleteOldTags = () => async (ctx, next) => {
    const tagsToRemove = await Tag.findAll({ include: [{ model: Task }] })
      .filter(tag => tag.Tasks.length === 0)
      .map(tag => tag.id);
    await Tag.destroy({ where: { id: tagsToRemove } });
    await next();
  };

  router
    .get('tasks#index', '/tasks', deleteOldTags(), async (ctx) => {
      const { query } = ctx.request;

      const statuses = await TaskStatus.findAll();
      const tags = await Tag.findAll({ include: [{ model: Task }] });
      const users = await User.findAll();
      const tasks = await Task.findAll({
        order: [
          ['id', 'ASC'],
        ],
        include: [
          filterModel(query, 'assignedToId', User, 'assignedTo'),
          filterModel(query, 'creatorId', User, 'creator'),
          filterModel(query, 'statusId', TaskStatus, 'status'),
          filterModel(query, 'tag', Tag),
        ],
      });

      ctx.render('tasks/index', {
        query,
        statuses,
        tags,
        tasks,
        users,
      });
    })

    .get('tasks#new', '/tasks/new', authoriseCreate, async (ctx) => {
      const task = Task.build();
      const users = await User.findAll();
      ctx.render('tasks/new', { users, f: buildFormObj(task) });
    })

    .post('tasks#create', '/tasks', authoriseCreate, async (ctx) => {
      const { form } = ctx.request.body;
      form.creatorId = ctx.state.id;

      const tags = await getTags(form.tags);
      const task = await Task.build(form);
      const users = await User.findAll();

      try {
        await updateTags(tags, task);
        await task.save();
        ctx.flash.set({ type: 'success', text: `${form.name} has been created` });
        await ctx.redirect(router.url('tasks#show', task.dataValues.id));
      } catch (err) {
        logger('Unable to create the task:', err);
        form.id = ctx.params.id;
        ctx.flash.set({ type: 'danger', text: 'Unable to create the task', now: true });
        ctx.response.status = 422;
        ctx.render('tasks/new', { users, f: buildFormObj(form, err) });
      }
    })

    .get('tasks#show', '/tasks/:id', deleteOldTags(), taskExists, async (ctx) => {
      const task = await getTasks(ctx.params.id);
      ctx.render('tasks/show', { task });
    })

    .get('tasks#edit', '/tasks/:id/edit', deleteOldTags(), taskExists, authoriseEdit, async (ctx) => {
      const task = await getTasks(ctx.params.id);
      const users = await User.findAll();
      const statuses = await TaskStatus.findAll();
      task.tags = task.Tags.map(item => item.name).join(', ');
      ctx.render('tasks/edit', {
        name: task.name,
        users,
        statuses,
        f: buildFormObj(task),
      });
    })

    .patch('tasks#update', '/tasks/:id', taskExists, authoriseEdit, async (ctx) => {
      const { form } = ctx.request.body;
      const task = await getTasks(ctx.params.id);
      const { name } = task;
      const tags = await getTags(form.tags);
      await task.setTags([]);
      try {
        await updateTags(tags, task);
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
        ctx.flash.set({ type: 'danger', text: 'Unable to update the task', now: true });
        ctx.response.status = 422;
        ctx.render('tasks/edit', {
          name,
          users,
          statuses,
          f: buildFormObj(form, err),
        });
      }
    })

    .delete('tasks#destroy', '/tasks/:id', taskExists, authoriseEdit, async (ctx) => {
      const { name } = await Task.findById(ctx.params.id, {
        include: [{ model: User, as: 'creator' }],
      });
      await Task.destroy({ where: { id: ctx.params.id } });
      await deleteOldTags();
      ctx.flash.set({ type: 'success', text: `${name} has been deleted` });
      ctx.redirect(router.url('tasks#index'));
    });
};
