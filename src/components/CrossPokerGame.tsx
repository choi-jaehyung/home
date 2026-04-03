"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// TYPES
// ============================================================
type Suit = "S" | "H" | "D" | "C";
type Value = "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type Difficulty = "easy" | "medium" | "hard";

interface Card {
  suit: Suit;
  value: Value;
}

interface UserAnswer {
  suit: Suit | "";
  value: Value | "";
}

interface HandResult {
  name: string;
  rank: number;
}

interface GameState {
  board: Card[][];           // 5x5 실제 보드
  revealed: boolean[][];    // 공개 여부
  userAnswers: (UserAnswer | null)[][];  // 사용자 입력
  originalHands: HandResult[];  // [row0..4, col0..4, diag_main, diag_anti]
  status: "playing" | "correct" | "incorrect" | "idle";
  hintCount: number;
  difficulty: Difficulty;
  moveHistory: { row: number; col: number; prev: UserAnswer | null }[];
}

interface Translations {
  title: string;
  subtitle: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  new_game: string;
  check: string;
  hint: string;
  undo: string;
  reveal_all: string;
  correct: string;
  incorrect: string;
  correct_message: string;
  incorrect_message: string;
  select_suit: string;
  select_value: string;
  card_tracker: string;
  how_to_play: string;
  rules_text: string;
  time: string;
  difficulty_select: string;
  start_game: string;
  hidden_cards: string;
  legend_revealed: string;
  legend_entered: string;
  legend_duplicate: string;
  legend_not_used: string;
}

// ============================================================
// CONSTANTS
// ============================================================
const SUITS: Suit[] = ["S", "H", "D", "C"];
const VALUES: Value[] = ["8", "9", "10", "J", "Q", "K", "A"];
const SUIT_SYMBOLS: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLORS: Record<Suit, string> = {
  S: "text-slate-800",
  H: "text-red-600",
  D: "text-red-600",
  C: "text-slate-800",
};
const HIDDEN_COUNT: Record<Difficulty, number> = { easy: 16, medium: 19, hard: 22 };
const MAX_HINTS = 3;

// ============================================================
// POKER HAND EVALUATION
// ============================================================
function evaluateHand(cards: Card[]): HandResult {
  const values = cards.map((c) => VALUES.indexOf(c.value));
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);
  const sortedVals = [...values].sort((a, b) => a - b);
  // Straight: consecutive
  let isStraight = sortedVals.every((v, i) => i === 0 || v === sortedVals[i - 1] + 1);
  // In our deck 8=0,9=1,10=2,J=3,Q=4,K=5,A=6
  // Possible straights: [0,1,2,3,4],[1,2,3,4,5],[2,3,4,5,6]

  const valueCounts: Record<number, number> = {};
  for (const v of values) valueCounts[v] = (valueCounts[v] || 0) + 1;
  const counts = Object.values(valueCounts).sort((a, b) => b - a);

  if (isFlush && isStraight && sortedVals[4] === 6 && sortedVals[0] === 2) {
    return { name: "Royal Flush", rank: 9 };
  }
  if (isFlush && isStraight) return { name: "Straight Flush", rank: 8 };
  if (counts[0] === 4) return { name: "Four of a Kind", rank: 7 };
  if (counts[0] === 3 && counts[1] === 2) return { name: "Full House", rank: 6 };
  if (isFlush) return { name: "Flush", rank: 5 };
  if (isStraight) return { name: "Straight", rank: 4 };
  if (counts[0] === 3) return { name: "Three of a Kind", rank: 3 };
  if (counts[0] === 2 && counts[1] === 2) return { name: "Two Pair", rank: 2 };
  if (counts[0] === 2) return { name: "One Pair", rank: 1 };
  return { name: "High Card", rank: 0 };
}

