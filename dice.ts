interface Dice {
  redDie: 1 | 2 | 3 | 4 | 5 | 6;
  yellowDie: 1 | 2 | 3 | 4 | 5 | 6;
  eventDie: "barbarians" | "yellow-progress" | "blue-progress" | "green-progress";
}

interface DiceHistory {
  [turn: number]: {
    name: string;
    rolls: (Dice & { active: boolean; eventDieActive: boolean })[];
  };
}

interface DiceState {
  eventDieActive: boolean;
  barbarians: {
    position: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    lastMovedTurn: number;
  };
  history: DiceHistory;
}
