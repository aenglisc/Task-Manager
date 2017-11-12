export default (router, Item, msg = 'Not found') => async (ctx, next) => {
  const instance = await Item.findById(ctx.params.id);
  if (!instance) {
    ctx.flash.set({ type: 'danger', text: msg, now: true });
    ctx.throw(404);
  }
  await next();
};
