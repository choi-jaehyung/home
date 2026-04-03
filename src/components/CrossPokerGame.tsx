"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// TYPES
// ============================================================
type Suit = "S" | "H" | "D" | "C";
type Value = "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type Difficulty = "easy" | "medium" | "hard";

interface Card { suit: Suit; value: Value; }

/** 원본 로직: suit과 rank를 독립적으로 노출 (50개 슬롯 = 25칸 × 2) */
interface CellDisplay { showSuit: boolean; showRank: boolean; }

interface UserCell { suit: Suit | ""; value: Value | ""; }
interface HandResult { name: string; rank: number; }

interface GameState {
  board: Card[][];
  display: CellDisplay[][];
  answers: UserCell[][];
  hands: HandResult[];   // [row0-4, col0-4, mainDiag(10), antiDiag(11)]
  status: "playing" | "correct" | "incorrect" | "idle";
  hints: number;
  difficulty: Difficulty;
  history: { row: number; col: number; field: "suit" | "value"; prev: string }[];
}

interface Translations {
  title: string; subtitle: string; difficulty: string;
  easy: string; medium: string; hard: string;
  new_game: string; check: string; hint: string; undo: string; reveal_all: string;
  correct: string; incorrect: string; correct_message: string; incorrect_message: string;
  select_suit: string; select_value: string; card_tracker: string;
  how_to_play: string; rules_text: string; time: string;
  difficulty_select: string; start_game: string; hidden_cards: string;
  legend_revealed: string; legend_entered: string; legend_duplicate: string; legend_not_used: string;
}

// ============================================================
// CONSTANTS
// ============================================================
const SUITS: Suit[] = ["S", "H", "D", "C"];
const VALUES: Value[] = ["8", "9", "10", "J", "Q", "K", "A"];
const SUIT_SYM: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_CLR: Record<Suit, string> = { S: "text-slate-900", H: "text-red-600", D: "text-red-600", C: "text-slate-900" };
const HIDDEN: Record<Difficulty, number> = { easy: 16, medium: 19, hard: 22 };
const MAX_HINTS = 3;

// ============================================================
// POKER HAND EVALUATION (원본 로직과 동일)
// ============================================================
function evalHand(cards: Card[]): HandResult {
  if (!cards || cards.length !== 5 || cards.some(c => !c)) return { name: "High Card", rank: 0 };
  const vals = cards.map(c => VALUES.indexOf(c.value));
  const isFlush = new Set(cards.map(c => c.suit)).size === 1;
  const sorted = [...vals].sort((a, b) => a - b);
  const isStraight = new Set(vals).size === 5 && sorted[4] - sorted[0] === 4;
  const counts = Object.values(
    vals.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {} as Record<number, number>)
  ).sort((a, b) => b - a);

  if (isFlush && isStraight && sorted[0] === 2) return { name: "Royal Flush", rank: 9 };
  if (isFlush && isStraight) return { name: "Str. Flush", rank: 8 };
  if (counts[0] === 4) return { name: "Four of Kind", rank: 7 };
  if (counts[0] === 3 && counts[1] === 2) return { name: "Full House", rank: 6 };
  if (isFlush) return { name: "Flush", rank: 5 };
  if (isStraight) return { name: "Straight", rank: 4 };
  if (counts[0] === 3) return { name: "Three of Kind", rank: 3 };
  if (counts[0] === 2 && counts[1] === 2) return { name: "Two Pair", rank: 2 };
  if (counts[0] === 2) return { name: "One Pair", rank: 1 };
  return { name: "High Card", rank: 0 };
}

function allHands(b: Card[][]): HandResult[] {
  return [
    ...[0,1,2,3,4].map(r => evalHand(b[r])),
    ...[0,1,2,3,4].map(c => evalHand(b.map(row => row[c]))),
    evalHand([0,1,2,3,4].map(i => b[i][i])),
    evalHand([0,1,2,3,4].map(i => b[i][4-i])),
  ];
}

// ============================================================
// BOARD GENERATION (원본 generateSpecialBoard 로직 충실히 재현)
// ============================================================
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function transpose(b: Card[][]): Card[][] {
  return [0,1,2,3,4].map(ci => [0,1,2,3,4].map(ri => b[ri][ci]));
}

