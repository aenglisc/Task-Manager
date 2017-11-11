export default (opts) => {
  const key = opts && opts.key ? opts.key : 'flash';

  return (ctx, next) => {
    const prev = ctx.session[key];

    if (prev) {
      ctx.session[key] = null;
    }

    ctx.flash = Object.seal({
      get: () => prev,
      set: (data) => {
        if (data.now) {
          ctx.flash.now = data;
        } else {
          ctx.session[key] = data;
        }
      },
      now: null,
    });

    return next();
  };
};
