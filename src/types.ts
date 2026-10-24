export type Outcome = "P" | "B" | "T";

export interface ExclusiveStreakCounts {
  2: number;
  3: number;
  4: number;
}

export interface SimulationSummary {
  numShoes: number;
  numDecks: number;
  minHands: number;
  averageHands: number;
  maxHands: number;
  minStreak2: number;
  averageStreak2: number;
  maxStreak2: number;
  totalStreak2: number;
  minStreak3: number;
  averageStreak3: number;
  maxStreak3: number;
  totalStreak3: number;
  minStreak4: number;
  averageStreak4: number;
  maxStreak4: number;
  totalStreak4: number;
}