// ============================================================
// BOARD GENERATION
// ============================================================
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateBoard(): Card[][] {
  // Strategy: try to build a board with at least 2 flushes and 3 straights
  for (let attempt = 0; attempt < 300; attempt++) {
    const board: Card[][] = Array.from({ length: 5 }, () => Array(5).fill(null));
    const allCards: Card[] = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        allCards.push({ suit, value });
      }
    }
    const deck = shuffle(allCards);

    // Pick 2 random columns to be flushes
    const flushCols = shuffle([0, 1, 2, 3, 4]).slice(0, 2);
    const flushSuits = shuffle(SUITS).slice(0, 2);

    let valid = true;

    // Fill flush columns
    for (let i = 0; i < 2; i++) {
      const col = flushCols[i];
      const suit = flushSuits[i];
      const suitCards = deck.filter((c) => c.suit === suit).slice(0, 5);
      if (suitCards.length < 5) { valid = false; break; }
      for (let row = 0; row < 5; row++) {
        board[row][col] = suitCards[row];
      }
    }
    if (!valid) continue;

    // Fill remaining cells with straights in rows
    // Collect used cards
    const usedCards = new Set<string>();
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (board[row][col]) usedCards.add(`${board[row][col].suit}${board[row][col].value}`);
      }
    }

    // For each row, try to complete a straight using available cards in non-flush cols
    const nonFlushCols = [0, 1, 2, 3, 4].filter((c) => !flushCols.includes(c));

    let rowsFilled = 0;
    for (let row = 0; row < 5 && rowsFilled < 3; row++) {
      // Get cards already in this row (flush columns)
      const rowCards = flushCols.map((col) => board[row][col]);
      const rowVals = rowCards.map((c) => VALUES.indexOf(c.value));

      // Try to find a straight that includes these values
      const straightCandidates: Value[][] = [
        ["8", "9", "10", "J", "Q"],
        ["9", "10", "J", "Q", "K"],
        ["10", "J", "Q", "K", "A"],
      ];

      let placed = false;
      for (const straight of shuffle(straightCandidates)) {
        // Check if rowCards are subset of straight
        const straightVals = straight.map((v) => VALUES.indexOf(v));
        if (!rowVals.every((v) => straightVals.includes(v))) continue;

        // Remaining values to place
        const needed = straight.filter((v) => !rowVals.includes(VALUES.indexOf(v)));
        if (needed.length !== nonFlushCols.length) continue;

        // Find available cards for needed values
        const assignments: { col: number; card: Card }[] = [];
        const tempUsed = new Set(usedCards);
        let canPlace = true;

        for (let i = 0; i < nonFlushCols.length; i++) {
          const col = nonFlushCols[i];
          const value = needed[i];
          // Pick any suit not used
          const availSuits = shuffle(SUITS).filter(
            (s) => !tempUsed.has(`${s}${value}`)
          );
          if (availSuits.length === 0) { canPlace = false; break; }
          const card: Card = { suit: availSuits[0], value };
          assignments.push({ col, card });
          tempUsed.add(`${availSuits[0]}${value}`);
        }

        if (canPlace) {
          for (const { col, card } of assignments) {
            board[row][col] = card;
            usedCards.add(`${card.suit}${card.value}`);
          }
          placed = true;
          rowsFilled++;
          break;
        }
      }

      if (!placed) {
        // Fill randomly
        for (const col of nonFlushCols) {
          if (!board[row][col]) {
            const available = deck.filter((c) => !usedCards.has(`${c.suit}${c.value}`));
            if (available.length === 0) { valid = false; break; }
            board[row][col] = available[0];
            usedCards.add(`${available[0].suit}${available[0].value}`);
          }
        }
        if (!valid) break;
      }
    }

    if (!valid) continue;

    // Fill any remaining empty cells
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (!board[row][col]) {
          const available = deck.filter((c) => !usedCards.has(`${c.suit}${c.value}`));
          if (available.length === 0) { valid = false; break; }
          board[row][col] = available[0];
          usedCards.add(`${available[0].suit}${available[0].value}`);
        }
      }
      if (!valid) break;
    }

    if (valid && board.every((row) => row.every((c) => c !== null))) {
      return board;
    }
  }

  // Fallback: random valid board
  return generateFallbackBoard();
}

