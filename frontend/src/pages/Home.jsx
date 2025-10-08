import React, { useState, useRef, useEffect } from "react";
import "../styles/Home.css";
import * as htmlToImage from 'html-to-image';

// (Dosyanın geri kalanı öncekiyle aynı, sadece handleTouchStart fonksiyonu ve buton JSX'leri değişti)
// ... Diğer importlar, sabitler ve fonksiyonlar burada ...
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const MOBILE_PITCH = { width: 350, height: 450, pad: 15 };
const DESKTOP_PITCH = { width: 1200, height: 800, pad: 40 };
const PITCH = isMobile ? MOBILE_PITCH : DESKTOP_PITCH;
const PLAYER_SIZE = isMobile ? 32 : 56;
const TRAIL_MIN_DIST = isMobile ? 5 : 10;
const Y_OFFSET = PLAYER_SIZE / 2;
const frameRate = 15;

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ... horizontalFormations ve verticalFormations verileri burada (değişiklik yok) ...
const horizontalFormations = {
  "4-4-2": [
    { id: 1, name: "1", x: 60, y: 400, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 2, name: "2", x: 250, y: 650, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 3, name: "3", x: 280, y: 300, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 4, name: "4", x: 280, y: 500, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 5, name: "5", x: 250, y: 150, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 6, name: "6", x: 450, y: 650, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 7, name: "7", x: 480, y: 400, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 8, name: "8", x: 450, y: 150, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 9, name: "9", x: 750, y: 300, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 10, name: "10", x: 750, y: 500, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 11, name: "11", x: 580, y: 400, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
  ],
  "4-3-3": [
    { id: 1, name: "1", x: 60, y: 400, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 2, name: "2", x: 250, y: 650, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 3, name: "3", x: 300, y: 300, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 4, name: "4", x: 300, y: 500, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 5, name: "5", x: 250, y: 150, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 6, name: "6", x: 500, y: 250, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 7, name: "7", x: 550, y: 400, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 8, name: "8", x: 500, y: 550, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 9, name: "9", x: 800, y: 400, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 10, name: "10", x: 750, y: 150, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 11, name: "11", x: 750, y: 650, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
  ],
  "3-5-2": [
    { id: 1, name: "1", x: 60, y: 400, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 2, name: "2", x: 300, y: 250, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 3, name: "3", x: 350, y: 400, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 4, name: "4", x: 300, y: 550, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 5, name: "5", x: 450, y: 700, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 6, name: "6", x: 550, y: 550, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 7, name: "7", x: 600, y: 400, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 8, name: "8", x: 550, y: 250, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 9, name: "9", x: 450, y: 100, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 10, name: "10", x: 800, y: 300, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    { id: 11, name: "11", x: 800, y: 500, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
  ],
};
const verticalFormations = {
    "4-4-2": [
        { id: 1, name: "1", x: 159, y: 60, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 2, name: "2", x: 275, y: 150, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 3, name: "3", x: 205, y: 140, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 4, name: "4", x: 115, y: 140, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 5, name: "5", x: 45, y: 150, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 6, name: "6", x: 275, y: 250, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 7, name: "7", x: 205, y: 240, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 8, name: "8", x: 45, y: 250, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 9, name: "9", x: 125, y: 340, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 10, name: "10", x: 195, y: 340, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 11, name: "11", x: 115, y: 240, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    ],
    "4-3-3": [
        { id: 1, name: "1", x: 159, y: 60, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 2, name: "2", x: 275, y: 150, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 3, name: "3", x: 205, y: 140, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 4, name: "4", x: 115, y: 140, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 5, name: "5", x: 45, y: 150, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 6, name: "6", x: 245, y: 235, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 7, name: "7", x: 159, y: 225, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 8, name: "8", x: 75, y: 235, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 9, name: "9", x: 159, y: 340, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 10, name: "10", x: 260, y: 330, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 11, name: "11", x: 60, y: 330, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    ],
    "3-5-2": [
        { id: 1, name: "1", x: 159, y: 60, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 2, name: "2", x: 250, y: 130, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 3, name: "3", x: 159, y: 125, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 4, name: "4", x: 70, y: 130, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 5, name: "5", x: 290, y: 225, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 6, name: "6", x: 215, y: 235, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 7, name: "7", x: 159, y: 225, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 8, name: "8", x: 105, y: 235, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 9, name: "9", x: 30, y: 225, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 10, name: "10", x: 125, y: 340, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
        { id: 11, name: "11", x: 195, y: 340, team: "A", trail: [], cards: { yellow: false, red: false }, goals: 0 },
    ],
};
const formations = isMobile ? verticalFormations : horizontalFormations;
const createOpponentTeam = (baseFormation) => {
  const players = baseFormation.map(p => ({ ...p })).filter(p => p.team === "A");
  return players.map(p => ({
    ...p,
    id: p.id + 11,
    team: "B",
    x: isMobile ? p.x : PITCH.width - (p.x + PLAYER_SIZE),
    y: isMobile ? PITCH.height - (p.y + PLAYER_SIZE) : p.y,
    trail: [],
  }));
};
const defaultBall = {
  x: PITCH.width / 2,
  y: PITCH.height / 2,
  r: isMobile ? 8 : 12,
  trail: []
};
const defaultPlayers11 = formations["4-4-2"].map(p => ({ ...p, y: p.y - Y_OFFSET }));
const defaultPlayers22 = [...defaultPlayers11, ...createOpponentTeam(defaultPlayers11)];


export default function Home() {
  const [players, setPlayers] = useState(defaultPlayers11);
  const [use22, setUse22] = useState(false);
  const [trailEnabled, setTrailEnabled] = useState(true);
  const [teamColorsSwapped, setTeamColorsSwapped] = useState(false);
  const [ball, setBall] = useState(defaultBall);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentFormation, setCurrentFormation] = useState("4-4-2");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const pitchRef = useRef(null);
  const draggingRef = useRef({
    active: false, type: null, id: null, offsetX: 0, offsetY: 0,
  });

  // YENİ: Mobil çift dokunma (double tap) için son dokunma zamanını saklar
  const lastTapRef = useRef({});

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoURL, setRecordedVideoURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const pitchCanvasRef = useRef(null);


    // GÜNCELLENDİ: Mobil için çift dokunma (double tap) mantığı eklendi
    const handleTouchStart = (e, type, id = null) => {
        // e.preventDefault(); // Sürükleme ve tıklama çakışmasını önlemek için bazen kapatılabilir
        if (!pitchRef.current) return;
        const touch = e.touches[0];
        const rect = pitchRef.current.getBoundingClientRect();
        const px = touch.clientX - rect.left;
        const py = touch.clientY - rect.top;

        if (type === "player") {
            const now = Date.now();
            const lastTapTime = lastTapRef.current[id] || 0;
            const tapDelay = 300; // ms cinsinden çift dokunma aralığı

            if (now - lastTapTime < tapDelay) {
                // Bu bir çift dokunma, düzenleme modalını aç
                openEditModal(id);
                // Çift dokunma sonrası sürüklemeyi engellemek için referansı temizle
                lastTapRef.current[id] = 0;
                e.preventDefault(); // Modal açılırken sayfanın kaymasını engelle
                return;
            } else {
                // Bu ilk dokunma, zamanını kaydet
                lastTapRef.current[id] = now;
            }
        }

        e.preventDefault(); // Sürükleme için preventDefault'u burada çağır

        if (isDrawing) {
            setCurrentLine([{ x: px, y: py }]);
            draggingRef.current = { active: true, type: 'drawing', id: null, offsetX: 0, offsetY: 0 };
            return;
        }

        if (type === "player") {
            const p = players.find((pl) => pl.id === id);
            if (!p) return;
            const offsetX = px - p.x;
            const offsetY = py - p.y;
            draggingRef.current = { active: true, type, id, offsetX, offsetY };
            if (trailEnabled) {
                setPlayers((prev) =>
                    prev.map((pl) =>
                        pl.id === id ? { ...pl, trail: [...pl.trail, { x: pl.x + PLAYER_SIZE / 2, y: pl.y + PLAYER_SIZE / 2 }] } : pl
                    )
                );
            }
        } else if (type === "ball") {
            const offsetX = px - ball.x;
            const offsetY = py - ball.y;
            draggingRef.current = { active: true, type, id: null, offsetX, offsetY };
            if (trailEnabled) {
                setBall((b) => ({ ...b, trail: [...b.trail, { x: b.x, y: b.y }] }));
            }
        }
    };

    // handleTouchMove, handleTouchEnd ve diğer fonksiyonlar aynı kalıyor...
    // ... (Diğer tüm fonksiyonlar - handleTouchMove, clampPos, applyFormation, vb. - değişiklik olmadan burada yer alıyor)
    const handleTouchMove = (e) => {
    if (!draggingRef.current.active || !pitchRef.current) return;
    const touch = e.touches[0];
    const rect = pitchRef.current.getBoundingClientRect();
    const px = touch.clientX - rect.left;
    const py = touch.clientY - rect.top;

    if (isDrawing && currentLine) {
      setCurrentLine(prev => {
        if (prev && prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          if (distance(lastPoint, { x: px, y: py }) > 2) {
            return [...prev, { x: px, y: py }];
          }
        }
        return prev || [{ x: px, y: py }];
      });
      return;
    }

    if (draggingRef.current.type === "player") {
      const { id, offsetX, offsetY } = draggingRef.current;
      let nx = px - offsetX;
      let ny = py - offsetY;
      ({ x: nx, y: ny } = clampPos(nx, ny));

      setPlayers((prev) =>
        prev.map((pl) => {
          if (pl.id !== id) return pl;
          const cx = nx + PLAYER_SIZE / 2;
          const cy = ny + PLAYER_SIZE / 2;
          const last = pl.trail.length ? pl.trail[pl.trail.length - 1] : null;

          let newTrail = pl.trail;
          if (trailEnabled && (!last || distance(last, { x: cx, y: cy }) >= TRAIL_MIN_DIST)) {
            newTrail = [...pl.trail, { x: cx, y: cy }];
          }
          return { ...pl, x: nx, y: ny, trail: newTrail };
        })
      );
    } else if (draggingRef.current.type === "ball") {
      const { offsetX, offsetY } = draggingRef.current;
      let nx = px - offsetX;
      let ny = py - offsetY;
      const minX = PITCH.pad + ball.r;
      const minY = PITCH.pad + ball.r;
      const maxX = PITCH.width - PITCH.pad - ball.r;
      const maxY = PITCH.height - PITCH.pad - ball.r;
      nx = Math.max(minX, Math.min(maxX, nx));
      ny = Math.max(minY, Math.min(maxY, ny));

      setBall((b) => {
        const last = b.trail.length ? b.trail[b.trail.length - 1] : null;
        const cx = nx;
        const cy = ny;

        let newTrail = b.trail;
        if (trailEnabled && (!last || distance(last, { x: cx, y: cy }) >= TRAIL_MIN_DIST)) {
          newTrail = [...b.trail, { x: cx, y: cy }];
        }
        return { ...b, x: nx, y: ny, trail: newTrail };
      });
    }
  };
    const handleTouchEnd = () => {
        if (isDrawing && currentLine && currentLine.length > 1) {
          setDrawnLines(prev => [...prev, { id: Date.now(), points: currentLine }]);
        }
        setCurrentLine(null);

        // Sürükleme bittiğinde, her ihtimale karşı aktif referansı sıfırla
        if (draggingRef.current.active) {
            draggingRef.current = { active: false, type: null, id: null, offsetX: 0, offsetY: 0 };
        }
    };
    const clampPos = (x, y) => {
        const minX = PITCH.pad;
        const minY = PITCH.pad;
        const maxX = PITCH.width - PITCH.pad - PLAYER_SIZE;
        const maxY = PITCH.height - PITCH.pad - PLAYER_SIZE;
        return { x: Math.max(minX, Math.min(maxX, x)), y: Math.max(minY, Math.min(maxY, y)) };
    };
    const applyFormation = (name) => {
        const baseFormation = formations[name];
        if (!baseFormation) return;

        setCurrentFormation(name);
        const existingPlayerMap = players.reduce((map, p) => {
        map[p.id] = { cards: p.cards, goals: p.goals };
        return map;
        }, {});

        const centeredBaseFormation = baseFormation.map(p => ({
            ...p,
            y: p.y - Y_OFFSET,
        }));

        let newPlayers = centeredBaseFormation.map(p => {
        const existing = existingPlayerMap[p.id];
        return {
            ...p,
            trail: [],
            cards: existing ? existing.cards : { yellow: false, red: false },
            goals: existing ? existing.goals : 0,
        };
        });

        if (use22) {
        const opponentPlayers = createOpponentTeam(centeredBaseFormation);
        const opponentPlayersWithData = opponentPlayers.map(p => {
            const existing = existingPlayerMap[p.id];
            return {
            ...p,
            cards: existing ? existing.cards : { yellow: false, red: false },
            goals: existing ? existing.goals : 0,
            };
        });
        newPlayers = [...newPlayers, ...opponentPlayersWithData];
        }

        setPlayers(newPlayers);
        setBall(defaultBall);
    };
    const toggleTeamCount = (to22) => {
        setUse22(to22);
    };
    useEffect(() => {
        applyFormation(currentFormation);
    }, [use22]);
    const startDrawing = () => {
        setTrailEnabled(false);
        setIsDrawing(true);
    };
    const stopDrawing = () => {
        setIsDrawing(false);
    };
    const clearDrawings = () => {
        setDrawnLines([]);
    };
    const handlePointerDown = (e, type, id = null) => {
        e.preventDefault();
        const rect = pitchRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        if (isDrawing) {
            setCurrentLine([{ x: px, y: py }]);
            draggingRef.current = { active: true, type: 'drawing', id: null, offsetX: 0, offsetY: 0 };
            return;
        }
        if (type === "player") {
        const p = players.find((pl) => pl.id === id);
        if (!p) return;
        const offsetX = px - p.x;
        const offsetY = py - p.y;
        draggingRef.current = { active: true, type, id, offsetX, offsetY };
        if (trailEnabled) {
            setPlayers((prev) =>
            prev.map((pl) =>
                pl.id === id ? { ...pl, trail: [...pl.trail, { x: pl.x + PLAYER_SIZE / 2, y: pl.y + PLAYER_SIZE / 2 }] } : pl
            )
            );
        }
        } else if (type === "ball") {
        const offsetX = px - ball.x;
        const offsetY = py - ball.y;
        draggingRef.current = { active: true, type, id: null, offsetX, offsetY };
        if (trailEnabled) {
            setBall((b) => ({ ...b, trail: [...b.trail, { x: b.x, y: b.y }] }));
        }
        }
    };
    const handlePointerMove = (e) => {
        if (!draggingRef.current.active) return;
        const rect = pitchRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        if (isDrawing && currentLine) {
            setCurrentLine(prev => {
                if (prev.length > 0) {
                    const lastPoint = prev[prev.length - 1];
                    if (distance(lastPoint, { x: px, y: py }) > 2) {
                        return [...prev, { x: px, y: py }];
                    }
                    return prev;
                }
                return [{ x: px, y: py }];
            });
            return;
        }


        if (draggingRef.current.type === "player") {
        const { id, offsetX, offsetY } = draggingRef.current;
        let nx = px - offsetX;
        let ny = py - offsetY;
        ({ x: nx, y: ny } = clampPos(nx, ny));

        setPlayers((prev) =>
            prev.map((pl) => {
            if (pl.id !== id) return pl;
            const cx = nx + PLAYER_SIZE / 2;
            const cy = ny + PLAYER_SIZE / 2;
            const last = pl.trail.length ? pl.trail[pl.trail.length - 1] : null;

            let newTrail = pl.trail;
            if (trailEnabled && (!last || distance(last, { x: cx, y: cy }) >= TRAIL_MIN_DIST)) {
                newTrail = [...pl.trail, { x: cx, y: cy }];
            }
            return { ...pl, x: nx, y: ny, trail: newTrail };
            })
        );
        } else if (draggingRef.current.type === "ball") {
        const { offsetX, offsetY } = draggingRef.current;
        let nx = px - offsetX;
        let ny = py - offsetY;
        const minX = PITCH.pad + ball.r;
        const minY = PITCH.pad + ball.r;
        const maxX = PITCH.width - PITCH.pad - ball.r;
        const maxY = PITCH.height - PITCH.pad - ball.r;
        nx = Math.max(minX, Math.min(maxX, nx));
        ny = Math.max(minY, Math.min(maxY, ny));

        setBall((b) => {
            const last = b.trail.length ? b.trail[b.trail.length - 1] : null;
            const cx = nx;
            const cy = ny;

            let newTrail = b.trail;
            if (trailEnabled && (!last || distance(last, { x: cx, y: cy }) >= TRAIL_MIN_DIST)) {
            newTrail = [...b.trail, { x: cx, y: cy }];
            }
            return { ...b, x: nx, y: ny, trail: newTrail };
        });
        }
    };
    const handlePointerUp = () => {
        if (isDrawing && currentLine && currentLine.length > 1) {
            setDrawnLines(prev => [...prev, { id: Date.now(), points: currentLine }]);
        }
        setCurrentLine(null);

        draggingRef.current = { active: false, type: null, id: null, offsetX: 0, offsetY: 0 };
    };
    const openEditModal = (id) => {
        const p = players.find((pl) => pl.id === id);
        setEditingPlayer({
            ...p,
            goals: p.goals || 0,
            cards: p.cards || { yellow: false, red: false }
        });
        setShowModal(true);
    };
    const saveModal = () => {
        if (!editingPlayer) return;
        setPlayers((prev) => prev.map((pl) =>
        (pl.id === editingPlayer.id ?
            { ...pl, name: editingPlayer.name, goals: editingPlayer.goals, cards: editingPlayer.cards }
            : pl
        )
        ));
        setShowModal(false);
        setEditingPlayer(null);
    };
    const clearTrails = () => {
        setPlayers((prev) => prev.map((p) => ({ ...p, trail: [] })));
        setBall((b) => ({ ...b, trail: [] }));
    };
    const resetFormation = () => {
        applyFormation(currentFormation);
        setBall(defaultBall);
    }
    const downloadPitchAsPNG = () => {
        if (pitchRef.current) {
        if(isRecording) {
            alert("Video kaydı devam ederken PNG indirilemez. Önce kaydı durdurun.");
            return;
        }

        htmlToImage.toPng(pitchRef.current)
            .then(function (dataUrl) {
            const link = document.createElement('a');
            link.download = `${currentFormation}_taktik.png`;
            link.href = dataUrl;
            link.click();
            })
            .catch(function (error) {
            console.error('oops, something went wrong!', error);
            alert("Görüntü indirilemedi. Tarayıcı desteğini kontrol edin.");
            });
        }
    };
    const toggleTeamColors = () => setTeamColorsSwapped((s) => !s);
    const startRecording = async () => {
    if (!pitchRef.current) return;

    setRecordedVideoURL(null);
    recordedChunksRef.current = [];

    let canvas;
    try {
        canvas = await htmlToImage.toCanvas(pitchRef.current, {
            width: PITCH.width,
            height: PITCH.height,
            style: {
                transition: 'none',
                willChange: 'initial'
            }
        });
        pitchCanvasRef.current = canvas;
    } catch (error) {
        console.error("Canvas oluşturma hatası:", error);
        alert("Video kaydı için Canvas oluşturulamadı. Tarayıcınız desteklemiyor olabilir.");
        return;
    }

    if (!canvas.captureStream) {
        alert("Tarayıcınız Canvas akış yakalamayı desteklemiyor. Güncel bir Chrome veya Firefox kullanın.");
        return;
    }

    const stream = canvas.captureStream(frameRate);

    try {
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    } catch (e) {
        console.error("MediaRecorder başlatılamadı:", e);
        alert("Tarayıcınız WebM video kaydını desteklemiyor.");
        return;
    }


    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setRecordedVideoURL(URL.createObjectURL(blob));
      clearInterval(recordingIntervalRef.current);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    console.log("Kayıt Başlatıldı.");

    recordingIntervalRef.current = setInterval(async () => {
        if (pitchRef.current && pitchCanvasRef.current) {
            htmlToImage.toCanvas(pitchRef.current, {
                width: PITCH.width,
                height: PITCH.height,
                style: {
                    transition: 'none',
                    willChange: 'initial'
                }
            }).then(newCanvas => {
                const ctx = pitchCanvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, PITCH.width, PITCH.height);
                ctx.drawImage(newCanvas, 0, 0);
            }).catch(e => {
                console.error("Frame yakalama hatası:", e);
            });
        }
    }, 1000 / frameRate);
  };
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        clearInterval(recordingIntervalRef.current);
        console.log("Kayıt Durduruldu.");
        }
    };
    const downloadVideo = () => {
        if (recordedVideoURL) {
        const link = document.createElement('a');
        link.href = recordedVideoURL;
        link.download = `${currentFormation}_taktik_video_${Date.now()}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        } else {
        alert("İndirilecek kayıtlı bir video bulunmuyor.");
        }
    };
    const DesktopPitchMarkings = (
        <g className="markings" stroke="#fff" strokeWidth="3" fill="none">
            <rect x={PITCH.pad} y={PITCH.pad} width={PITCH.width - PITCH.pad * 2} height={PITCH.height - PITCH.pad * 2} rx="6"/>
            <line x1={PITCH.width / 2} y1={PITCH.pad} x2={PITCH.width / 2} y2={PITCH.height - PITCH.pad}/>
            <circle cx={PITCH.width / 2} cy={PITCH.height / 2} r="72"/>
            <circle cx={PITCH.width / 2} cy={PITCH.height / 2} r="3" fill="#fff"/>
            <rect x={PITCH.pad} y={(PITCH.height - 360) / 2} width="160" height="360"/>
            <rect x={PITCH.width - PITCH.pad - 160} y={(PITCH.height - 360) / 2} width="160" height="360"/>
            <rect x={PITCH.pad} y={(PITCH.height - 200) / 2} width="60" height="200"/>
            <rect x={PITCH.width - PITCH.pad - 60} y={(PITCH.height - 200) / 2} width="60" height="200"/>
            <line x1={PITCH.pad} y1={PITCH.height / 2 - 40} x2={PITCH.pad - 20} y2={PITCH.height / 2 - 40} strokeWidth="6"/>
            <line x1={PITCH.pad} y1={PITCH.height / 2 + 40} x2={PITCH.pad - 20} y2={PITCH.height / 2 + 40} strokeWidth="6"/>
            <line x1={PITCH.width - PITCH.pad} y1={PITCH.height / 2 - 40} x2={PITCH.width - PITCH.pad + 20} y2={PITCH.height / 2 - 40} strokeWidth="6"/>
            <line x1={PITCH.width - PITCH.pad} y1={PITCH.height / 2 + 40} x2={PITCH.width - PITCH.pad + 20} y2={PITCH.height / 2 + 40} strokeWidth="6"/>
        </g>
    );
    const MobilePitchMarkings = (
        <g className="markings" stroke="#fff" strokeWidth="2" fill="none">
            <rect x={PITCH.pad} y={PITCH.pad} width={PITCH.width - PITCH.pad * 2} height={PITCH.height - PITCH.pad * 2} rx="6" />
            <line x1={PITCH.pad} y1={PITCH.height / 2} x2={PITCH.width - PITCH.pad} y2={PITCH.height / 2} />
            <circle cx={PITCH.width / 2} cy={PITCH.height / 2} r="50" />
            <circle cx={PITCH.width / 2} cy={PITCH.height / 2} r="2" fill="#fff" />
            <rect x={(PITCH.width - 200) / 2} y={PITCH.pad} width="200" height="80" />
            <rect x={(PITCH.width - 200) / 2} y={PITCH.height - PITCH.pad - 80} width="200" height="80" />
            <rect x={(PITCH.width - 100) / 2} y={PITCH.pad} width="100" height="40" />
            <rect x={(PITCH.width - 100) / 2} y={PITCH.height - PITCH.pad - 40} width="100" height="40" />
            <line x1={PITCH.width / 2 - 30} y1={PITCH.pad} x2={PITCH.width / 2 - 30} y2={PITCH.pad - 10} strokeWidth="4" />
            <line x1={PITCH.width / 2 + 30} y1={PITCH.pad} x2={PITCH.width / 2 + 30} y2={PITCH.pad - 10} strokeWidth="4" />
            <line x1={PITCH.width / 2 - 30} y1={PITCH.height - PITCH.pad} x2={PITCH.width / 2 - 30} y2={PITCH.height - PITCH.pad + 10} strokeWidth="4" />
            <line x1={PITCH.width / 2 + 30} y1={PITCH.height - PITCH.pad} x2={PITCH.width / 2 + 30} y2={PITCH.height - PITCH.pad + 10} strokeWidth="4" />
        </g>
    );

  return (
    <div
      className="home-page"
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
       onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <h1>⚽ Taktik Kurucu ({currentFormation})</h1>

      <div className="controls-row">
        <div className="left-controls">
          <button onClick={() => toggleTeamCount(false)} className={!use22 ? "active" : ""}>11 Oyuncu</button>
          <button onClick={() => toggleTeamCount(true)} className={use22 ? "active" : ""}>22 Oyuncu</button>
        </div>

        <div className="center-controls">
          <div className="formation-selector">
            {Object.keys(formations).map(name => (
              <button
                key={name}
                className={`secondary ${currentFormation === name ? "active" : ""}`}
                onClick={() => applyFormation(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <button onClick={resetFormation}>Dizilişi Sıfırla</button>
        </div>

        <div className="right-controls">
          <button onClick={() => setTrailEnabled((s) => !s)}>{trailEnabled ? "İzi Kapat" : "İzi Aç"}</button>
          <button onClick={clearTrails}>İzleri Sil</button>
          <button onClick={toggleTeamColors}>Renkleri Değiştir</button>

           {/* GÜNCELLENDİ: Butonlara ikonlar eklendi */}
          <button onClick={downloadPitchAsPNG}>🖼️ Görüntüyü İndir</button>
          <button
            onClick={isDrawing ? stopDrawing : startDrawing}
            className={isDrawing ? "drawing-active-btn" : "drawing-btn"}
          >
            {isDrawing ? "✏️ Kalemi Kapat" : "✏️ Kalemi Aç"}
          </button>
          {drawnLines.length > 0 && (
            <button onClick={clearDrawings} className="secondary">Çizimleri Sil</button>
          )}
          {!isRecording ? (
                <button onClick={startRecording} className="video-start-btn" disabled={isRecording}>🔴 Kaydı Başlat</button>
            ) : (
                <button onClick={stopRecording} className="video-stop-btn">⬛ Kaydı Durdur</button>
            )}
            <button
                onClick={downloadVideo}
                disabled={!recordedVideoURL || isRecording}
                className="video-download-btn"
            >
                💾 Videoyu İndir
            </button>
        </div>
      </div>

      <div className="pitch" ref={pitchRef} style={{width: PITCH.width, height: PITCH.height}}
        onMouseDown={(e) => isDrawing && handlePointerDown(e, 'drawing')}
        onTouchStart={(e) => isDrawing && handleTouchStart(e, 'drawing')}
      >
        <svg className="field-svg" viewBox={`0 0 ${PITCH.width} ${PITCH.height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="grassG" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3aa14a"/>
              <stop offset="100%" stopColor="#12722a"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={PITCH.width} height={PITCH.height} fill="url(#grassG)" rx="18"/>
          {isMobile ? MobilePitchMarkings : DesktopPitchMarkings}
        </svg>

        <svg className="trails-svg" viewBox={`0 0 ${PITCH.width} ${PITCH.height}`} preserveAspectRatio="xMidYMid meet">
          {/* ... trail ve çizim SVG'leri aynı kalıyor ... */}
           {players.map((pl) =>
              pl.trail && pl.trail.length > 1 ? (
                  <polyline
                      key={`trail-${pl.id}`}
                      points={pl.trail.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                      fill="none"
                      stroke={teamColorsSwapped ? (pl.team === "A" ? "#ef4444" : "#2563eb") : (pl.team === "A" ? "#2563eb" : "#ef4444")}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.9"
                  />
              ) : null
          )}
          {ball.trail && ball.trail.length > 1 ? (
              <polyline
                  key="ball-trail"
                  points={ball.trail.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
              />
          ) : null}
          {drawnLines.map(line => (
              <polyline
                  key={line.id}
                  points={line.points.map(pt => `${pt.x},${pt.y}`).join(" ")}
                  fill="none"
                  stroke="#fef08a" /* Sarı/Beyaz bir renk seçildi */
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
              />
          ))}
          {currentLine && currentLine.length > 1 && (
              <polyline
                  points={currentLine.map(pt => `${pt.x},${pt.y}`).join(" ")}
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
              />
          )}
        </svg>

        <div
           className="ball"
            onMouseDown={(e) => isDrawing ? handlePointerDown(e, "drawing") : handlePointerDown(e, "ball")}
            onTouchStart={(e) => isDrawing ? handleTouchStart(e, "drawing") : handleTouchStart(e, "ball")}
            style={{
              transform: `translate3d(${ball.x - ball.r}px, ${ball.y - ball.r}px, 0)`,
              width: ball.r * 2,
              height: ball.r * 2,
              borderRadius: ball.r * 2,
            }}
            title="Top (sürükle)"
        />

        {players.map((p) => (
            <div
                key={p.id}
                className={`player ${p.cards && p.cards.red ? 'sent-off' : ''} ${teamColorsSwapped ? (p.team === "A" ? "team-a" : "team-b") : (p.team === "A" ? "team-b" : "team-a")}`}
                style={{
                  transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
                  width: PLAYER_SIZE,
                  height: PLAYER_SIZE,
                  lineHeight: `${PLAYER_SIZE}px`,
                }}
                onMouseDown={(e) => isDrawing ? handlePointerDown(e, "drawing") : handlePointerDown(e, "player", p.id)}
                onTouchStart={(e) => isDrawing ? handleTouchStart(e, "drawing", p.id) : handleTouchStart(e, "player", p.id)}
                onDoubleClick={() => openEditModal(p.id)}
                title={`${p.name} ${p.cards && p.cards.red ? '(Kırmızı Kart)' : p.cards && p.cards.yellow ? '(Sarı Kart)' : ''} ${p.goals > 0 ? `(${p.goals} Gol)` : ''}`}
            >
              <div className="player-label">
                <div className="num">{p.name}</div>
              </div>
              <div className="player-status-icons">
                {p.cards && p.cards.red && (
                    <span className="icon red-card" title="Kırmızı Kart"></span>
                )}
                {p.cards && !p.cards.red && p.cards.yellow && (
                    <span className="icon yellow-card" title="Sarı Kart"></span>
                )}
                {p.goals > 0 && (
                    <span className="icon goal-icon" title={`${p.goals} Gol`}>⚽×{p.goals}</span>
                )}
              </div>
            </div>
        ))}
      </div>

       {/* ... Modal ve footer kısmı aynı kalıyor ... */}
      {showModal && editingPlayer && (
          <div className="modal-overlay" onMouseDown={() => { setShowModal(false); setEditingPlayer(null); }}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Oyuncuyu Düzenle </h3>
            <label>
              Oyuncu İsim / Numara
              <input
                type="text"
                value={editingPlayer.name}
                onChange={(e) => setEditingPlayer((s) => ({ ...s, name: e.target.value }))}
                placeholder="Örn: 9, Santrafor, M. Salah"
              />
            </label>

            <div className="modal-controls-grid">

              <div className="control-card">
                <label>Sarı Kart</label>
                <button
                  onClick={() => setEditingPlayer(s => ({
                    ...s,
                    cards: {
                      yellow: !s.cards.yellow,
                      red: !s.cards.yellow ? false : s.cards.red
                    }
                  }))}
                  className={`icon-button ${editingPlayer.cards.yellow && !editingPlayer.cards.red ? 'active-yellow' : 'secondary'}`}
                  title={editingPlayer.cards.yellow && !editingPlayer.cards.red ? 'Sarı Kartı Kaldır' : 'Sarı Kart Ekle'}
                >
                  <span className="icon yellow-card-lg"></span>
                </button>
              </div>

              <div className="control-card">
                <label>Kırmızı Kart</label>
                <button
                  onClick={() => setEditingPlayer(s => ({
                    ...s,
                    cards: {
                      red: !s.cards.red,
                      yellow: false
                    }
                  }))}
                  className={`icon-button ${editingPlayer.cards.red ? 'active-red' : 'secondary'}`}
                  title={editingPlayer.cards.red ? 'Kırmızı Kartı Kaldır' : 'Kırmızı Kart Ekle'}
                >
                  <span className="icon red-card-lg"></span>
                </button>
              </div>

              <div className="control-card">
                <label>Gol Sayısı</label>
                <div className="input-group goal-group">
                  <button
                    onClick={() => setEditingPlayer(s => ({ ...s, goals: Math.max(0, s.goals - 1) }))}
                    className="small secondary"
                    title="Azalt"
                  >
                    -
                  </button>
                  <span className="card-count goal">{editingPlayer.goals}</span>
                  <button
                    onClick={() => setEditingPlayer(s => ({ ...s, goals: s.goals + 1 }))}
                    className="small secondary"
                    title="Artır"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => { setShowModal(false); setEditingPlayer(null); }}>İptal</button>
              <button className="btn primary" onClick={saveModal}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
      {recordedVideoURL && (
            <div className="modal-overlay" onMouseDown={() => setRecordedVideoURL(null)}>
                <div className="modal" style={{ maxWidth: '90%', }}>
                    <h3>Video Önizleme</h3>
                    <video controls src={recordedVideoURL} style={{ width: '100%', borderRadius: '10px' }}></video>
                    <div className="modal-actions">
                        <button className="btn secondary" onClick={() => setRecordedVideoURL(null)}>Kapat</button>
                        <button
                            onClick={downloadVideo}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={!recordedVideoURL || isRecording}
                            className="video-download-btn"
                        >
                            💾 Videoyu İndir
                        </button>
                    </div>
                </div>
            </div>
      )}

      <footer className="footer-note">
        {isMobile ? "Oyuncuyu düzenlemek için çift dokunun." : "Oyuncuyu düzenlemek için çift tıklayın."} Saha dışına çıkma engeli açık.
      </footer>
    </div>
  );
}