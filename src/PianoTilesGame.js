import React, { useState, useEffect, useRef } from "react";
import { Music, RotateCcw, Trophy } from "lucide-react";

const PianoTilesGame = () => {
  const [rows, setRows] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);

  const COLUMNS = 4;
  const TILE_HEIGHT = 150;
  const BOARD_HEIGHT = 600;

  // Initialize audio
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const audio = new Audio("/sounds/gameover.mp3"); // Put your file in public/sounds/
    audio.volume = 0.5;
    gameOverSoundRef.current = audio;

    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // 1️⃣ Add a ref for background music
  const bgMusicRef = useRef(null);
  const gameOverSoundRef = useRef(null);

  // 2️⃣ Start background music when game starts
  useEffect(() => {
    if (gameStarted && !gameOver) {
      if (!bgMusicRef.current) {
        const audio = new Audio("/sounds/piano-sound.mp3"); // Path relative to public folder
        audio.loop = true;
        audio.volume = 0.3;
        audio.play().catch((e) => console.log("Autoplay blocked:", e));
        bgMusicRef.current = audio;
      } else {
        bgMusicRef.current.play().catch((e) => console.log("Autoplay blocked:", e));
      }
    } else {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
    }
  }, [gameStarted, gameOver]);

  const frequencies = [261.63, 293.66, 329.63, 349.23];

  const playSound = (col) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequencies[col];
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  };

  // Create one row (1–3 black tiles)
  const createRow = (positionY) => {
    const blackCount = Math.floor(Math.random() * 3) + 1;
    const blackCols = [];
    while (blackCols.length < blackCount) {
      const r = Math.floor(Math.random() * COLUMNS);
      if (!blackCols.includes(r)) blackCols.push(r);
    }

    return {
      id: Date.now() + Math.random(),
      y: positionY,
      tiles: Array.from({ length: COLUMNS }, (_, col) => ({
        col,
        black: blackCols.includes(col),
        clicked: false,
      })),
    };
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setSpeed(1);
    const initialRows = [];
    for (let i = 0; i < Math.ceil(BOARD_HEIGHT / TILE_HEIGHT) + 1; i++) {
      initialRows.unshift(createRow(-i * TILE_HEIGHT));
    }
    setRows(initialRows);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setSpeed(1);
    setRows([]);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  // Main game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const loop = () => {
      setRows((prev) => {
        let updated = prev.map((r) => ({ ...r, y: r.y + speed }));

        // Check for missed tiles
        const bottomRow = updated.find(
          (r) => r.y > BOARD_HEIGHT && r.tiles.some((t) => t.black && !t.clicked)
        );
        if (bottomRow) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
          return updated;
        }

        // Remove rows below screen
        updated = updated.filter((r) => r.y < BOARD_HEIGHT + TILE_HEIGHT);

        // Add new row at top
        const lastY = updated[0]?.y ?? 0;
        if (lastY >= 0) {
          updated.unshift(createRow(lastY - TILE_HEIGHT));
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameStarted, gameOver, speed, score, highScore]);

  // Handle tile click (black or white)
  const handleTileClick = (rowId, col, black) => {
    if (gameOver) return;

    if (black) {
      // Black tile clicked
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          return {
            ...r,
            tiles: r.tiles.map((t) => {
              if (t.col === col && !t.clicked) {
                playSound(col);
                setScore((s) => {
                  const newScore = s + 1;
                  if (newScore < 15) setSpeed(1);
                  else if (newScore < 35) setSpeed(2);
                  else setSpeed(3);
                  return newScore;
                });
                return { ...t, clicked: true };
              }
              return t;
            }),
          };
        })
      );
    } else {

      if (!gameStarted || gameOver) return;

      setGameOver(true);
      if (score > highScore) setHighScore(score);

      if (gameOverSoundRef.current) {
        gameOverSoundRef.current.currentTime = 0;
        gameOverSoundRef.current.play().catch((e) => console.log("Sound play error:", e));
      }

    }
  };

  // Styles
  const styles = {
    container: {
      height: "100vh",
      width: "100vw",
      background: "linear-gradient(to bottom right, #2e026d, #1b0e7f, #2c007a)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      position: "relative",
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      color: "white",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "space-between",
      zIndex: 20,
    },
    board: {
      width: "100vw",
      height: `100vh`,
      background: "white",
      overflow: "hidden",
      position: "relative",
      boxShadow: "0 0 15px rgba(0,0,0,0.5)",
    },
    row: (y) => ({
      position: "absolute",
      top: `${y}px`,
      left: 0,
      width: "100%",
      height: `${TILE_HEIGHT}px`,
      display: "flex",
    }),
    tile: (tile) => ({
      flex: 1,
      background: tile.black
        ? tile.clicked
          ? "linear-gradient(to bottom, #4caf50, #087f23)"
          : "linear-gradient(to bottom, #111, #000)"
        : "#fff",
      border: "1px solid #ccc",
      cursor: "pointer",
      transition: "opacity 0.2s",
      opacity: tile.clicked ? 0.6 : 1,
    }),
    startScreen: {
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      zIndex: 30,
    },
    gameOver: {
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,0.8)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      zIndex: 30,
    },
    button: {
      marginTop: "20px",
      padding: "12px 25px",
      background: "linear-gradient(to right, #ff4081, #7c4dff)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      fontSize: "18px",
      cursor: "pointer",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Music size={24} color="gold" />
          <span style={{ fontWeight: "bold", fontSize: "20px" }}>Piano Tiles</span>
        </div>
        <div style={{ display: "flex", gap: "30px" }}>
          <div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Score</div>
            <div style={{ fontSize: "22px", color: "#ffeb3b", fontWeight: "bold" }}>{score}</div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div style={styles.board}>
        {gameStarted &&
          rows.map((row) => (
            <div key={row.id} style={styles.row(row.y)}>
              {row.tiles.map((tile) => (
                <div
                  key={tile.col}
                  style={styles.tile(tile)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTileClick(row.id, tile.col, tile.black);
                  }}
                />
              ))}
            </div>
          ))}

        {/* Start Screen */}
        {/* Start Screen */}
        {!gameStarted && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            zIndex: 30,
            overflow: "hidden",
            padding: "0 5vw" // padding for smaller screens
          }}>
            {/* Glowing neon title */}
            <h1 className="start-title" style={{
              fontSize: "60px",
              fontWeight: "900",
              color: "#ff00ff",
              textShadow: "0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff",
              marginBottom: "20px",
              letterSpacing: "3px"
            }}>Piano Tiles</h1>

            {/* Animated music icons */}
            <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              {[...Array(5)].map((_, i) => (
                <Music
                  key={i}
                  size={32 + Math.random() * 16}
                  color={`hsl(${Math.random() * 360}, 100%, 70%)`}
                  style={{ animation: `float 2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>

            {/* Subtitle */}
            <p className="start-subtitle" style={{ fontSize: "20px", opacity: 0.8, marginBottom: "30px" }}>
              Tap the black tiles, avoid the white ones, and master the rhythm!
            </p>

            {/* Start Button */}
            <button
              className="start-btn"
              style={{
                padding: "15px 35px",
                fontSize: "22px",
                fontWeight: "bold",
                color: "#fff",
                background: "linear-gradient(90deg, #ff416c, #ff4b2b)",
                border: "none",
                borderRadius: "30px",
                cursor: "pointer",
                boxShadow: "0 0 15px rgba(255, 65, 108, 0.6), 0 0 30px rgba(255, 75, 43, 0.4)",
                transition: "all 0.3s ease",
              }}
              onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
              onClick={startGame}
            >
              Start Game
            </button>

            {/* Floating keyframe animation + responsive styles */}
            <style>
              {`
        @keyframes float {
          0% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-15px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.7; }
        }

        /* Responsive adjustments for smaller screens */
        @media (max-width: 500px) {
          .start-title {
            font-size: 12vw; /* responsive title */
          }
          .start-subtitle {
            font-size: 4vw; /* responsive subtitle */
          }
          .start-btn {
            padding: 3vw 7vw;
            font-size: 4vw;
            border-radius: 10vw;
          }
        }
      `}
            </style>
          </div>
        )}


        {/* Game Over */}
        {gameOver && (
          <div style={styles.gameOver}>
            <div style={{ fontSize: "60px" }}>😢</div>
            <h2 style={{ color: "red", fontSize: "36px" }}>Game Over!</h2>
            <p style={{ fontSize: "24px" }}>
              Final Score: <span style={{ color: "#ffeb3b" }}>{score}</span>
            </p>
            {score === highScore && score > 0 && (
              <p style={{ color: "#f48fb1" }}>
                <Trophy size={20} /> New High Score! <Trophy size={20} />
              </p>
            )}
            <button
              style={{ ...styles.button, background: "linear-gradient(to right, #4caf50, #2196f3)" }}
              onClick={resetGame}
            >
              <RotateCcw size={20} /> Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PianoTilesGame;