function generateFallbackBoard(): Card[][] {
  const allCards: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      allCards.push({ suit, value });
    }
  }
  const deck = shuffle(allCards).slice(0, 25);
  const board: Card[][] = [];
  for (let i = 0; i < 5; i++) {
    board.push(deck.slice(i * 5, i * 5 + 5));
  }
  return board;
}

function getHandsForBoard(board: Card[][]): HandResult[] {
  const hands: HandResult[] = [];
  // 5 rows
  for (let r = 0; r < 5; r++) {
    hands.push(evaluateHand(board[r]));
  }
  // 5 cols
  for (let c = 0; c < 5; c++) {
    hands.push(evaluateHand(board.map((row) => row[c])));
  }
  // main diagonal
  hands.push(evaluateHand([0, 1, 2, 3, 4].map((i) => board[i][i])));
  // anti diagonal
  hands.push(evaluateHand([0, 1, 2, 3, 4].map((i) => board[i][4 - i])));
  return hands;
}

function createInitialRevealed(board: Card[][], difficulty: Difficulty): boolean[][] {
  const total = 25;
  const hiddenCount = HIDDEN_COUNT[difficulty];
  const positions = shuffle(Array.from({ length: total }, (_, i) => i));
  const hiddenSet = new Set(positions.slice(0, hiddenCount));
  return Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => !hiddenSet.has(r * 5 + c))
  );
}

