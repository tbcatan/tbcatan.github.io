const openEditMenu = (modifyEditMenu) => {
  const createClockMenu = template("create-clock");
  modifyEditMenu?.(createClockMenu);
  element("game").classList.add("hidden");
  element("edit").replaceChildren(createClockMenu);
};

const closeEditMenu = () => {
  element("edit").replaceChildren();
  element("game").classList.remove("hidden");
};

const getNewClockState = (playerString, timeMinutes, incrementSeconds) => {
  const players = playerString
    .split(/[\n,;]/)
    .map((name) => name.trim())
    .filter((name) => name)
    .map((name) => name.replace(/\s+/g, " "));
  if (players.length === 0) {
    return;
  }

  timeMinutes = timeMinutes.trim();
  if (!/^\d{1,10}$/.test(timeMinutes)) {
    return;
  }
  const timeMilliseconds = Number(timeMinutes) * 60 * 1000;

  incrementSeconds = incrementSeconds.trim();
  if (!/^\d{0,10}$/.test(incrementSeconds)) {
    return;
  }
  const incrementMilliseconds = Number(incrementSeconds) * 1000;

  return {
    timestamp: Date.now(),
    initialTime: timeMilliseconds,
    increment: incrementMilliseconds,
    clocks: players.map((name) => ({ name, time: timeMilliseconds })),
    turn: 0,
  };
};

const createNewClock = (publishClockState) => {
  const newClockState = getNewClockState(
    element("player-input").innerText,
    element("time-input").value,
    element("increment-input").value
  );
  if (!newClockState) {
    return Promise.reject();
  }
  return publishClockState(newClockState).then(closeEditMenu);
};
