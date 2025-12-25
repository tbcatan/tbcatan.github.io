const getRollProbability = (roll) => {
  switch (roll) {
    case 2: {
      return 1 / 36;
    }
    case 3: {
      return 1 / 18;
    }
    case 4: {
      return 1 / 12;
    }
    case 5: {
      return 1 / 9;
    }
    case 6: {
      return 5 / 36;
    }
    case 7: {
      return 1 / 6;
    }
    case 8: {
      return 5 / 36;
    }
    case 9: {
      return 1 / 9;
    }
    case 10: {
      return 1 / 12;
    }
    case 11: {
      return 1 / 18;
    }
    case 12: {
      return 1 / 36;
    }
  }
};

const computeBinomialMidCdf = (trials, successes, probability) => {
  let sum = 0;
  let nextTerm = Math.pow(1 - probability, trials);
  for (let k = 0; k <= successes; k++) {
    if (k < successes) {
      sum += nextTerm;
      nextTerm *= ((trials - k) / (k + 1)) * (probability / (1 - probability));
    } else {
      sum += nextTerm / 2;
    }
  }
  return sum;
};

const updateDiceBreakdown = (diceState) => {
  const rolls = Object.values(diceState ?? {}).flatMap((dice) => dice?.rolls?.filter((roll) => roll.active) ?? []);
  const rollCounts = new Map();
  rolls.forEach((roll) => {
    const rollValue = roll.redDie + roll.yellowDie;
    if (!rollCounts.get(rollValue)) {
      rollCounts.set(rollValue, 0);
    }
    rollCounts.set(rollValue, rollCounts.get(rollValue) + 1);
  });

  const tableRows = [];
  for (let i = 2; i <= 12; i++) {
    tableRows.push(
      createElement("div", {
        class: "table-row",
        children: [
          createElement("div", {
            class: "table-cell",
            textContent: String(i),
          }),
          createElement("div", {
            class: "table-cell",
            textContent: String(rollCounts.get(i) ?? 0),
          }),
          createElement("div", {
            class: "table-cell",
            textContent: (rolls.length * getRollProbability(i)).toFixed(1),
          }),
          createElement("div", {
            class: "table-cell",
            textContent: (
              computeBinomialMidCdf(rolls.length, rollCounts.get(i) ?? 0, getRollProbability(i)) * 100
            ).toFixed(1),
          }),
        ],
      })
    );
  }

  let chiSquare = 0;
  if (rolls.length > 0) {
    for (let i = 2; i <= 12; i++) {
      const actual = rollCounts.get(i) ?? 0;
      const expected = rolls.length * getRollProbability(i);
      chiSquare += ((actual - expected) * (actual - expected)) / expected;
    }
  }

  element("dice-roll-count").textContent = rolls.length;
  element("dice-table-body").replaceChildren(...tableRows);
  element("dice-chi-square-value").textContent = rolls.length > 0 ? chiSquare.toFixed(1) : "";
};

dice.subscribe(updateDiceBreakdown);

const openDiceHistory = () => {
  element("game").classList.add("hidden");
  element("dice-history").classList.remove("hidden");
};

const closeDiceHistory = () => {
  element("dice-history").classList.add("hidden");
  element("game").classList.remove("hidden");
};
