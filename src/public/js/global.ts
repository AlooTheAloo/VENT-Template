window.addEventListener("error", _e => {
  const e = _e.error;

  /**@type {string} */
  let text = "An error occured: ";

  if (e instanceof Error) {
    text += e.message;
    /**@type {Error} */
    let cur = e.cause;
    while (cur) {
      text += "\n\nCaused by: \n";
      //@ts-ignore
      // noinspection SuspiciousTypeOfGuard
      text += e instanceof Error ? cur.message : String(cur);
      cur = e.cause;
    }
  } else {
    text += e;
  }
  alert(text);

  console.error(text, e);
});
