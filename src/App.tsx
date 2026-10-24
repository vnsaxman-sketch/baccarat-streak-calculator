import { useState } from "react";
import { runSimulation } from "./baccarat";
import type { SimulationSummary } from "./types";
import "./App.css";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

function formatInteger(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function App() {
  const [numberOfShoes, setNumberOfShoes] = useState("1000");
  const [numberOfDecks, setNumberOfDecks] = useState("8");
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedShoes = Number(numberOfShoes);
    const parsedDecks = Number(numberOfDecks);

    if (
      !Number.isInteger(parsedShoes) ||
      !Number.isInteger(parsedDecks) ||
      parsedShoes <= 0 ||
      parsedDecks <= 0
    ) {
      setError("Please enter valid positive whole numbers.");
      setSummary(null);
      return;
    }

    if (parsedDecks > 64) {
      setError("Please enter 64 decks or fewer.");
      setSummary(null);
      return;
    }

    if (parsedShoes > 100_000) {
      setError("For browser performance, please simulate 100,000 shoes or fewer.");
      setSummary(null);
      return;
    }

    setError("");
    setIsRunning(true);

    /*
      The timeout gives React a chance to repaint the disabled button and
      “Running” state before the CPU-intensive simulation begins.
    */
    window.setTimeout(() => {
      try {
        setSummary(runSimulation(parsedShoes, parsedDecks));
      } finally {
        setIsRunning(false);
      }
    }, 20);
  }

  return (
    <main className="page-shell">
      <section className="app-card" aria-labelledby="app-title">
        <header className="app-header">
          <p className="eyebrow">Developed by Long Nguyen</p>
          <h1 id="app-title">
            Official Baccarat Exclusive Streak Simulator
          </h1>
          <p className="subtitle">
            Simulates exact Player and Banker streaks of 2, 3, and 4 only.
          </p>
        </header>

        <form className="parameter-card" onSubmit={handleSubmit}>
          <h2>Simulation Parameters</h2>

          <div className="input-grid">
            <label htmlFor="number-of-shoes">
              <span>Number of shoes to simulate</span>
              <input
                id="number-of-shoes"
                type="number"
                min="1"
                max="100000"
                step="1"
                value={numberOfShoes}
                onChange={(event) => setNumberOfShoes(event.target.value)}
                disabled={isRunning}
                inputMode="numeric"
              />
            </label>

            <label htmlFor="number-of-decks">
              <span>Decks per shoe</span>
              <input
                id="number-of-decks"
                type="number"
                min="1"
                max="64"
                step="1"
                value={numberOfDecks}
                onChange={(event) => setNumberOfDecks(event.target.value)}
                disabled={isRunning}
                inputMode="numeric"
              />
            </label>
          </div>

          <button className="run-button" type="submit" disabled={isRunning}>
            {isRunning ? "Running Simulation…" : "Run Simulation"}
          </button>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
        </form>

        <section className="results-section" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Output</p>
              <h2>Simulation Results &amp; Summary</h2>
            </div>

            {summary && (
              <span className="complete-badge">
                {formatInteger(summary.numShoes)} shoes complete
              </span>
            )}
          </div>

          {!summary && !isRunning && (
            <div className="empty-state">
              <p>Your report will appear here after you run a simulation.</p>
            </div>
          )}

          {isRunning && (
            <div className="empty-state">
              <div className="spinner" aria-hidden="true" />
              <p>Dealing simulated shoes and measuring exact streak blocks…</p>
            </div>
          )}

          {summary && !isRunning && <SimulationReport summary={summary} />}
        </section>
      </section>
    </main>
  );
}

interface SimulationReportProps {
  summary: SimulationSummary;
}

function SimulationReport({ summary }: SimulationReportProps) {
  return (
    <div className="report">
      <section className="report-section">
        <h3>Simulation Parameters</h3>
        <dl className="stat-list">
          <div>
            <dt>Total shoes simulated</dt>
            <dd>{formatInteger(summary.numShoes)}</dd>
          </div>
          <div>
            <dt>Decks per shoe</dt>
            <dd>{summary.numDecks}</dd>
          </div>
        </dl>
      </section>

      <section className="report-section">
        <h3>Hands per Shoe</h3>
        <p className="section-note">
          The original 16–60-card cut-card setting targets roughly 68–80 hands
          in a standard eight-deck shoe.
        </p>
        <StatTable
          rows={[
            ["Low hands in a shoe", String(summary.minHands)],
            ["Average hands per shoe", formatDecimal(summary.averageHands)],
            ["High hands in a shoe", String(summary.maxHands)],
          ]}
        />
      </section>

      <section className="report-section">
        <h3>Exclusive Streak-2 Only (PP / BB)</h3>
        <StatTable
          rows={[
            ["Low count in a shoe", String(summary.minStreak2)],
            ["Average count per shoe", formatDecimal(summary.averageStreak2)],
            ["High count in a shoe", String(summary.maxStreak2)],
            ["Total events in simulation", formatInteger(summary.totalStreak2)],
          ]}
        />
      </section>

      <section className="report-section">
        <h3>Exclusive Streak-3 Only (PPP / BBB)</h3>
        <StatTable
          rows={[
            ["Low count in a shoe", String(summary.minStreak3)],
            ["Average count per shoe", formatDecimal(summary.averageStreak3)],
            ["High count in a shoe", String(summary.maxStreak3)],
            ["Total events in simulation", formatInteger(summary.totalStreak3)],
          ]}
        />
      </section>

      <section className="report-section">
        <h3>Exclusive Streak-4 Only (PPPP / BBBB)</h3>
        <StatTable
          rows={[
            ["Low count in a shoe", String(summary.minStreak4)],
            ["Average count per shoe", formatDecimal(summary.averageStreak4)],
            ["High count in a shoe", String(summary.maxStreak4)],
            ["Total events in simulation", formatInteger(summary.totalStreak4)],
          ]}
        />
      </section>

      <section className="rules-card">
        <h3>Rules &amp; Exclusive Criteria</h3>
        <ul>
          <li>
            Full Baccarat Player and Banker third-card rules and natural
            outcomes are implemented.
          </li>
          <li>
            The cut-card rule retains 16–60 undealt cards, matching the
            original Python simulator.
          </li>
          <li>
            Only an exact uninterrupted PP/BB, PPP/BBB, or PPPP/BBBB block
            counts in its respective category.
          </li>
          <li>
            Longer runs, such as PPPPP, do not count as streaks of 2, 3, or 4.
            Ties act as separators.
          </li>
        </ul>
      </section>
    </div>
  );
}

interface StatTableProps {
  rows: [string, string][];
}

function StatTable({ rows }: StatTableProps) {
  return (
    <dl className="stat-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default App;

