const clock = message("clock");

let connected = false;

sleep(250).then(() => {
  if (!connected) {
    element("connecting").classList.remove("hidden");
  }
});

initMessages().then(() => {
  connected = true;
  element("connecting").classList.add("hidden");

  renderLoop(clock.state, clock.version, clock.publish);

  if (clock.state()) {
    element("game").classList.remove("hidden");
  } else {
    openEditMenu(clock.version(), (createClockMenu) => {
      element("cancel-create-clock", createClockMenu).remove();
    });
    const subscription = clock.subscribe((clockState) => {
      if (clockState) {
        closeEditMenu(clock.version());
        subscription.unsubscribe();
      }
    });
  }
});
