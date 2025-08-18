const dice = message("dice");

const rollDice = () => {
  let roll;
  do {
    roll = crypto.getRandomValues(new Uint8Array(1))[0];
  } while (roll >= 216);
  const redDie = roll % 6;
  roll = Math.round((roll - redDie) / 6);
  const yellowDie = roll % 6;
  roll = Math.round((roll - yellowDie) / 6);
  const eventDie = roll % 6;
  let eventDieKey;
  switch (eventDie) {
    case 0: {
      eventDieKey = "yellow";
      break;
    }
    case 1: {
      eventDieKey = "blue";
      break;
    }
    case 2: {
      eventDieKey = "green";
      break;
    }
    default: {
      eventDieKey = "barbarians";
      break;
    }
  }
  const diceRoll = { redDie: redDie + 1, yellowDie: yellowDie + 1, eventDie: eventDieKey };
  // TODO: synchronize dice and clock versions
  dice.publish({
    ...dice.state(),
    [clock.state().turn]: diceRoll,
  });
};

const getNumberedDieIcon = (number) => {
  switch (number) {
    case 1: {
      return "fa-dice-one";
    }
    case 2: {
      return "fa-dice-two";
    }
    case 3: {
      return "fa-dice-three";
    }
    case 4: {
      return "fa-dice-four";
    }
    case 5: {
      return "fa-dice-five";
    }
    case 6: {
      return "fa-dice-six";
    }
  }
};

const updateDiceSection = (diceState, clockState) => {
  const diceEls = [];

  if (clockState?.running != null) {
    diceEls.push(template("dice-button"));
  }

  let diceRoll;
  for (let i = clockState?.turn; i >= 0; i--) {
    diceRoll = diceState?.[i];
    if (diceRoll) {
      break;
    }
  }
  if (diceRoll) {
    const faded = diceRoll !== diceState[clockState.turn];
    const createNumberedDie = (number, colorClass) =>
      createElement("div", {
        class: "die-wrapper",
        children: [
          createElement("i", {
            class: ["fa-solid", getNumberedDieIcon(number), colorClass].filter((s) => s).join(" "),
          }),
          createElement("div", {
            class: `${colorClass}-background`,
          }),
        ],
      });
    diceEls.push(
      createElement("div", {
        class: ["dice", faded ? "faded" : null].filter((s) => s).join(" "),
        children: [createNumberedDie(diceRoll.redDie, "red-die"), createNumberedDie(diceRoll.yellowDie, "yellow-die")],
      })
    );
  }

  const diceSection = diceEls.length > 0 ? createElement("div", { class: "dice-section", children: diceEls }) : null;

  element("game").replaceChildren(...[element("clock-state"), diceSection].filter((e) => e));
};

dice.subscribe((diceState) => updateDiceSection(diceState, clock.state()));

clock.subscribe((clockState) => updateDiceSection(dice.state(), clockState));