// ============================================================
// CARD COMPONENT
// ============================================================
function CardDisplay({ card, small = false }: { card: Card; small?: boolean }) {
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = SUIT_COLORS[card.suit];

  if (small) {
    return (
      <div className={`font-mono font-bold text-xs ${suitColor} flex items-center gap-0.5`}>
        <span>{card.value}</span>
        <span>{suitSymbol}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-full py-0.5">
      <div className={`text-xs font-bold font-mono leading-none ${suitColor}`}>{card.value}</div>
      <div className={`text-lg leading-none ${suitColor}`}>{suitSymbol}</div>
      <div className={`text-xs font-bold font-mono leading-none rotate-180 ${suitColor}`}>{card.value}</div>
    </div>
  );
}

// ============================================================
// HAND BADGE
// ============================================================
const HAND_RANK_COLORS: Record<number, string> = {
  9: "bg-yellow-400 text-yellow-900",
  8: "bg-yellow-300 text-yellow-900",
  7: "bg-orange-400 text-orange-900",
  6: "bg-orange-300 text-orange-900",
  5: "bg-emerald-600 text-white",
  4: "bg-emerald-500 text-white",
  3: "bg-sky-500 text-white",
  2: "bg-sky-400 text-white",
  1: "bg-slate-400 text-white",
  0: "bg-slate-300 text-slate-700",
};

function HandBadge({ hand, compact = false }: { hand: HandResult; compact?: boolean }) {
  const colorClass = HAND_RANK_COLORS[hand.rank] ?? "bg-slate-300 text-slate-700";
  return (
    <span
      className={`${colorClass} ${compact ? "text-[9px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5"} rounded font-semibold whitespace-nowrap`}
    >
      {hand.name}
    </span>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CrossPokerGame({ translations: t }: { translations: Translations }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [checkedCells, setCheckedCells] = useState<boolean[][] | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startNewGame = useCallback((difficulty: Difficulty) => {
    const board = generateBoard();
    const revealed = createInitialRevealed(board, difficulty);
    const originalHands = getHandsForBoard(board);
    const userAnswers: (UserAnswer | null)[][] = Array.from({ length: 5 }, () =>
      Array(5).fill(null)
    );

    setGameState({
      board,
      revealed,
      userAnswers,
      originalHands,
      status: "playing",
      hintCount: 0,
      difficulty,
      moveHistory: [],
    });
    setCheckedCells(null);
    setElapsedSeconds(0);
    setTimerActive(true);
    setShowDifficultyModal(false);
  }, []);

  const handleAnswerChange = useCallback(
    (row: number, col: number, field: "suit" | "value", val: string) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const prevAnswer = prev.userAnswers[row][col];
        const newAnswer: UserAnswer = {
          suit: field === "suit" ? (val as Suit | "") : (prevAnswer?.suit ?? ""),
          value: field === "value" ? (val as Value | "") : (prevAnswer?.value ?? ""),
        };
        const newAnswers = prev.userAnswers.map((r, ri) =>
          r.map((a, ci) => (ri === row && ci === col ? newAnswer : a))
        );
        return {
          ...prev,
          userAnswers: newAnswers,
          status: "playing",
          moveHistory: [
            ...prev.moveHistory,
            { row, col, prev: prevAnswer },
          ],
        };
      });
      setCheckedCells(null);
    },
    []
  );

  const handleUndo = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.moveHistory.length === 0) return prev;
      const history = [...prev.moveHistory];
      const last = history.pop()!;
      const newAnswers = prev.userAnswers.map((r, ri) =>
        r.map((a, ci) => (ri === last.row && ci === last.col ? last.prev : a))
      );
      return { ...prev, userAnswers: newAnswers, moveHistory: history };
    });
    setCheckedCells(null);
  }, []);

  const handleHint = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.hintCount >= MAX_HINTS) return prev;
      const hidden: [number, number][] = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (!prev.revealed[r][c] && !isCorrectAnswer(prev.userAnswers[r][c], prev.board[r][c])) {
            hidden.push([r, c]);
          }
        }
      }
      if (hidden.length === 0) return prev;
      const [hr, hc] = hidden[Math.floor(Math.random() * hidden.length)];
      const card = prev.board[hr][hc];
      const newAnswers = prev.userAnswers.map((row, ri) =>
        row.map((a, ci) =>
          ri === hr && ci === hc ? { suit: card.suit, value: card.value } : a
        )
      );
      return { ...prev, userAnswers: newAnswers, hintCount: prev.hintCount + 1 };
    });
    setCheckedCells(null);
  }, []);

  const isCorrectAnswer = (answer: UserAnswer | null, card: Card) => {
    return answer?.suit === card.suit && answer?.value === card.value;
  };

  const handleCheck = useCallback(() => {
    setGameState((prev) => {
      if (!prev) return prev;
      let allCorrect = true;
      const checked: boolean[][] = Array.from({ length: 5 }, () => Array(5).fill(true));
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (!prev.revealed[r][c]) {
            const correct = isCorrectAnswer(prev.userAnswers[r][c], prev.board[r][c]);
            checked[r][c] = correct;
            if (!correct) allCorrect = false;
          }
        }
      }
      setCheckedCells(checked);
      if (allCorrect) setTimerActive(false);
      return { ...prev, status: allCorrect ? "correct" : "incorrect" };
    });
  }, []);

  const handleRevealAll = useCallback(() => {
    setGameState((prev) => {
      if (!prev) return prev;
      const revealed = Array.from({ length: 5 }, () => Array(5).fill(true));
      setTimerActive(false);
      return { ...prev, revealed, status: "idle" };
    });
    setCheckedCells(null);
  }, []);

  // Card tracker data
  const getCardUsage = useCallback(() => {
    if (!gameState) return {};
    const usage: Record<string, number> = {};
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!gameState.revealed[r][c] && gameState.userAnswers[r][c]) {
          const { suit, value } = gameState.userAnswers[r][c]!;
          if (suit && value) {
            const key = `${suit}${value}`;
            usage[key] = (usage[key] || 0) + 1;
          }
        }
      }
    }
    return usage;
  }, [gameState]);

  if (showDifficultyModal || !gameState) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="text-4xl mb-4">🃏</div>
          <h1 className="text-2xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400 text-sm mb-8">{t.subtitle}</p>

          <p className="text-slate-300 text-sm font-medium mb-4">{t.difficulty_select}</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => startNewGame(d)}
                className="py-3 rounded-xl border border-slate-600 text-sm font-semibold text-slate-300 hover:bg-emerald-700 hover:border-emerald-500 hover:text-white transition-all"
              >
                <div className="text-xs text-slate-400 mb-1">
                  {d === "easy" ? "16" : d === "medium" ? "19" : "22"}
                </div>
                {t[d]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {t.how_to_play} →
          </button>
        </div>

        {showRules && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRules(false)}
          >
            <div
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-white font-bold text-lg mb-4">{t.how_to_play}</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">{t.rules_text}</p>
              <button
                onClick={() => setShowRules(false)}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { board, revealed, userAnswers, originalHands, status, hintCount } = gameState;
  const cardUsage = getCardUsage();

  const getDiagHand = (type: "main" | "anti") => {
    return originalHands[type === "main" ? 10 : 11];
  };

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{t.title}</h1>
            <p className="text-slate-400 text-xs">
              {t.difficulty}: <span className="text-emerald-400">{t[gameState.difficulty]}</span>
              {" · "}
              {t.time}: <span className="text-emerald-400 font-mono">{formatTime(elapsedSeconds)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              ?
            </button>
            <button
              onClick={() => { setShowDifficultyModal(true); setTimerActive(false); }}
              className="text-xs text-slate-300 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              {t.new_game}
            </button>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {status === "correct" && (
        <div className="max-w-5xl mx-auto mb-4 bg-emerald-700 border border-emerald-500 rounded-xl px-4 py-3 text-white text-sm text-center">
          🎉 {t.correct_message}
        </div>
      )}
      {status === "incorrect" && (
        <div className="max-w-5xl mx-auto mb-4 bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 text-red-200 text-sm text-center">
          {t.incorrect_message}
        </div>
      )}

      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-4">
        {/* Board area */}
        <div className="flex-1">
          {/* Anti-diagonal label top-right */}
          <div className="flex justify-end mb-1 pr-1">
            <HandBadge hand={getDiagHand("anti")} compact />
          </div>

          <div className="relative">
            {/* Main diagonal label */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full hidden sm:block">
              <div className="flex items-center gap-1">
                <HandBadge hand={getDiagHand("main")} compact />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-1">
              {[0, 1, 2, 3, 4].map((row) => (
                <React.Fragment key={row}>
                  {[0, 1, 2, 3, 4].map((col) => {
                    const isRevealed = revealed[row][col];
                    const card = board[row][col];
                    const userAnswer = userAnswers[row][col];
                    const isChecked = checkedCells !== null;
                    const isWrong = isChecked && !revealed[row][col] && checkedCells && !checkedCells[row][col];
                    const isCorrectCell = isChecked && !revealed[row][col] && checkedCells && checkedCells[row][col];

                    return (
                      <div
                        key={`${row}-${col}`}
                        className={`
                          aspect-[2/3] rounded-lg border flex items-center justify-center relative
                          ${isRevealed
                            ? "bg-white border-slate-200 shadow-sm"
                            : isWrong
                            ? "bg-red-950 border-red-700"
                            : isCorrectCell
                            ? "bg-emerald-950 border-emerald-700"
                            : "bg-slate-700 border-slate-600"
                          }
                        `}
                      >
                        {isRevealed ? (
                          <CardDisplay card={card} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 p-1">
                            <select
                              value={userAnswer?.suit ?? ""}
                              onChange={(e) => handleAnswerChange(row, col, "suit", e.target.value)}
                              className="w-full text-[10px] bg-slate-600 border border-slate-500 text-slate-200 rounded px-0.5 py-0.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              <option value="">-</option>
                              {SUITS.map((s) => (
                                <option key={s} value={s}>{SUIT_SYMBOLS[s]}</option>
                              ))}
                            </select>
                            <select
                              value={userAnswer?.value ?? ""}
                              onChange={(e) => handleAnswerChange(row, col, "value", e.target.value)}
                              className="w-full text-[10px] bg-slate-600 border border-slate-500 text-slate-200 rounded px-0.5 py-0.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              <option value="">-</option>
                              {VALUES.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Row hand badge */}
                  <div key={`hand-${row}`} className="flex items-center pl-1">
                    <HandBadge hand={originalHands[row]} compact />
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Column hand badges */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-1 mt-1">
              {[0, 1, 2, 3, 4].map((col) => (
                <div key={col} className="flex justify-center">
                  <HandBadge hand={originalHands[5 + col]} compact />
                </div>
              ))}
              <div /> {/* spacer for row label column */}
            </div>
          </div>

          {/* Main diagonal label (mobile) */}
          <div className="sm:hidden flex justify-start mt-1 ml-1">
            <span className="text-xs text-slate-400">↘ <HandBadge hand={getDiagHand("main")} compact /></span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={handleCheck}
              className="flex-1 min-w-[80px] py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {t.check}
            </button>
            <button
              onClick={handleHint}
              disabled={hintCount >= MAX_HINTS}
              className="flex-1 min-w-[80px] py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {t.hint} ({MAX_HINTS - hintCount})
            </button>
            <button
              onClick={handleUndo}
              disabled={gameState.moveHistory.length === 0}
              className="flex-1 min-w-[80px] py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-sm font-semibold rounded-xl transition-colors"
            >
              {t.undo}
            </button>
            <button
              onClick={handleRevealAll}
              className="flex-1 min-w-[80px] py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition-colors"
            >
              {t.reveal_all}
            </button>
          </div>
        </div>

        {/* Card Tracker */}
        <div className="lg:w-48">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <h3 className="text-slate-300 text-xs font-semibold mb-3 uppercase tracking-wider">
              {t.card_tracker}
            </h3>
            <div className="space-y-2">
              {SUITS.map((suit) => (
                <div key={suit}>
                  <div className={`text-xs font-bold mb-1 ${SUIT_COLORS[suit]}`}>
                    {SUIT_SYMBOLS[suit]}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {VALUES.map((value) => {
                      const key = `${suit}${value}`;
                      const isRevealedOnBoard = (() => {
                        for (let r = 0; r < 5; r++) {
                          for (let c = 0; c < 5; c++) {
                            if (board[r][c].suit === suit && board[r][c].value === value && revealed[r][c]) {
                              return true;
                            }
                          }
                        }
                        return false;
                      })();
                      const isOnBoard = (() => {
                        for (let r = 0; r < 5; r++) {
                          for (let c = 0; c < 5; c++) {
                            if (board[r][c].suit === suit && board[r][c].value === value) return true;
                          }
                        }
                        return false;
                      })();
                      const usageCount = cardUsage[key] || 0;
                      const isDuplicate = usageCount > 1;

                      return (
                        <div
                          key={value}
                          className={`
                            text-[9px] font-mono text-center rounded py-0.5
                            ${!isOnBoard
                              ? "bg-slate-900 text-slate-600"
                              : isRevealedOnBoard
                              ? "bg-slate-600 text-slate-300"
                              : isDuplicate
                              ? "bg-red-800 text-red-200"
                              : usageCount === 1
                              ? "bg-emerald-800 text-emerald-200"
                              : "bg-slate-700 text-slate-400"
                            }
                          `}
                          title={`${value}${SUIT_SYMBOLS[suit]}`}
                        >
                          {value === "10" ? "T" : value}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-slate-600 inline-block" /> {t.legend_revealed}</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-800 inline-block" /> {t.legend_entered}</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-800 inline-block" /> {t.legend_duplicate}</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-slate-900 inline-block" /> {t.legend_not_used}</div>
            </div>
          </div>
        </div>
      </div>

      {showRules && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRules(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-lg mb-4">{t.how_to_play}</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">{t.rules_text}</p>
            <button
              onClick={() => setShowRules(false)}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
