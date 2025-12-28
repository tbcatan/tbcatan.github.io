const dice = message("dice");

const barbarianCycle = 7;

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
  const currentDice = diceState?.history?.[turn];
  const eventDieActive = diceState?.eventDieActive ?? false;
  const barbariansMove = eventDieActive && diceRoll.eventDie === "barbarians";
  dice.publish(
    {
      ...diceState,
      eventDieActive: eventDieActive,
      barbarians: {
        position: ((diceState?.barbarians?.position || barbarianCycle) - barbariansMove) % barbarianCycle,
        lastMovedTurn: barbariansMove ? turn : diceState?.barbarians?.lastMovedTurn,
      },
      history: {
        ...diceState?.history,
        [turn]: {
          ...currentDice,
          name: currentDice?.name ?? name,
          rolls: [
            ...(currentDice?.rolls ?? []),
            {
              ...diceRoll,
              active: turn > 0,
              eventDieActive: turn > 0 && eventDieActive,
            },
          ],
        },
      },
    },
    diceVersion,
    [{ key: clock.key, version: clockVersion }]
  );
};

countDownBarbarians = ({ diceState, diceVersion, clockState, clockVersion }) => {
  dice.publish(
    {
      ...diceState,
      barbarians: {
        position: ((diceState?.barbarians?.position || barbarianCycle) - 1) % barbarianCycle,
        lastMovedTurn: clockState?.turn,
      },
    },
    diceVersion,
    [{ key: clock.key, version: clockVersion }]
  );
};

const activateEventDie = ({ diceState, diceVersion, clockState, clockVersion }) => {
  const turn = clockState.turn;
  const currentDice = diceState?.history?.[turn];
  const currentRoll = currentDice?.rolls?.length ? currentDice.rolls[currentDice.rolls.length - 1] : undefined;
  const newCurrentRoll = currentRoll
    ? { ...currentRoll, eventDieActive: currentRoll.active || currentRoll.eventDieActive }
    : undefined;
  const newCurrentDice = currentDice
    ? {
        ...currentDice,
        rolls: currentDice.rolls?.map((roll, index) =>
          index === currentDice.rolls.length - 1 ? newCurrentRoll : roll
        ),
      }
    : undefined;
  const newDiceState = {
    ...diceState,
    eventDieActive: true,
    history: {
      ...diceState?.history,
    },
  };
  if (currentDice) {
    newDiceState.history[turn] = newCurrentDice;
  }
  if (newCurrentRoll?.eventDie === "barbarians" && newCurrentRoll.eventDieActive && !currentRoll.eventDieActive) {
    countDownBarbarians({ diceState: newDiceState, diceVersion, clockState, clockVersion });
  } else {
    dice.publish(newDiceState, diceVersion, [{ key: clock.key, version: clockVersion }]);
  }
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
      return "ship-white.svg";
    }
    case "barbarians-attack": {
      return "ship-red.svg";
    }
  }
};

const createNumberedDie = (number, colorClass, options) =>
  createElement("div", {
    class: classes("die-wrapper", options?.faded ? "faded" : null, options?.animateRoll ? "dice-roll" : null),
    children: [
      createElement("i", {
        class: classes("fa-solid", getNumberedDieIcon(number), colorClass),
      }),
      createElement("div", {
        class: `${colorClass}-background`,
      }),
    ],
  });

const createEventDie = (eventDie, options) =>
  createElement("img", {
    class: classes("event-die", options?.faded ? "faded" : null, options?.animateRoll ? "dice-roll" : null),
    attributes: { src: getEventDieIcon(eventDie) },
  });

let lastDiceRollPosition;
const updateDiceSection = ({ diceState, diceVersion, clockState, clockVersion }) => {
  let diceRoll;
  let diceRollPosition = {};
  for (const turn of Object.keys(diceState?.history ?? {})
    .map((turn) => Number(turn))
    .filter((turn) => !Number.isNaN(turn))
    .sort((a, b) => b - a)) {
    const rolls = diceState.history[turn]?.rolls;
    if (rolls?.length) {
      diceRoll = rolls[rolls.length - 1];
      diceRollPosition.turn = turn;
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

  const handleDiceRoll = () =>
    rollDice({
      diceState,
      diceVersion,
      clockState,
      clockVersion,
    });

  if (!diceRoll) {
    const diceSectionContents = [];
    if (canRollDice) {
      const diceButton = template("dice-button");
      diceButton.addEventListener("click", handleDiceRoll);
      diceSectionContents.push(diceButton);
    }
    lastDiceRollPosition = diceRollPosition;
    element("dice-section").replaceChildren(...diceSectionContents);
    return;
  }

  const numberedDice = [
    createNumberedDie(diceRoll.redDie, "red-die", {
      faded: !isCurrentTurnDiceRoll,
      animateRoll: isNewDiceRoll,
    }),
    createNumberedDie(diceRoll.yellowDie, "yellow-die", {
      faded: !isCurrentTurnDiceRoll,
      animateRoll: isNewDiceRoll,
    }),
  ];
  const eventDie = createEventDie(diceRoll.eventDie, {
    faded: !isCurrentTurnDiceRoll || !diceState.eventDieActive,
    animateRoll: isNewDiceRoll,
  });
  const diceIcons = [...numberedDice, eventDie];

  const diceContainer = createElement("div", {
    class: classes("dice", canRollDice ? "clickable" : null),
    children: numberedDice,
  });
  const diceSectionContents = [diceContainer];
  if (diceState.eventDieActive) {
    diceContainer.append(eventDie);
  } else if (clockState?.turn > 0) {
    const activateEventDieButton = createElement("button", {
      class: "activate-event-die-button",
      children: [createElement("i", { class: classes("fa-solid", "fa-plus") }), eventDie],
    });
    activateEventDieButton.addEventListener("click", () =>
      activateEventDie({ diceState, diceVersion, clockState, clockVersion })
    );
    diceSectionContents.push(activateEventDieButton);
  }
  if (diceState.eventDieActive) {
    const barbarianCountdown =
      diceState.barbarians?.position ||
      (diceState.barbarians?.lastMovedTurn != undefined && diceState.barbarians.lastMovedTurn === clockState?.turn
        ? 0
        : barbarianCycle);
    const barbarianCountdownEl = createElement("div", {
      class: classes("barbarian-countdown", "clickable", barbarianCountdown === 0 ? "barbarian-attack" : null),
      children: [
        createElement("span", {
          children: [barbarianCountdown],
        }),
        createEventDie(barbarianCountdown === 0 ? "barbarians-attack" : "barbarians"),
      ],
    });
    addLongPressListener(barbarianCountdownEl, () =>
      countDownBarbarians({ diceState, diceVersion, clockState, clockVersion })
    );
    diceSectionContents.push(barbarianCountdownEl);
  }

  const attachDiceRollHandler = () => {
    if (canRollDice) {
      if (!isCurrentTurnDiceRoll || clockState?.turn === 0) {
        diceContainer.addEventListener("click", handleDiceRoll);
      } else {
        addLongPressListener(diceContainer, handleDiceRoll);
      }
    }
  };
  if (!isNewDiceRoll) {
    attachDiceRollHandler();
  }

  lastDiceRollPosition = diceRollPosition;
  element("dice-section").replaceChildren(...diceSectionContents);
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
