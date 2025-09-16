export const logger = {
  info(message: string, meta?: unknown) {
    if (meta) {
      // eslint-disable-next-line no-console
      console.log(message, meta);
    } else {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  },
  error(message: string, meta?: unknown) {
    if (meta) {
      // eslint-disable-next-line no-console
      console.error(message, meta);
    } else {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  },
  warn(message: string, meta?: unknown) {
    if (meta) {
      // eslint-disable-next-line no-console
      console.warn(message, meta);
    } else {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  },
  debug(message: string, meta?: unknown) {
    if (meta) {
      // eslint-disable-next-line no-console
      console.debug(message, meta);
    } else {
      // eslint-disable-next-line no-console
      console.debug(message);
    }
  },
};


