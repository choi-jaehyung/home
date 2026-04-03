"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// TYPES
// ============================================================
type Suit = "S" | "H" | "D" | "C";
type Value = "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type Difficulty = "easy" | "medium" | "hard";

interface Card { suit: Suit; value: Value; }
interface CellDisplay { showSuit: boolean; showRank: boolean; }
interface UserCell { suit: Suit | ""; value: Value | ""; }
interface HandResult { name: string; rank: number; }

interface GameState {
  board: Card[][];
  display: CellDisplay[][];
  answers: UserCell[][];
  hands: HandResult[];
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
const SUIT_CLR: Record<Suit, string> = { S: "text-slate-800", H: "text-red-600", D: "text-red-600", C: "text-slate-800" };
const HIDDEN: Record<Difficulty, number> = { easy: 16, medium: 19, hard: 22 };
const MAX_HINTS = 3;

// ============================================================
// POKER HAND EVALUATION
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

    const avail = new Map<string, Card>();
    for (const c of fullDeck) avail.set(`${c.suit}|${c.value}`, c);

    const flushCols = shuffle([0,1,2,3,4]).slice(0, 2);
    const flushSuits = shuffle([...SUITS]).slice(0, 2);
    let ok = true;

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

    const straightRows = shuffle([0,1,2,3,4]).slice(0, 3);
    let deckArr = Array.from(avail.values());

    for (const r of straightRows) {
      const existing = board[r].filter((c): c is Card => c !== null);
      const empty = 5 - existing.length;
      const start = Math.floor(Math.random() * (VALUES.length - 4));
      const straight = VALUES.slice(start, start + 5);
      const required = new Set(straight);
      existing.forEach(c => required.delete(c.value));
      if (required.size !== empty) { ok = false; break; }

      const toPlace: Card[] = [];
      for (const value of required) {
        const idx = deckArr.findIndex(c => c.value === value);
        if (idx !== -1) { toPlace.push(deckArr.splice(idx, 1)[0]); }
        else { ok = false; break; }
      }
      if (!ok || toPlace.length !== empty) { ok = false; break; }
      const emptyIdxs = board[r].map((c, i) => c === null ? i : -1).filter(i => i !== -1);
      emptyIdxs.forEach((idx, i) => { board[r][idx] = toPlace[i]; });
    }
    if (!ok) continue;

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
    let fc = 0, sc = 0;
    for (let c = 0; c < 5; c++) if (evalHand(final.map(row => row[c])).name.includes("Flush")) fc++;
    for (let r = 0; r < 5; r++) if (evalHand(final[r]).name.includes("Straight")) sc++;
    if (fc >= 2 && sc >= 3) return Math.random() < 0.5 ? transpose(final) : final;
  }
  return fallbackBoard();
}

// ============================================================
// DISPLAY STATE (suit/rank 독립 노출, 50 슬롯)
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
// UI: 족보 셀 (카드와 동일한 크기)
// ============================================================
// 행/열 족보: bg-yellow-200 text-yellow-800
// 대각선 족보: bg-yellow-400 text-yellow-900

