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
// 카드 (흰 배경): 스페이드/클럽 = 짙은 회색, 하트/다이아 = 빨강
const SUIT_CLR_LIGHT: Record<Suit, string> = { S: "text-slate-800", H: "text-red-600", D: "text-red-600", C: "text-slate-800" };
// 트래커 (어두운 배경): 스페이드/클럽 = 밝은 회색, 하트/다이아 = 밝은 빨강
const SUIT_CLR_DARK: Record<Suit, string> = { S: "text-slate-200", H: "text-red-400", D: "text-red-400", C: "text-slate-200" };
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
// BOARD GENERATION (원본 generateSpecialBoard 로직)
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
// UI: 족보 배지
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
    <span className={`${HAND_CLR[hand.rank] ?? HAND_CLR[0]} text-xs px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap`}>
      {hand.name}
    </span>
  );
}

// ============================================================
// UI: 카드 (가로형 레이아웃)
// ============================================================
function CardFace({ card }: { card: Card }) {
  const sc = SUIT_CLR_LIGHT[card.suit];
  return (
    <div className="flex items-center justify-center gap-1 select-none w-full h-full">
      <span className={`text-xl font-bold leading-none ${sc}`}>{SUIT_SYM[card.suit]}</span>
      <span className={`text-base font-bold font-mono leading-none ${sc}`}>{card.value}</span>
    </div>
  );
}