function fallbackBoard(): Card[][] {
  const all: Card[] = [];
  for (const s of SUITS) for (const v of VALUES) all.push({ suit: s, value: v });
  const d = shuffle(all).slice(0, 25);
  return [0,1,2,3,4].map(i => d.slice(i*5, i*5+5));
}

function generateBoard(): Card[][] {
  for (let attempt = 0; attempt < 500; attempt++) {
    const board: (Card | null)[][] = Array.from({length:5}, () => Array(5).fill(null));
    const fullDeck: Card[] = [];
    for (const s of SUITS) for (const v of VALUES) fullDeck.push({suit:s, value:v});
    shuffle(fullDeck); // in-place via reference not needed, using Set approach below

    // Use a Set to track availability (mirrors original deck = new Set(fullDeck.map(...)))
    const avail = new Map<string, Card>();
    for (const c of fullDeck) avail.set(`${c.suit}|${c.value}`, c);

    // 2개 플러시 열 선택 (원본: colIndices.sort(() => 0.5 - Math.random()))
    const flushCols = shuffle([0,1,2,3,4]).slice(0, 2);
    const flushSuits = shuffle([...SUITS]).slice(0, 2);

    let ok = true;

    // 플러시 열 채우기
    for (let i = 0; i < 2; i++) {
      const col = flushCols[i];
      const suit = flushSuits[i];
      const suitCards = shuffle(fullDeck.filter(c => c.suit === suit)).slice(0, 5);
      if (suitCards.length < 5) { ok = false; break; }
      for (let r = 0; r < 5; r++) {
        const key = `${suitCards[r].suit}|${suitCards[r].value}`;
        if (avail.has(key)) { board[r][col] = suitCards[r]; avail.delete(key); }
        else { ok = false; break; }
      }
      if (!ok) break;
    }
    if (!ok) continue;

    // 3개 스트레이트 행 선택 (원본: rowIndices.sort(...))
    const straightRows = shuffle([0,1,2,3,4]).slice(0, 3);
    let deckArr = Array.from(avail.values());

    for (const r of straightRows) {
      const existing = board[r].filter((c): c is Card => c !== null);
      const empty = 5 - existing.length;
      // 원본: startRankIdx = Math.floor(Math.random() * (RANKS.length - 4)) → 0,1,2 중 하나
      const start = Math.floor(Math.random() * (VALUES.length - 4));
      const straight = VALUES.slice(start, start + 5);

      const required = new Set(straight);
      existing.forEach(c => required.delete(c.value));
      if (required.size !== empty) { ok = false; break; }

      const toPlace: Card[] = [];
      for (const value of required) {
        // 원본: deckArr.find(c => c.rank === rank) — rank가 맞는 카드 아무거나
        const idx = deckArr.findIndex(c => c.value === value);
        if (idx !== -1) { toPlace.push(deckArr.splice(idx, 1)[0]); }
        else { ok = false; break; }
      }
      if (!ok || toPlace.length !== empty) { ok = false; break; }

      const emptyIdxs = board[r].map((c, i) => c === null ? i : -1).filter(i => i !== -1);
      emptyIdxs.forEach((idx, i) => { board[r][idx] = toPlace[i]; });
    }
    if (!ok) continue;

    // 나머지 셀 채우기
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!board[r][c]) {
          if (!deckArr.length) { ok = false; break; }
          board[r][c] = deckArr.shift()!;
        }
      }
      if (!ok) break;
    }
    if (!ok) continue;

    const final = board as Card[][];

    // 검증: 플러시 ≥ 2개, 스트레이트 ≥ 3개
    let fc = 0, sc = 0;
    for (let c = 0; c < 5; c++) if (evalHand(final.map(row => row[c])).name.includes("Flush")) fc++;
    for (let r = 0; r < 5; r++) if (evalHand(final[r]).name.includes("Straight")) sc++;

    if (fc >= 2 && sc >= 3) {
      // 원본: shouldTranspose = Math.random() < 0.5 → 행/열 무작위 전치
      return Math.random() < 0.5 ? transpose(final) : final;
    }
  }
  console.warn("Board generation failed after 500 attempts.");
  return fallbackBoard();
}