// ============================================================
// UI: 규칙 모달
// ============================================================
function RulesModal({ t, onClose }: { t: Translations; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-gray-900 font-bold text-lg mb-4">{t.how_to_play}</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">{t.rules_text}</p>
        <button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors font-medium">OK</button>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================
export default function CrossPokerGame({ translations: t }: { translations: Translations }) {
  const [gs, setGs] = useState<GameState | null>(null);
  const [showDiff, setShowDiff] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [wrongCells, setWrongCells] = useState<{ suit: boolean; value: boolean }[][] | null>(null);
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
    setWrongCells(null);
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
    setWrongCells(null);
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
    setWrongCells(null);
  }, []);

  const handleHint = useCallback(() => {
    setGs(prev => {
      if (!prev || prev.hints >= MAX_HINTS) return prev;
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
    setWrongCells(null);
  }, []);

  const handleCheck = useCallback(() => {
    if (!gs) return;
    const { board, display, answers, hands } = gs;

    const userBoard: (Card | null)[][] = Array.from({length:5}, (_,r) =>
      Array.from({length:5}, (_,c) => {
        const s = display[r][c].showSuit ? board[r][c].suit : answers[r][c].suit;
        const v = display[r][c].showRank ? board[r][c].value : answers[r][c].value;
        return (s && v) ? {suit: s as Suit, value: v as Value} : null;
      })
    );

    if (userBoard.some(row => row.some(c => c === null))) {
      setGs(prev => prev ? {...prev, status: "incorrect"} : prev);
      return;
    }
    const complete = userBoard as Card[][];

    const seen = new Set<string>();
    for (let r=0; r<5; r++) for (let c=0; c<5; c++) {
      const k = `${complete[r][c].suit}|${complete[r][c].value}`;
      if (seen.has(k)) { setGs(prev => prev ? {...prev, status: "incorrect"} : prev); return; }
      seen.add(k);
    }

    const userHands = allHands(complete);
    const match = userHands.every((h, i) => h.name === hands[i].name);

    if (match) {
      setWrongCells(null);
      setTimerOn(false);
      setGs(prev => prev ? {...prev, status: "correct"} : prev);
    } else {
      const wc = Array.from({length:5}, (_,r) =>
        Array.from({length:5}, (_,c) => ({
          suit: display[r][c].showSuit || answers[r][c].suit === board[r][c].suit,
          value: display[r][c].showRank || answers[r][c].value === board[r][c].value,
        }))
      );
      setWrongCells(wc);
      setGs(prev => prev ? {...prev, status: "incorrect"} : prev);
    }
  }, [gs]);

  const handleReveal = useCallback(() => {
    if (!gs) return;
    const { board, display, answers } = gs;
    const wc = Array.from({length:5}, (_,r) =>
      Array.from({length:5}, (_,c) => ({
        suit: display[r][c].showSuit || answers[r][c].suit === board[r][c].suit,
        value: display[r][c].showRank || answers[r][c].value === board[r][c].value,
      }))
    );
    setWrongCells(wc);
    setTimerOn(false);
    setGs(prev => prev ? {
      ...prev,
      display: Array.from({length:5}, () => Array.from({length:5}, () => ({showSuit:true, showRank:true}))),
      status: "idle",
    } : prev);
  }, [gs]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="text-5xl mb-4">🃏</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-500 mb-8">{t.subtitle}</p>
          <p className="text-gray-700 font-semibold mb-4">{t.difficulty_select}</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["easy","medium","hard"] as Difficulty[]).map(d => (
              <button key={d} onClick={() => startGame(d)}
                className="py-4 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all">
                <div className="text-sm text-gray-400 mb-1">{d==="easy"?"16":d==="medium"?"19":"22"}</div>
                <div className="text-base">{t[d]}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setShowRules(true)} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            {t.how_to_play} →
          </button>
        </div>
        {showRules && <RulesModal t={t} onClose={() => setShowRules(false)} />}
      </div>
    );
  }

  const { board, display, answers, hands, status, hints, difficulty } = gs;

  // 카드 셀 border 색상 결정 헬퍼
  const getCellBorder = (row: number, col: number) => {
    const ds = display[row][col];
    const full = ds.showSuit && ds.showRank;
    const wc = wrongCells?.[row][col];
    const sWrong = !ds.showSuit && !!wc && !wc.suit;
    const vWrong = !ds.showRank && !!wc && !wc.value;
    const anyWrong = sWrong || vWrong;
    const allRight = !!wc && !anyWrong && !full;
    if (anyWrong) return "border-red-500";
    if (allRight) return "border-emerald-500";
    return "border-transparent";
  };

  // 공개된 select의 색상 클래스
  const revealedSuitCls = (suit: Suit) =>
    `w-full flex-1 text-sm bg-gray-200 cursor-not-allowed rounded border-0 text-center appearance-none font-bold ${SUIT_CLR[suit]}`;
  const revealedValCls = (suit: Suit) =>
    `w-full flex-1 text-sm bg-gray-200 cursor-not-allowed rounded border-0 text-center appearance-none font-bold ${SUIT_CLR[suit]}`;

  return (
    <div className="min-h-[100dvh] bg-gray-50 py-3 px-2 sm:px-4 flex flex-col">

      {/* 상태 배너 */}
      {status === "correct" && (
        <div className="max-w-5xl mx-auto w-full mb-2 bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-2 text-emerald-800 text-center font-semibold flex-shrink-0">
          🎉 {t.correct_message}
        </div>
      )}
      {status === "incorrect" && (
        <div className="max-w-5xl mx-auto w-full mb-2 bg-red-50 border border-red-300 rounded-xl px-4 py-2 text-red-700 text-center flex-shrink-0">
          {t.incorrect_message}
        </div>
      )}

      {/* 본문: 보드 + 트래커 */}
      <div className="max-w-5xl mx-auto w-full flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

        {/* ── 게임 보드 ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 보드 컨테이너 */}
          <div className="bg-gray-300 p-2 rounded-lg shadow-xl">

            {/* 타이틀 행: col-span-5 타이틀 + 반대각선 족보 */}
            <div className="grid grid-cols-6 gap-1 mb-1">
              <div className="col-span-5 flex flex-col justify-center px-2 h-14">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight" style={{fontFamily:"Georgia, serif"}}>{t.title}</h1>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mt-0.5">
                  <span>{t.difficulty}: <span className="font-semibold">{t[difficulty]}</span></span>
                  <span>·</span>
                  <span className="font-mono font-semibold">{fmt(elapsed)}</span>
                  <button onClick={() => setShowRules(true)} className="ml-1 h-5 w-5 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-colors">?</button>
                </div>
              </div>
              <div className="h-14 rounded-lg shadow-sm bg-yellow-400 text-yellow-900 font-bold flex items-center justify-center text-center overflow-hidden leading-tight">
                <span className="-rotate-45 inline-block text-xs md:text-sm px-0.5">{hands[11].name}</span>
              </div>
            </div>

            {/* 카드 행 0–4 */}
            {[0,1,2,3,4].map(row => (
              <div key={row} className="grid grid-cols-6 gap-1 mb-1">
                {[0,1,2,3,4].map(col => {
                  const ds = display[row][col];
                  const card = board[row][col];
                  const ua = answers[row][col];
                  const full = ds.showSuit && ds.showRank;
                  const wc = wrongCells?.[row][col];
                  const sWrong = !ds.showSuit && !!wc && !wc.suit;
                  const vWrong = !ds.showRank && !!wc && !wc.value;
                  const borderCls = getCellBorder(row, col);

                  return (
                    <div key={`${row}-${col}`}
                      className={`aspect-square bg-white flex flex-col gap-0.5 p-0.5 border-4 rounded-lg shadow-sm overflow-hidden ${borderCls}`}
                    >
                      {full ? (
                        <>
                          <select disabled value={card.suit}
                            className={revealedSuitCls(card.suit)}
                            style={{textAlignLast:"center"}}
                          >
                            {SUITS.map(s => <option key={s} value={s}>{SUIT_SYM[s]}</option>)}
                          </select>
                          <select disabled value={card.value}
                            className={revealedValCls(card.suit)}
                            style={{textAlignLast:"center"}}
                          >
                            {VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </>
                      ) : (
                        <>
                          {ds.showSuit ? (
                            <select disabled value={card.suit}
                              className={revealedSuitCls(card.suit)}
                              style={{textAlignLast:"center"}}
                            >
                              {SUITS.map(s => <option key={s} value={s}>{SUIT_SYM[s]}</option>)}
                            </select>
                          ) : (
                            <select value={ua.suit}
                              onChange={e => handleChange(row, col, "suit", e.target.value)}
                              style={{textAlignLast:"center"}}
                              className={`w-full flex-1 text-sm bg-white border rounded text-center appearance-none cursor-pointer focus:outline-none focus:border-blue-400 font-bold
                                ${ua.suit === "" ? "text-blue-600" : (ua.suit === "H" || ua.suit === "D") ? "text-red-600" : "text-gray-900"}
                                ${sWrong ? "border-red-400" : "border-gray-300"}`}
                            >
                              <option value="">?</option>
                              {SUITS.map(s => <option key={s} value={s}>{SUIT_SYM[s]}</option>)}
                            </select>
                          )}
                          {ds.showRank ? (
                            <select disabled value={card.value}
                              className={revealedValCls(card.suit)}
                              style={{textAlignLast:"center"}}
                            >
                              {VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          ) : (
                            <select value={ua.value}
                              onChange={e => handleChange(row, col, "value", e.target.value)}
                              style={{textAlignLast:"center"}}
                              className={`w-full flex-1 text-sm bg-white border rounded text-center appearance-none cursor-pointer focus:outline-none focus:border-blue-400 font-bold
                                ${ua.value === "" ? "text-blue-600" : (ua.suit === "H" || ua.suit === "D") ? "text-red-600" : "text-gray-900"}
                                ${vWrong ? "border-red-400" : "border-gray-300"}`}
                            >
                              <option value="">?</option>
                              {VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                {/* 행 족보 셀 */}
                <div className="aspect-square rounded-lg shadow-sm bg-yellow-200 text-yellow-800 font-bold flex items-center justify-center text-center overflow-hidden leading-tight">
                  <span className="text-xs md:text-sm px-0.5">{hands[row].name}</span>
                </div>
              </div>
            ))}

            {/* 열 족보 행 + 주대각선 */}
            <div className="grid grid-cols-6 gap-1">
              {[0,1,2,3,4].map(col => (
                <div key={col} className="aspect-square rounded-lg shadow-sm bg-yellow-200 text-yellow-800 font-bold flex items-center justify-center text-center overflow-hidden leading-tight">
                  <span className="text-xs md:text-sm px-0.5">{hands[5+col].name}</span>
                </div>
              ))}
              <div className="aspect-square rounded-lg shadow-sm bg-yellow-400 text-yellow-900 font-bold flex items-center justify-center text-center overflow-hidden leading-tight">
                <span className="rotate-45 inline-block text-xs md:text-sm px-0.5">{hands[10].name}</span>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 mt-2 flex-shrink-0">
            <button onClick={() => { setShowDiff(true); setTimerOn(false); }}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors">
              {t.new_game}
            </button>
            <button onClick={handleUndo} disabled={!gs.history.length}
              className="flex-1 py-2 bg-gray-500 hover:bg-gray-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors">
              {t.undo}
            </button>
            <button onClick={handleHint} disabled={hints >= MAX_HINTS}
              className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors">
              {t.hint} ({MAX_HINTS - hints})
            </button>
            <button onClick={handleCheck}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors">
              {t.check}
            </button>
            <button onClick={handleReveal}
              className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-colors">
              {t.reveal_all}
            </button>
          </div>
        </div>

        {/* ── 카드 트래커 ── */}
        <div className="bg-gray-200 p-3 rounded-lg shadow-lg w-56 flex-shrink-0 self-start">
          <p className="text-gray-600 text-xs font-bold mb-2 uppercase tracking-wider">{t.card_tracker}</p>

          {/* 4열 그리드 */}
          <div className="grid grid-cols-4 gap-1">
            {VALUES.map(value =>
              SUITS.map(suit => {
                const k = `${suit}|${value}`;
                const cnt = usage[k] || 0;
                const onBoard = board.some(row => row.some(c => c.suit===suit && c.value===value));
                const fullyShown = onBoard && board.some((row,r) =>
                  row.some((c,col) => c.suit===suit && c.value===value && display[r][col].showSuit && display[r][col].showRank)
                );

                let icon: React.ReactNode = null;
                let labelCls = "";

                if (!onBoard) {
                  labelCls = "text-gray-300";
                } else if (cnt > 1) {
                  labelCls = `${SUIT_CLR[suit]} font-bold`;
                  icon = <span className="text-red-500 font-black text-xs leading-none">❗</span>;
                } else if (cnt === 1) {
                  labelCls = SUIT_CLR[suit];
                  icon = <span className={`text-xs leading-none ${fullyShown ? "text-blue-400" : "text-green-500"}`}>✓</span>;
                } else {
                  labelCls = `${SUIT_CLR[suit]} opacity-40`;
                }

                return (
                  <div key={`${suit}|${value}`}
                    className="bg-white rounded px-1.5 py-1 flex justify-between items-center text-sm shadow-sm"
                  >
                    <span className={`text-xs font-mono leading-none ${labelCls}`}>
                      {SUIT_SYM[suit]}{value}
                    </span>
                    {icon ? icon : <span className="w-3" />}
                  </div>
                );
              })
            )}
          </div>

          {/* 범례 */}
          <div className="mt-2 pt-1.5 border-t border-gray-300 text-xs text-gray-500 space-y-0.5">
            <div><span className="text-green-500">✓</span> {t.legend_entered}</div>
            <div><span className="text-red-500 font-black">❗</span> {t.legend_duplicate}</div>
            <div><span className="text-blue-400">✓</span> {t.legend_revealed}</div>
          </div>
        </div>
      </div>

      {showRules && <RulesModal t={t} onClose={() => setShowRules(false)} />}
    </div>
  );
}
