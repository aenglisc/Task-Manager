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
      logger('Loading tasks index page...');

      logger('Request', ctx.request.query);
      const { query } = ctx.request;
      const users = await User.findAll();
      const tags = await Tag.findAll();
      const statuses = await TaskStatus.findAll();

      const predicate = Object.keys(query).length === 0;

      const tasks = await Task.findAll({
        include: [
          predicate || query.assignedToId === '' ?
            { model: User, as: 'assignedTo' } :
            { model: User, as: 'assignedTo', where: { id: query.assignedToId } },
          predicate || query.creatorId === '' ?
            { model: User, as: 'creator' } :
            { model: User, as: 'creator', where: { id: query.creatorId } },
          predicate || query.statusId === '' ?
            { model: TaskStatus, as: 'status' } :
            { model: TaskStatus, as: 'status', where: { id: query.statusId } },
          predicate || query.tag === '' ?
            { model: Tag } :
            { model: Tag, where: { id: query.tag } },
        ],
      });
      await ctx.render('tasks/index', {
        statuses,
        tags,
        users,
        tasks,
        query,
      });
      logger('Tasks page index rendered!');
    })

    .get('tasks#new', '/tasks/new', async (ctx) => {
      logger('Loading task creation page...');
      if (ctx.state.id) {
        logger('User is authorised, moving on');
        const task = Task.build();
        const users = await User.findAll();
        ctx.render('tasks/new', { users, f: buildFormObj(task) });
        logger('Task creation page rendered!');
      } else {
        logger('Unable to load the task creation page');
        ctx.flash.set({
          type: 'danger',
          text: 'Only authorised users can create tasks',
        });
        logger('Redirecting to task page index...');
        ctx.redirect(router.url('tasks#index'));
      }
    })

    .post('tasks#create', '/tasks', async (ctx) => {
      logger('Creating new task...');
      if (ctx.state.id) {
        logger('User is authorised, moving on');
        const { form } = ctx.request.body;
        logger('Form data:', form);
        form.creatorId = ctx.state.id;

        const tags = await getTags(form.tags);
        const task = await Task.build(form);
        const users = await User.findAll();

        try {
          logger('Processing tags...');
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
          logger('Tags processed');
          await task.save();
          logger('Task saved');
          ctx.flash.set({
            type: 'success',
            text: `${form.name} has been created`,
          });
          logger('Redirecting to task viewer...');
          ctx.redirect(router.url('tasks#show', task.dataValues.id));
        } catch (err) {
          logger('Unable to create the task:', err);
          ctx.state.flash = {
            get: () => ({
              type: 'danger',
              text: 'Unable to create the task',
            }),
          };
          form.id = ctx.params.id;
          form.assignedTo = { id: form.assignedToId };
          ctx.render('tasks/new', { users, f: buildFormObj(form, err) });
          ctx.response.status = 422;
        }
      } else {
        logger('User is not authorised');
        ctx.flash.set({
          type: 'danger',
          text: 'Only authorised users can create tasks',
        });
        logger('Redirecting to task viewer...');
        ctx.redirect(router.url('tasks#show', ctx.params.id));
      }
    })

    .get('tasks#show', '/tasks/:id', async (ctx) => {
      logger('Loading the task viewer page...');
      const task = await Task.findById(ctx.params.id, {
        include: [
          { model: User, as: 'assignedTo' },
          { model: User, as: 'creator' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      ctx.render('tasks/show', { task });
      logger('Task viewer page rendered!');
    })

    .get('tasks#edit', '/tasks/:id/edit', async (ctx) => {
      logger('Loading the task editor page...');
      const task = await Task.findById(ctx.params.id, {
        include: [
          { model: User, as: 'assignedTo' },
          { model: User, as: 'creator' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      if (ctx.state.id && Number(ctx.state.id) === Number(task.creator.id)) {
        logger('User is authorised, moving on');
        const users = await User.findAll();
        const statuses = await TaskStatus.findAll();
        task.tags = task.Tags.map(item => item.name).join(', ');
        ctx.render('tasks/edit', {
          name: task.name,
          users,
          statuses,
          f: buildFormObj(task),
        });
        logger('Success!');
      } else {
        logger('User is not authorised');
        ctx.flash.set({
          type: 'danger',
          text: 'Tasks can only be edited by their creators',
        });
        logger('Redirecting to task viewer...');
        ctx.redirect(router.url('tasks#show', ctx.params.id));
      }
    })

    .patch('tasks#update', '/tasks/:id', async (ctx) => {
      logger(`Updating task ${ctx.params.id}`);
      const { form } = ctx.request.body;
      logger('Form data:', form);
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
        logger('Processing tags...');
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
        logger('Tags proccessed');
        await task.update(form, { where: { id: ctx.params.id } });
        logger('Success!');
        ctx.flash.set({ type: 'success', text: 'The task has been updated' });
        ctx.redirect(router.url('tasks#edit', ctx.params.id));
      } catch (err) {
        logger('Unable to edit the task:', err);
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
          f: buildFormObj(form, err),
        });
        ctx.response.status = 422;
      }
    })

    .delete('tasks#destroy', '/tasks/:id', async (ctx) => {
      logger(`Deleting task ${ctx.params.id}`);
      const { name, creator } = await Task.findById(ctx.params.id, {
        include: [{ model: User, as: 'creator' }],
      });
      if (ctx.state.id && Number(ctx.state.id) === Number(creator.id)) {
        logger('User is authorised, moving on');
        await Task.destroy({
          where: {
            id: ctx.params.id,
          },
        });
        logger('The task has been deleted');
        ctx.flash.set({
          type: 'success',
          text: `${name} has been deleted`,
        });
        logger('Redirecting to task page index...');
        ctx.redirect(router.url('tasks#index'));
      } else {
        logger('User is not authorised');
        ctx.flash.set({
          type: 'danger',
          text: 'A task can only be deleted by its creator',
        });
        logger('Redirecting to task viewer...');
        ctx.redirect(router.url('tasks#show', ctx.params.id));
      }
    });
};