// ============================================================
// DISPLAY STATE (원본: 50개 슬롯 = suit/rank 독립 노출)
// ============================================================
function makeDisplay(diff: Difficulty): CellDisplay[][] {
  const hidden = HIDDEN[diff];
  const indices = shuffle([...Array(50).keys()]);
  const hiddenSet = new Set(indices.slice(0, hidden));
  return Array.from({length:5}, (_, r) =>
    Array.from({length:5}, (_, c) => ({
      showSuit: !hiddenSet.has((r*5+c)*2),
      showRank: !hiddenSet.has((r*5+c)*2 + 1),
    }))
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================
const HAND_CLR: Record<number, string> = {
  9: "bg-yellow-400 text-yellow-900",
  8: "bg-yellow-300 text-yellow-900",
  7: "bg-orange-500 text-white",
  6: "bg-orange-400 text-white",
  5: "bg-emerald-600 text-white",
  4: "bg-teal-500 text-white",
  3: "bg-sky-500 text-white",
  2: "bg-sky-400 text-white",
  1: "bg-slate-400 text-white",
  0: "bg-slate-300 text-slate-700",
};

function HandBadge({ hand }: { hand: HandResult }) {
  return (
    <span className={`${HAND_CLR[hand.rank] ?? HAND_CLR[0]} text-[11px] px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap leading-tight`}>
      {hand.name}
    </span>
  );
}

function CardFace({ card }: { card: Card }) {
  const sc = SUIT_CLR[card.suit];
  return (
    <div className="flex flex-col items-center justify-between h-full py-1 select-none">
      <span className={`text-sm font-bold font-mono leading-none ${sc}`}>{card.value}</span>
      <span className={`text-2xl leading-none ${sc}`}>{SUIT_SYM[card.suit]}</span>
      <span className={`text-sm font-bold font-mono leading-none rotate-180 ${sc}`}>{card.value}</span>
    </div>
  );
}

function RulesModal({ t, onClose }: { t: Translations; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-bold text-lg mb-4">{t.how_to_play}</h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">{t.rules_text}</p>
        <button onClick={onClose} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">OK</button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CrossPokerGame({ translations: t }: { translations: Translations }) {
  const [gs, setGs] = useState<GameState | null>(null);
  const [showDiff, setShowDiff] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [checked, setChecked] = useState<{ suit: boolean; value: boolean }[][] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerOn]);

  const fmt = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  const startGame = useCallback((diff: Difficulty) => {
    const board = generateBoard();
    const display = makeDisplay(diff);
    const hands = allHands(board);
    setGs({
      board, display, hands,
      answers: Array.from({length:5}, () => Array.from({length:5}, () => ({suit:"", value:""}))),
      status: "playing", hints: 0, difficulty: diff, history: [],
    });
    setChecked(null);
    setElapsed(0);
    setTimerOn(true);
    setShowDiff(false);
  }, []);

  const handleChange = useCallback((row: number, col: number, field: "suit"|"value", val: string) => {
    setGs(prev => {
      if (!prev) return prev;
      const old = prev.answers[row][col][field];
      return {
        ...prev,
        answers: prev.answers.map((r,ri) => r.map((a,ci) =>
          ri===row && ci===col ? {...a, [field]: val} : a
        )),
        status: "playing",
        history: [...prev.history, {row, col, field, prev: old}],
      };
    });
    setChecked(null);
  }, []);

  const handleUndo = useCallback(() => {
    setGs(prev => {
      if (!prev || !prev.history.length) return prev;
      const hist = [...prev.history];
      const last = hist.pop()!;
      return {
        ...prev,
        answers: prev.answers.map((r,ri) => r.map((a,ci) =>
          ri===last.row && ci===last.col ? {...a, [last.field]: last.prev} : a
        )),
        history: hist,
      };
    });
    setChecked(null);
  }, []);

  const handleHint = useCallback(() => {
    setGs(prev => {
      if (!prev || prev.hints >= MAX_HINTS) return prev;
      // 원본 giveHint: 모든 hidden input 중 무작위 1개 공개
      const cands: {r:number; c:number; f:"suit"|"value"}[] = [];
      for (let r=0; r<5; r++) for (let c=0; c<5; c++) {
        if (!prev.display[r][c].showSuit && prev.answers[r][c].suit !== prev.board[r][c].suit)
          cands.push({r, c, f:"suit"});
        if (!prev.display[r][c].showRank && prev.answers[r][c].value !== prev.board[r][c].value)
          cands.push({r, c, f:"value"});
      }
      if (!cands.length) return prev;
      const {r, c, f} = cands[Math.floor(Math.random()*cands.length)];
      const val = f==="suit" ? prev.board[r][c].suit : prev.board[r][c].value;
      return {
        ...prev,
        answers: prev.answers.map((row,ri) => row.map((a,ci) =>
          ri===r && ci===c ? {...a, [f]: val} : a
        )),
        hints: prev.hints + 1,
      };
    });
    setChecked(null);
  }, []);

  const handleCheck = useCallback(() => {
    setGs(prev => {
      if (!prev) return prev;

      // 사용자 보드 구성
      const userBoard: (Card | null)[][] = Array.from({length:5}, (_,r) =>
        Array.from({length:5}, (_,c) => {
          const s = prev.display[r][c].showSuit ? prev.board[r][c].suit : prev.answers[r][c].suit;
          const v = prev.display[r][c].showRank ? prev.board[r][c].value : prev.answers[r][c].value;
          return (s && v) ? {suit: s as Suit, value: v as Value} : null;
        })
      );

      // 미완성 체크
      if (userBoard.some(row => row.some(c => c === null))) {
        return {...prev, status: "incorrect"};
      }
      const complete = userBoard as Card[][];

      // 중복 체크
      const seen = new Set<string>();
      for (let r=0; r<5; r++) for (let c=0; c<5; c++) {
        const k = `${complete[r][c].suit}|${complete[r][c].value}`;
        if (seen.has(k)) return {...prev, status: "incorrect"};
        seen.add(k);
      }

      // 족보 비교 (원본 checkAnswers와 동일)
      const userHands = allHands(complete);
      const match = userHands.every((h, i) => h.name === prev.hands[i].name);

      // 셀별 피드백 (직접 비교)
      const cc = Array.from({length:5}, (_,r) =>
        Array.from({length:5}, (_,c) => ({
          suit: prev.display[r][c].showSuit || prev.answers[r][c].suit === prev.board[r][c].suit,
          value: prev.display[r][c].showRank || prev.answers[r][c].value === prev.board[r][c].value,
        }))
      );
      setChecked(cc);

      if (match) setTimerOn(false);
      return {...prev, status: match ? "correct" : "incorrect"};
    });
  }, []);

  const handleReveal = useCallback(() => {
    setGs(prev => {
      if (!prev) return prev;
      const cc = Array.from({length:5}, (_,r) =>
        Array.from({length:5}, (_,c) => ({
          suit: prev.display[r][c].showSuit || prev.answers[r][c].suit === prev.board[r][c].suit,
          value: prev.display[r][c].showRank || prev.answers[r][c].value === prev.board[r][c].value,
        }))
      );
      setChecked(cc);
      setTimerOn(false);
      return {
        ...prev,
        display: Array.from({length:5}, () => Array.from({length:5}, () => ({showSuit:true, showRank:true}))),
        status: "idle",
      };
    });
  }, []);

  // 카드 사용 현황 (suit+rank 모두 확정된 카드만 카운트)
  const usage = (() => {
    if (!gs) return {} as Record<string,number>;
    const u: Record<string,number> = {};
    for (let r=0; r<5; r++) for (let c=0; c<5; c++) {
      const s = gs.display[r][c].showSuit ? gs.board[r][c].suit : gs.answers[r][c].suit;
      const v = gs.display[r][c].showRank ? gs.board[r][c].value : gs.answers[r][c].value;
      if (s && v) { const k=`${s}|${v}`; u[k]=(u[k]||0)+1; }
    }
    return u;
  })();

  // ---- 난이도 선택 모달 ----
  if (showDiff || !gs) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">🃏</div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400 text-sm mb-8">{t.subtitle}</p>
          <p className="text-slate-300 font-semibold mb-4">{t.difficulty_select}</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["easy","medium","hard"] as Difficulty[]).map(d => (
              <button key={d} onClick={() => startGame(d)}
                className="py-4 rounded-xl border border-slate-600 font-semibold text-slate-300 hover:bg-emerald-700 hover:border-emerald-500 hover:text-white transition-all">
                <div className="text-sm text-slate-400 mb-1">{d==="easy"?"16":d==="medium"?"19":"22"}</div>
                <div className="text-base">{t[d]}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setShowRules(true)} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            {t.how_to_play} →
          </button>
        </div>
        {showRules && <RulesModal t={t} onClose={() => setShowRules(false)} />}
      </div>
    );
  }

  const { board, display, answers, hands, status, hints, difficulty } = gs;

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-2 sm:px-4">
      {/* 헤더 */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-slate-400 text-sm">
            {t.difficulty}: <span className="text-emerald-400 font-semibold">{t[difficulty]}</span>
            {" · "}{t.time}: <span className="text-emerald-400 font-mono font-semibold">{fmt(elapsed)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRules(true)}
            className="text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-2 transition-colors">?</button>
          <button onClick={() => { setShowDiff(true); setTimerOn(false); }}
            className="text-sm text-slate-300 hover:text-white border border-slate-700 rounded-lg px-3 py-2 transition-colors">
            {t.new_game}
          </button>
        </div>
      </div>

      {/* 상태 배너 */}
      {status === "correct" && (
        <div className="max-w-4xl mx-auto mb-4 bg-emerald-700 border border-emerald-500 rounded-xl px-4 py-3 text-white text-center font-semibold">
          🎉 {t.correct_message}
        </div>
      )}
      {status === "incorrect" && (
        <div className="max-w-4xl mx-auto mb-4 bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 text-red-200 text-center">
          {t.incorrect_message}
        </div>
      )}

      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-4 items-start">
        {/* ---- 게임 보드 ---- */}
        <div className="flex-1 w-full">
          {/*
            6열 그리드: [카드0][카드1][카드2][카드3][카드4][행족보]
            Row 0 (위): [col-span-5 빈칸][반대각선 우상단 -45°]
            Row 1-5 (카드행)
            Row 6 (아래): [열족보 0-4][주대각선 우하단 +45°]
          */}
          <div className="grid grid-cols-6 gap-1.5">

            {/* 반대각선 레이블 — 우상단, -45° 회전 (↗ 방향) */}
            <div className="col-span-5" />
            <div className="flex items-center justify-center py-1 min-h-10">
              <span className="-rotate-45 inline-block">
                <HandBadge hand={hands[11]} />
              </span>
            </div>

            {/* 카드 행 0–4 */}
            {[0,1,2,3,4].map(row => (
              <React.Fragment key={row}>
                {[0,1,2,3,4].map(col => {
                  const ds = display[row][col];
                  const card = board[row][col];
                  const ua = answers[row][col];
                  const full = ds.showSuit && ds.showRank;
                  const cc = checked?.[row][col];
                  const sWrong = !ds.showSuit && !!cc && !cc.suit;
                  const vWrong = !ds.showRank && !!cc && !cc.value;
                  const anyWrong = sWrong || vWrong;
                  const allRight = !!cc && !anyWrong && !full;

                  return (
                    <div key={`${row}-${col}`}
                      className={`aspect-[3/4] rounded-lg border-2 flex items-center justify-center transition-colors
                        ${full
                          ? "bg-white border-slate-200 shadow-sm"
                          : anyWrong
                          ? "bg-red-950 border-red-600"
                          : allRight
                          ? "bg-emerald-950 border-emerald-600"
                          : "bg-slate-700 border-slate-600"
                        }`}
                    >
                      {full ? (
                        <CardFace card={card} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
                          {/* Suit 행 */}
                          {ds.showSuit ? (
                            <span className={`text-xl leading-none font-bold ${SUIT_CLR[card.suit]}`}>
                              {SUIT_SYM[card.suit]}
                            </span>
                          ) : (
                            <select value={ua.suit}
                              onChange={e => handleChange(row, col, "suit", e.target.value)}
                              className={`w-full text-sm bg-slate-600 border ${sWrong ? "border-red-500" : "border-slate-500"} text-slate-200 rounded py-0.5 text-center focus:outline-none focus:border-emerald-400 cursor-pointer`}
                            >
                              <option value="">-</option>
                              {SUITS.map(s => <option key={s} value={s}>{SUIT_SYM[s]}</option>)}
                            </select>
                          )}
                          {/* Value 행 */}
                          {ds.showRank ? (
                            <span className={`text-base font-bold font-mono leading-none ${SUIT_CLR[card.suit]}`}>
                              {card.value}
                            </span>
                          ) : (
                            <select value={ua.value}
                              onChange={e => handleChange(row, col, "value", e.target.value)}
                              className={`w-full text-sm bg-slate-600 border ${vWrong ? "border-red-500" : "border-slate-500"} text-slate-200 rounded py-0.5 text-center focus:outline-none focus:border-emerald-400 cursor-pointer`}
                            >
                              <option value="">-</option>
                              {VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* 행 족보 레이블 */}
                <div className="flex items-center pl-1.5">
                  <HandBadge hand={hands[row]} />
                </div>
              </React.Fragment>
            ))}

            {/* 열 족보 레이블 + 주대각선 레이블 — 우하단, +45° 회전 (↘ 방향) */}
            {[0,1,2,3,4].map(col => (
              <div key={col} className="flex items-center justify-center pt-1.5">
                <HandBadge hand={hands[5+col]} />
              </div>
            ))}
            <div className="flex items-center justify-center pt-1.5 min-h-10">
              <span className="rotate-45 inline-block">
                <HandBadge hand={hands[10]} />
              </span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button onClick={handleCheck}
              className="flex-1 min-w-[80px] py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors">
              {t.check}
            </button>
            <button onClick={handleHint} disabled={hints >= MAX_HINTS}
              className="flex-1 min-w-[80px] py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors">
              {t.hint} ({MAX_HINTS - hints})
            </button>
            <button onClick={handleUndo} disabled={!gs.history.length}
              className="flex-1 min-w-[80px] py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-semibold rounded-xl transition-colors">
              {t.undo}
            </button>
            <button onClick={handleReveal}
              className="flex-1 min-w-[80px] py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors">
              {t.reveal_all}
            </button>
          </div>
        </div>

        {/* ---- 카드 트래커 ---- */}
        <div className="lg:w-52 w-full">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <h3 className="text-slate-300 text-sm font-semibold mb-3 uppercase tracking-wider">
              {t.card_tracker}
            </h3>
            <div className="space-y-2">
              {SUITS.map(suit => (
                <div key={suit}>
                  <div className={`text-sm font-bold mb-1 ${SUIT_CLR[suit]}`}>{SUIT_SYM[suit]}</div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {VALUES.map(value => {
                      const k = `${suit}|${value}`;
                      const cnt = usage[k] || 0;
                      const onBoard = board.some(row => row.some(c => c.suit===suit && c.value===value));
                      const fullyRevealed = onBoard && board.some((row,r) =>
                        row.some((c,col) =>
                          c.suit===suit && c.value===value &&
                          display[r][col].showSuit && display[r][col].showRank
                        )
                      );
                      return (
                        <div key={value} title={`${value}${SUIT_SYM[suit]}`}
                          className={`text-[11px] font-mono text-center rounded py-0.5
                            ${!onBoard ? "bg-slate-900 text-slate-600"
                              : cnt > 1 ? "bg-red-800 text-red-200"
                              : fullyRevealed ? "bg-slate-600 text-slate-300"
                              : cnt === 1 ? "bg-emerald-800 text-emerald-200"
                              : "bg-slate-700 text-slate-400"
                            }`}
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
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-600 inline-block" />{t.legend_revealed}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-800 inline-block" />{t.legend_entered}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-800 inline-block" />{t.legend_duplicate}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block" />{t.legend_not_used}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRules && <RulesModal t={t} onClose={() => setShowRules(false)} />}
    </div>
  );
}
