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
      eventDieKey = "yellow-progress";
      break;
    }
    case 1: {
      eventDieKey = "blue-progress";
      break;
    }
    case 2: {
      eventDieKey = "green-progress";
      break;
    }
    default: {
      eventDieKey = "barbarians";
      break;
    }
  }
  const diceRoll = { redDie: redDie + 1, yellowDie: yellowDie + 1, eventDie: eventDieKey };

  const turn = clock.state().turn;
  const name = clock.state().clocks?.[clock.state().running ?? clock.state().paused]?.name;
  const currentDice = dice.state()?.[turn];
  dice.publish(
    {
      ...dice.state(),
      [turn]: {
        ...currentDice,
        name: currentDice?.name ?? name,
        rolls: [
          ...(currentDice?.rolls?.map((roll) => ({ ...roll, active: false })) ?? []),
          {
            ...diceRoll,
            active: turn > 0,
          },
        ],
      },
    },
    dice.version(),
    [{ key: clock.key, version: clock.version() }]
  );
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

const getEventDieIcon = (key) => {
  switch (key) {
    case "yellow-progress": {
      return "castle-yellow.svg";
    }
    case "blue-progress": {
      return "castle-blue.svg";
    }
    case "green-progress": {
      return "castle-green.svg";
    }
    case "barbarians": {
      return "ship.svg";
    }
  }
};

const updateDiceSection = (diceState, clockState) => {
  const diceEls = [];

  if (clockState?.running != null) {
    diceEls.push(template("dice-button"));
  }

  let diceRoll;
  let diceRollTurn;
  for (let i = clockState?.turn; i >= 0; i--) {
    const rolls = diceState?.[i]?.rolls;
    if (rolls?.length) {
      diceRoll = rolls[rolls.length - 1];
      diceRollTurn = i;
      break;
    }
  }
  if (diceRoll) {
    const faded = diceRollTurn !== clockState.turn;
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
        children: [
          createNumberedDie(diceRoll.redDie, "red-die"),
          createNumberedDie(diceRoll.yellowDie, "yellow-die"),
          createElement("img", { class: "event-die", attributes: { src: getEventDieIcon(diceRoll.eventDie) } }),
        ],
      })
    );
  }

  const diceSection = diceEls.length > 0 ? createElement("div", { class: "dice-section", children: diceEls }) : null;

  element("game").replaceChildren(...[element("clock-state"), diceSection].filter((e) => e));
};

dice.subscribe((diceState) => updateDiceSection(diceState, clock.state()));

clock.subscribe((clockState) => updateDiceSection(dice.state(), clockState));
