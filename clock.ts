// clock state
interface Clock {
  timestamp: number; // milliseconds since epoch
  initialTime: number; // milliseconds
  increment: number; // milliseconds
  clocks: [
    {
      name: string;
      time: number; // milliseconds remaining as of timestamp
    }
  ];
  running: number; // running clock index or null
  paused: number; // paused clock index or null
  turn: number;
}
