import type { ExclusiveStreakCounts, Outcome, SimulationSummary } from "./types";

const STANDARD_DECK: number[] = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  0,
  0,
  0,
  0,
];

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export class BaccaratShoe {
  private readonly numberOfDecks: number;
  private cards: number[] = [];
  private cardsToLeaveUndealt = 0;

  constructor(numberOfDecks: number) {
    this.numberOfDecks = numberOfDecks;
    this.reset();
  }

  public reset(): void {
    const oneDeck = Array.from({ length: 4 }, () => STANDARD_DECK).flat();

    this.cards = shuffle(
      Array.from({ length: this.numberOfDecks }, () => oneDeck).flat(),
    );

    /*
      At the end of a shoe, leave 16 through 60 cards unplayed.
      For 8 decks, this generally produces approximately 68–80 hands,
      depending on the mix of four-, five-, and six-card Baccarat rounds.
    */
    this.cardsToLeaveUndealt = this.randomInteger(16, 60);
  }

  public draw(): number | null {
    if (this.hasReachedCutCard()) {
      return null;
    }

    return this.cards.pop() ?? null;
  }

  public hasReachedCutCard(): boolean {
    return this.cards.length <= this.cardsToLeaveUndealt;
  }

  private randomInteger(minimum: number, maximum: number): number {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  }
}

function handValue(cards: number[]): number {
  return cards.reduce((total, card) => total + card, 0) % 10;
}

export function playBaccaratHand(shoe: BaccaratShoe): Outcome | null {
  if (shoe.hasReachedCutCard()) {
    return null;
  }

  const playerCard1 = shoe.draw();
  const bankerCard1 = shoe.draw();
  const playerCard2 = shoe.draw();
  const bankerCard2 = shoe.draw();

  if (
    playerCard1 === null ||
    bankerCard1 === null ||
    playerCard2 === null ||
    bankerCard2 === null
  ) {
    return null;
  }

  const playerCards = [playerCard1, playerCard2];
  const bankerCards = [bankerCard1, bankerCard2];

  let playerValue = handValue(playerCards);
  let bankerValue = handValue(bankerCards);

  // Naturals: either side has 8 or 9 on its first two cards.
  if (playerValue >= 8 || bankerValue >= 8) {
    return getWinner(playerValue, bankerValue);
  }

  let playerThirdCard: number | null = null;

  // Player draws on 0-5 and stands on 6-7.
  if (playerValue <= 5) {
    playerThirdCard = shoe.draw();

    if (playerThirdCard === null) {
      return null;
    }

    playerCards.push(playerThirdCard);
    playerValue = handValue(playerCards);
  }

  let bankerDraws = false;

  if (playerThirdCard === null) {
    // Player stood, so Banker draws on 0-5.
    bankerDraws = bankerValue <= 5;
  } else if (bankerValue <= 2) {
    bankerDraws = true;
  } else if (bankerValue === 3) {
    bankerDraws = playerThirdCard !== 8;
  } else if (bankerValue === 4) {
    bankerDraws = [2, 3, 4, 5, 6, 7].includes(playerThirdCard);
  } else if (bankerValue === 5) {
    bankerDraws = [4, 5, 6, 7].includes(playerThirdCard);
  } else if (bankerValue === 6) {
    bankerDraws = [6, 7].includes(playerThirdCard);
  } 
  //Banker 7 stands.

  if (bankerDraws) {
    const bankerThirdCard = shoe.draw();

    if (bankerThirdCard === null) {
      return null;
    }

    bankerCards.push(bankerThirdCard);
    bankerValue = handValue(bankerCards);
  }

  return getWinner(playerValue, bankerValue);
}

function getWinner(playerValue: number, bankerValue: number): Outcome {
  if (playerValue > bankerValue) {
    return "P";
  }

  if (bankerValue > playerValue) {
    return "B";
  }

  return "T";
}

/*
  Counts only complete, exact runs:

  PP or BB       -> streak 2
  PPP or BBB     -> streak 3
  PPPP or BBBB   -> streak 4

  A five-or-more streak does not count toward any lower category.
  Ties are separators.
*/
export function countExclusiveStreaks(
  outcomes: Outcome[],
): ExclusiveStreakCounts {
  const counts: ExclusiveStreakCounts = {
    2: 0,
    3: 0,
    4: 0,
  };

  let index = 0;

  while (index < outcomes.length) {
    const currentOutcome = outcomes[index];

    if (currentOutcome === "T") {
      index += 1;
      continue;
    }

    let streakLength = 1;
    let nextIndex = index + 1;

    while (
      nextIndex < outcomes.length &&
      outcomes[nextIndex] === currentOutcome
    ) {
      streakLength += 1;
      nextIndex += 1;
    }

    if (streakLength === 2 || streakLength === 3 || streakLength === 4) {
      counts[streakLength] += 1;
    }

    index = nextIndex;
  }

  return counts;
}

function minimum(values: number[]): number {
  return Math.min(...values);
}

function maximum(values: number[]): number {
  return Math.max(...values);
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function total(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

export function runSimulation(
  numShoes: number,
  numDecks: number,
): SimulationSummary {
  const handsPerShoe: number[] = [];
  const streak2Counts: number[] = [];
  const streak3Counts: number[] = [];
  const streak4Counts: number[] = [];

  for (let shoeNumber = 0; shoeNumber < numShoes; shoeNumber += 1) {
    const shoe = new BaccaratShoe(numDecks);
    const outcomes: Outcome[] = [];

    while (true) {
      const outcome = playBaccaratHand(shoe);

      if (outcome === null) {
        break;
      }

      outcomes.push(outcome);
    }

    const streaks = countExclusiveStreaks(outcomes);

    handsPerShoe.push(outcomes.length);
    streak2Counts.push(streaks[2]);
    streak3Counts.push(streaks[3]);
    streak4Counts.push(streaks[4]);
  }

  return {
    numShoes,
    numDecks,

    minHands: minimum(handsPerShoe),
    averageHands: average(handsPerShoe),
    maxHands: maximum(handsPerShoe),

    minStreak2: minimum(streak2Counts),
    averageStreak2: average(streak2Counts),
    maxStreak2: maximum(streak2Counts),
    totalStreak2: total(streak2Counts),

    minStreak3: minimum(streak3Counts),
    averageStreak3: average(streak3Counts),
    maxStreak3: maximum(streak3Counts),
    totalStreak3: total(streak3Counts),

    minStreak4: minimum(streak4Counts),
    averageStreak4: average(streak4Counts),
    maxStreak4: maximum(streak4Counts),
    totalStreak4: total(streak4Counts),
  };
}