// ============================================================
// UI: 규칙 모달
// ============================================================
function RulesModal({ t, onClose }: { t: Translations; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-bold text-lg mb-4">{t.how_to_play}</h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">{t.rules_text}</p>
        <button onClick={onClose} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">OK</button>
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
  // 오답 시에만 셀 하이라이트. 정답 시에는 null (대안 정답 보호)
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

  // ---- 정답 확인 ----
  // 핵심: 족보 비교로 판정 (원본 방식) → 대안 정답도 인정
  // 정답 시: wrongCells = null (셀 하이라이트 없음)
  // 오답 시: wrongCells = 직접 비교 결과 (어떤 셀이 틀렸는지 힌트)
  const handleCheck = useCallback(() => {
    if (!gs) return;
    const { board, display, answers, hands } = gs;

    // 사용자 보드 구성
    const userBoard: (Card | null)[][] = Array.from({length:5}, (_,r) =>
      Array.from({length:5}, (_,c) => {
        const s = display[r][c].showSuit ? board[r][c].suit : answers[r][c].suit;
        const v = display[r][c].showRank ? board[r][c].value : answers[r][c].value;
        return (s && v) ? {suit: s as Suit, value: v as Value} : null;
      })
    );

    // 미완성 체크
    if (userBoard.some(row => row.some(c => c === null))) {
      setGs(prev => prev ? {...prev, status: "incorrect"} : prev);
      return;
    }
    const complete = userBoard as Card[][];

    // 중복 체크
    const seen = new Set<string>();
    for (let r=0; r<5; r++) for (let c=0; c<5; c++) {
      const k = `${complete[r][c].suit}|${complete[r][c].value}`;
      if (seen.has(k)) {
        setGs(prev => prev ? {...prev, status: "incorrect"} : prev);
        return;
      }
      seen.add(k);
    }

    // 족보 비교 (원본과 동일: 개별 카드가 아닌 족보로 판정)
    const userHands = allHands(complete);
    const match = userHands.every((h, i) => h.name === hands[i].name);

    if (match) {
      // 정답: 셀 하이라이트 없음 (대안 정답 보호)
      setWrongCells(null);
      setTimerOn(false);
      setGs(prev => prev ? {...prev, status: "correct"} : prev);
    } else {
      // 오답: 직접 비교로 틀린 셀 표시 (어느 셀을 고쳐야 하는지 힌트)
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

  // 카드 사용 현황
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
          <p className="text-slate-400 mb-8">{t.subtitle}</p>
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
    <div className="min-h-[100dvh] bg-slate-900 py-4 px-2 sm:px-4 flex flex-col">
      {/* 헤더 */}
      <div className="max-w-4xl mx-auto w-full mb-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">{t.title}</h1>
          <p className="text-slate-400 text-sm">
            {t.difficulty}: <span className="text-emerald-400 font-semibold">{t[difficulty]}</span>
            {" · "}{t.time}: <span className="text-emerald-400 font-mono font-semibold">{fmt(elapsed)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRules(true)}
            className="text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5 transition-colors">?</button>
          <button onClick={() => { setShowDiff(true); setTimerOn(false); }}
            className="text-sm text-slate-300 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5 transition-colors">
            {t.new_game}
          </button>
        </div>
      </div>

      {/* 상태 배너 */}
      {status === "correct" && (
        <div className="max-w-4xl mx-auto w-full mb-3 bg-emerald-700 border border-emerald-500 rounded-xl px-4 py-2.5 text-white text-center font-semibold flex-shrink-0">
          🎉 {t.correct_message}
        </div>
      )}
      {status === "incorrect" && (
        <div className="max-w-4xl mx-auto w-full mb-3 bg-red-900/60 border border-red-700 rounded-xl px-4 py-2.5 text-red-200 text-center flex-shrink-0">
          {t.incorrect_message}
        </div>
      )}

      {/* 본문: 보드 + 트래커 */}
      <div className="max-w-4xl mx-auto w-full flex flex-col lg:flex-row gap-3 flex-1 min-h-0">

        {/* ── 게임 보드 ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/*
            6열 그리드
            Row 0: [빈 칸 5개] [반대각선 우상단, -45°]
            Row 1-5: [카드 5개] [행족보]
            Row 6: [열족보 5개] [주대각선 우하단, +45°]
            카드: aspect-[3/2] (가로형, 높이 축소)
          */}
          <div className="grid grid-cols-6 gap-1">
            {/* 반대각선 — 우상단 */}
            <div className="col-span-5" />
            <div className="flex items-center justify-center h-8">
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
                  const wc = wrongCells?.[row][col];
                  const sWrong = !ds.showSuit && !!wc && !wc.suit;
                  const vWrong = !ds.showRank && !!wc && !wc.value;
                  const anyWrong = sWrong || vWrong;
                  const allRight = !!wc && !anyWrong && !full;

                  return (
                    <div key={`${row}-${col}`}
                      className={`aspect-[3/2] rounded-md border-2 flex items-center justify-center overflow-hidden
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
                        // 가로형 레이아웃: suit과 value를 나란히
                        <div className="flex items-center justify-center gap-0.5 px-1 w-full">
                          {ds.showSuit ? (
                            <span className={`text-lg font-bold leading-none flex-shrink-0 ${SUIT_CLR_LIGHT[card.suit]}`}>
                              {SUIT_SYM[card.suit]}
                            </span>
                          ) : (
                            <select value={ua.suit}
                              onChange={e => handleChange(row, col, "suit", e.target.value)}
                              className={`flex-1 min-w-0 text-sm bg-slate-600 border ${sWrong ? "border-red-500" : "border-slate-500"} text-slate-200 rounded py-1 text-center focus:outline-none focus:border-emerald-400 cursor-pointer`}
                            >
                              <option value="">?</option>
                              {SUITS.map(s => <option key={s} value={s}>{SUIT_SYM[s]}</option>)}
                            </select>
                          )}
                          {ds.showRank ? (
                            <span className={`text-sm font-bold font-mono leading-none flex-shrink-0 ${SUIT_CLR_LIGHT[card.suit]}`}>
                              {card.value}
                            </span>
                          ) : (
                            <select value={ua.value}
                              onChange={e => handleChange(row, col, "value", e.target.value)}
                              className={`flex-1 min-w-0 text-sm bg-slate-600 border ${vWrong ? "border-red-500" : "border-slate-500"} text-slate-200 rounded py-1 text-center focus:outline-none focus:border-emerald-400 cursor-pointer`}
                            >
                              <option value="">?</option>
                              {VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* 행 족보 */}
                <div className="flex items-center pl-1">
                  <HandBadge hand={hands[row]} />
                </div>
              </React.Fragment>
            ))}

            {/* 열 족보 + 주대각선 — 우하단 */}
            {[0,1,2,3,4].map(col => (
              <div key={col} className="flex items-center justify-center pt-1">
                <HandBadge hand={hands[5+col]} />
              </div>
            ))}
            <div className="flex items-center justify-center pt-1 h-8">
              <span className="rotate-45 inline-block">
                <HandBadge hand={hands[10]} />
              </span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-1.5 mt-3 flex-shrink-0">
            <button onClick={handleCheck}
              className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors">
              {t.check}
            </button>
            <button onClick={handleHint} disabled={hints >= MAX_HINTS}
              className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors">
              {t.hint} ({MAX_HINTS - hints})
            </button>
            <button onClick={handleUndo} disabled={!gs.history.length}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-sm font-bold rounded-xl transition-colors">
              {t.undo}
            </button>
            <button onClick={handleReveal}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold rounded-xl transition-colors">
              {t.reveal_all}
            </button>
          </div>
        </div>

        {/* ── 카드 트래커 (원본 스타일: 텍스트 + ✓/❗) ── */}
        <div className="lg:w-44 flex-shrink-0">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 h-full">
            <p className="text-slate-300 text-xs font-bold mb-2 uppercase tracking-wider">{t.card_tracker}</p>
            {/* 4열: ♠ ♥ ♦ ♣ 헤더 */}
            <div className="grid grid-cols-4 gap-x-1 gap-y-0.5">
              {SUITS.map(s => (
                <div key={s} className={`text-center text-base font-bold pb-1 border-b border-slate-600 ${SUIT_CLR_DARK[s]}`}>
                  {SUIT_SYM[s]}
                </div>
              ))}
              {/* 7행 × 4열 카드 셀 */}
              {VALUES.map(value =>
                SUITS.map(suit => {
                  const k = `${suit}|${value}`;
                  const cnt = usage[k] || 0;
                  const onBoard = board.some(row => row.some(c => c.suit===suit && c.value===value));
                  const fullyShown = onBoard && board.some((row,r) =>
                    row.some((c,col) => c.suit===suit && c.value===value && display[r][col].showSuit && display[r][col].showRank)
                  );

                  // 표시 상태 결정
                  const suitClr = SUIT_CLR_DARK[suit];
                  let label: string;
                  let labelClr: string;
                  let statusIcon: string;
                  let statusClr: string;

                  if (!onBoard) {
                    // 보드에 없는 카드 (28 중 3장)
                    label = value === "10" ? "T" : value;
                    labelClr = "text-slate-600";
                    statusIcon = "";
                    statusClr = "";
                  } else if (cnt > 1) {
                    // 중복
                    label = value === "10" ? "T" : value;
                    labelClr = suitClr;
                    statusIcon = "!";
                    statusClr = "text-red-400 font-black";
                  } else if (cnt === 1) {
                    // 1회 사용 (공개됐거나 유저 입력)
                    label = value === "10" ? "T" : value;
                    labelClr = fullyShown ? "text-slate-500" : suitClr;
                    statusIcon = "✓";
                    statusClr = fullyShown ? "text-slate-500" : "text-emerald-400";
                  } else {
                    // 미확인
                    label = value === "10" ? "T" : value;
                    labelClr = onBoard ? suitClr + " opacity-50" : "text-slate-600";
                    statusIcon = "";
                    statusClr = "";
                  }

                  return (
                    <div key={`${suit}|${value}`}
                      className="flex items-center justify-center gap-0.5 py-0.5">
                      <span className={`text-sm font-bold font-mono leading-none ${labelClr}`}>{label}</span>
                      {statusIcon && (
                        <span className={`text-xs leading-none ${statusClr}`}>{statusIcon}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {/* 범례 */}
            <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-500 space-y-0.5">
              <div><span className="text-emerald-400">✓</span> {t.legend_entered}</div>
              <div><span className="text-red-400 font-black">!</span> {t.legend_duplicate}</div>
              <div><span className="text-slate-500">✓</span> {t.legend_revealed}</div>
            </div>
          </div>
        </div>
      </div>

      {showRules && <RulesModal t={t} onClose={() => setShowRules(false)} />}
    </div>
  );
}
