const dice = message("dice");

const diceRollAnimationMs = 500;

const getDiceRoll = () => {
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
  return { redDie: redDie + 1, yellowDie: yellowDie + 1, eventDie: eventDieKey };
};

const rollDice = ({ diceState, diceVersion, clockState, clockVersion }) => {
  const diceRoll = getDiceRoll();

  const turn = clockState.turn;
  const name = clockState.clocks?.[clockState.running ?? clockState.paused]?.name;
  const currentDice = diceState?.[turn];
  dice.publish(
    {
      ...diceState,
      [turn]: {
        ...currentDice,
        name: currentDice?.name ?? name,
        rolls: [
          ...(currentDice?.rolls ?? []),
          {
            ...diceRoll,
            active: turn > 0,
          },
        ],
      },
    },
    diceVersion,
    [{ key: clock.key, version: clockVersion }]
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

let lastDiceRollPosition;

const updateDiceSection = ({ diceState, diceVersion, clockState, clockVersion }) => {
  let diceRoll;
  let diceRollPosition = {};
  for (let i = clockState?.turn; i >= 0; i--) {
    const rolls = diceState?.[i]?.rolls;
    if (rolls?.length) {
      diceRoll = rolls[rolls.length - 1];
      diceRollPosition.turn = i;
      diceRollPosition.index = rolls.length - 1;
      break;
    }
  }

  const canRollDice = clockState?.running != null || clockState?.turn === 0;
  const isCurrentTurnDiceRoll = diceRoll && diceRollPosition.turn === clockState?.turn;
  const isNewDiceRoll =
    diceRoll &&
    lastDiceRollPosition != undefined &&
    !(diceRollPosition.turn === lastDiceRollPosition.turn && diceRollPosition.index === lastDiceRollPosition.index);

  const diceEls = [];
  let diceIcons;
  if (diceRoll) {
    const createNumberedDie = (number, colorClass) =>
      createElement("div", {
        class: classes("die-wrapper", isNewDiceRoll ? "dice-roll" : null),
        children: [
          createElement("i", {
            class: classes("fa-solid", getNumberedDieIcon(number), colorClass),
          }),
          createElement("div", {
            class: `${colorClass}-background`,
          }),
        ],
      });
    diceIcons = [
      createNumberedDie(diceRoll.redDie, "red-die"),
      createNumberedDie(diceRoll.yellowDie, "yellow-die"),
      createElement("img", {
        class: classes("event-die", isNewDiceRoll ? "dice-roll" : null),
        attributes: { src: getEventDieIcon(diceRoll.eventDie) },
      }),
    ];
    diceEls.push(
      createElement("div", {
        class: classes("dice", !isCurrentTurnDiceRoll ? "faded" : null),
        children: diceIcons,
      })
    );
  } else if (canRollDice) {
    diceEls.push(template("dice-button"));
  }

  const diceSection =
    diceEls.length > 0
      ? createElement("div", {
          class: classes("dice-section", canRollDice ? "clickable" : null),
          children: diceEls,
        })
      : null;

  const attachDiceRollHandler = () => {
    if (canRollDice) {
      const handleDiceRoll = () =>
        rollDice({
          diceState,
          diceVersion,
          clockState,
          clockVersion,
        });
      if (!isCurrentTurnDiceRoll || clockState?.turn === 0) {
        diceSection.addEventListener("click", handleDiceRoll);
      } else {
        diceSection.addEventListener("dblclick", handleDiceRoll);
        let touchTimeout;
        diceSection.addEventListener("touchstart", (event) => {
          event.preventDefault();
          clearTimeout(touchTimeout);
          touchTimeout = setTimeout(handleDiceRoll, 500);
        });
        diceSection.addEventListener("touchend", () => {
          clearTimeout(touchTimeout);
          touchTimeout = undefined;
        });
      }
    }
  };
  if (!isNewDiceRoll) {
    attachDiceRollHandler();
  }

  lastDiceRollPosition = diceRollPosition;
  element("game").replaceChildren(...[element("clock-state"), diceSection].filter((e) => e));
  if (isNewDiceRoll) {
    setTimeout(() => {
      diceIcons.forEach((el) => el.classList.remove("dice-roll"));
      attachDiceRollHandler();
    }, diceRollAnimationMs);
  }
};

const renderDiceSection = () => {
  dice.subscribe((diceState, diceVersion) =>
    updateDiceSection({
      diceState,
      diceVersion,
      clockState: clock.state(),
      clockVersion: clock.version(),
    })
  );

  clock.subscribe((clockState, clockVersion) =>
    updateDiceSection({
      diceState: dice.state(),
      diceVersion: dice.version(),
      clockState,
      clockVersion,
    })
  );
};
