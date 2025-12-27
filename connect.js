let connected = false;

sleep(250).then(() => {
  if (!connected) {
    element("connecting").classList.remove("hidden");
  }
});

initMessages().then(() => {
  connected = true;
  element("connecting").classList.add("hidden");

  renderClockSection(clock.state, clock.version, clock.publish);
  renderDiceSection();

  if (clock.state()) {
    element("game").classList.remove("hidden");
  } else {
    openEditMenu((createClockMenu) => {
      createClockMenu.querySelector("#cancel-create-clock").remove();
    });
    const subscription = clock.subscribe((clockState) => {
      if (clockState) {
        closeEditMenu();
        subscription.unsubscribe();
      }
    });
  }
});

const publishNewClock = (clockState) =>
  publishMessages([
    { key: clock.key, data: clockState },
    { key: dice.key, data: null },
  ]);
