export default (
  router,
  redirect,
  msg,
  Item,
) => async (ctx, next) => {
  const signedIn = ctx.state.isSignedIn();
  if (Item) {
    const item = await Item.findById(ctx.params.id);
    if (signedIn && ctx.state.id === Number(item.creatorId ? item.creatorId : item.id)) {
      await next();
      return;
    }
  } else if (signedIn) {
    await next();
    return;
  }
  ctx.flash.set({ type: 'danger', text: msg });
  ctx.response.status = 403;
  if (ctx.params.id) {
    ctx.redirect(router.url(redirect, ctx.params.id));
  } else {
    ctx.redirect(router.url(redirect));
  }
};
