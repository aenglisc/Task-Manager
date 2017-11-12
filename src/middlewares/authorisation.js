export default (
  router,
  redirect,
  msg,
  getItems,
) => async (ctx, next) => {
  const signedIn = ctx.state.isSignedIn();
  if (getItems) {
    const items = await getItems();
    const { id, creator } = items[ctx.params.id - 1];
    if (signedIn && ctx.state.id === Number(creator ? creator.id : id)) {
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
