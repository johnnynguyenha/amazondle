import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import items from "../data/items.json";
import LogoutConfirm from "./LogoutConfirm";
import PlayHistoryModal from "./SettingsModal";
import AboutModal from "./AboutModal";
import "../app.css";

export default function DailyPriceGame({ darkMode, setDarkMode, isAuthenticated, user, onShowAuth, onLogout }) {
  const [item, setItem] = useState(null);
  const [currentGuess, setCurrentGuess] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPlayHistory, setShowPlayHistory] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const confettiTriggered = useRef(false);

  // helper method to get today's date string in PST (YYYY-MM-DD)
  function getTodayPST() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const pstOffsetMs = -8 * 60 * 60 * 1000;
    const pstNow = new Date(utc + pstOffsetMs);
    
    const year = pstNow.getFullYear();
    const month = String(pstNow.getMonth() + 1).padStart(2, '0');
    const day = String(pstNow.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // helper method to get the number of days since launch in PST
  function getDaysSinceLaunch() {
    // launch date: December 1, 2025 at 00:00:00 PST
    const launchDate = new Date('2025-12-01T08:00:00Z'); // 12am PST = 8am UTC
    
    // get current time in UTC
    const now = new Date();
    
    // calculate current PST time (UTC-8)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const pstOffsetMs = -8 * 60 * 60 * 1000;
    const pstNow = new Date(utc + pstOffsetMs);
    
    // set to start of day in PST
    const pstMidnight = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate());
    const launchMidnight = new Date(launchDate.getFullYear(), launchDate.getMonth(), launchDate.getDate());
    
    // calculate days difference
    const diffMs = pstMidnight - launchMidnight;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays); // ensure non-negative
  }

  useEffect(() => {
    // sequential daily item starting from id 1
    const daysSinceLaunch = getDaysSinceLaunch();
    const targetId = (daysSinceLaunch % items.length) + 1;
    const dailyItem = items.find(item => item.id === targetId) || items[0];
    setItem({
      title: dailyItem.title,
      image: dailyItem.image,
      description: dailyItem.description,
      actualPrice: dailyItem.price,
    });
    setLoading(false);
    
    // check if user has played today
    if (user) {
      const lastPlayedKey = `amazondle_last_played_${user.email}`;
      const lastPlayed = localStorage.getItem(lastPlayedKey);
      const today = getTodayPST();
      
      if (lastPlayed === today) {
        setHasPlayedToday(true);
        setGameOver(true);
        // Load their results from history
        const historyKey = `amazondle_history_${user.email}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
        const todayGame = history.find(game => game.date.startsWith(today));
        if (todayGame) {
          // Reconstruct guesses from history
          const reconstructedGuesses = [];
          for (let i = 0; i < todayGame.guessesUsed; i++) {
            if (i === todayGame.guessesUsed - 1) {
              // Last guess (best guess)
              reconstructedGuesses.push({
                value: todayGame.bestGuess,
                difference: todayGame.closestDifference,
                hint: getHint(todayGame.bestGuess, todayGame.actualPrice),
                isCorrect: todayGame.won
              });
            }
          }
          setGuesses(reconstructedGuesses);
        }
      } else {
        // reset game state for new day
        setHasPlayedToday(false);
        setGuesses([]);
        setGameOver(false);
        setCurrentGuess(0);
      }
    } else {
      // not logged in, allow play but reset state
      setHasPlayedToday(false);
      setGuesses([]);
      setGameOver(false);
      setCurrentGuess(0);
    }
    
    confettiTriggered.current = false;
  }, [user]);

  const getHint = (guess, actualPrice) => {
    const difference = Math.abs(actualPrice - guess);
    const percentage = (difference / actualPrice) * 100;
    
    if (difference <= 1) {
      return "Extremely close!";
    } else if (difference <= 5) {
      return "Very close!";
    } else if (difference <= 10) {
      return "Close to the mark";
    } else if (difference <= 20) {
      return "Somewhat Close";
    } else if (percentage <= 25) {
      return "In the ballpark";
    } else if (percentage <= 50) {
      return "Not quite";
    } else if (guess < actualPrice) {
      return "Too low";
    } else {
      return "Too high";
    }
  };

  const submitGuess = () => {
    if (!item || gameOver || currentGuess <= 0 || hasPlayedToday) return;
    
    const difference = Math.abs(item.actualPrice - currentGuess);
    const isCorrect = difference <= 1;
    const hint = getHint(currentGuess, item.actualPrice);
    
    const newGuess = {
      value: currentGuess,
      difference: difference,
      hint: hint,
      isCorrect: isCorrect
    };
    
    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);
    setCurrentGuess(0);
    
    // game ends if correct or 3 guesses reached
    if (isCorrect || newGuesses.length >= 3) {
      setGameOver(true);
      setHasPlayedToday(true);
      // save game history if user is logged in
      if (user) {
        saveGameHistory(newGuesses);
        // mark today as played
        const lastPlayedKey = `amazondle_last_played_${user.email}`;
        localStorage.setItem(lastPlayedKey, getTodayPST());
      }
      // trigger confetti if won
      if (isCorrect) {
        triggerConfetti();
      }
    }
  };

  const triggerConfetti = () => {
    if (confettiTriggered.current) return;
    confettiTriggered.current = true;

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        confettiTriggered.current = false;
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // launch confetti from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      // launch confetti from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // big burst from the center as well
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 100,
        origin: { x: 0.5, y: 0.5 },
        angle: randomInRange(55, 125),
        spread: 50
      });
    }, 100);
  };

  const saveGameHistory = (finalGuesses) => {
    if (!user || !item || !finalGuesses || finalGuesses.length === 0) return;
    
    const bestGuess = finalGuesses.reduce((best, current) => 
      current.difference < best.difference ? current : best,
      finalGuesses[0]
    );
    
    const gameData = {
      itemName: item.title,
      actualPrice: item.actualPrice,
      bestGuess: bestGuess.value,
      closestDifference: bestGuess.difference,
      guessesUsed: finalGuesses.length,
      won: bestGuess.isCorrect,
      date: new Date().toISOString()
    };
    
    const historyKey = `amazondle_history_${user.email}`;
    const existingHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
    existingHistory.unshift(gameData); // add to beginning
    // keep only last 50 games
    const limitedHistory = existingHistory.slice(0, 50);
    localStorage.setItem(historyKey, JSON.stringify(limitedHistory));
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (loading) return <div className="loading">Loading...</div>;
// animations
  return (
    <motion.div 
      className={`app-wrapper ${darkMode ? 'dark' : 'light'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left Navbar */}
      <nav className="left-navbar">
        <div className="nav-button-wrapper">
          <motion.button 
            className="nav-button" 
            onClick={toggleDarkMode}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 17,
              delay: 0.1,
              duration: 0.2
            }}
          >
            <i className="gg-bulb" />
          </motion.button>
          <span className="nav-tooltip">Toggle {darkMode ? 'Light' : 'Dark'} Mode</span>
        </div>
        <div className="nav-button-wrapper">
          <motion.button 
            className="nav-button" 
            onClick={() => {
              if (isAuthenticated) {
                setShowPlayHistory(true);
              } else {
                onShowAuth();
              }
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 17,
              delay: 0.15,
              duration: 0.2
            }}
          >
            <i className="gg-chart" />
          </motion.button>
          <span className="nav-tooltip">Play History</span>
        </div>
        {isAuthenticated ? (
          <div className="nav-button-wrapper">
            <motion.button 
              className="nav-button" 
              onClick={() => setShowLogoutConfirm(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 17,
                delay: 0.2,
                duration: 0.2
              }}
            >
              <i className="gg-log-out" />
            </motion.button>
            <span className="nav-tooltip">Logout ({user?.email})</span>
          </div>
        ) : (
          <div className="nav-button-wrapper">
            <motion.button 
              className="nav-button" 
              onClick={onShowAuth}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 17,
                delay: 0.2,
                duration: 0.2
              }}
            >
              <i className="gg-log-in" />
            </motion.button>
            <span className="nav-tooltip">Login / Sign Up</span>
          </div>
        )}
        <div className="nav-button-wrapper">
          <motion.button 
            className="nav-button" 
            onClick={() => setShowAbout(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 17,
              delay: 0.25,
              duration: 0.2
            }}
          >
            <i className="gg-info" />
          </motion.button>
          <span className="nav-tooltip">About</span>
        </div>
      </nav>

      <motion.div 
        className="wordle-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
      {/* Header */}
      <motion.header 
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h1 className="wordle-title">AMAZONDLE</h1>
      </motion.header>

      {/* Main Game Area */}
      <main className="game-area">
        {/* Item Description Section */}
        <motion.div 
          className="item-info"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="item-title">{item.title}</h2>
          <p className="item-description">{item.description}</p>
        </motion.div>

        {/* Item Image */}
        <motion.div 
          className="image-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <img
            src={item.image}
            alt={item.title}
            className="item-image"
          />
        </motion.div>

        {/* Guesses Display */}
        <AnimatePresence>
          {guesses.length > 0 && (
            <motion.div 
              className="guesses-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h3 
                className="guesses-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Your Guesses
              </motion.h3>
              <div className="guesses-list">
                <AnimatePresence>
                  {guesses.map((guess, index) => (
                    <motion.div 
                      key={index} 
                      className={`guess-item ${guess.isCorrect ? 'correct' : ''}`}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ 
                        duration: 0.3,
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="guess-number">Guess {index + 1}</div>
                      <div className="guess-value">${guess.value.toFixed(2)}</div>
                      <div className="guess-hint">{guess.hint}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guess Section */}
        <AnimatePresence>
          {!gameOver && !hasPlayedToday && (
            <motion.div 
              className="guess-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="guess-counter"
                key={guesses.length}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                Guess {guesses.length + 1} of 3
              </motion.div>
              <div className="input-group">
                <motion.input
                  type="number"
                  value={currentGuess || ''}
                  onChange={(e) => setCurrentGuess(parseFloat(e.target.value) || 0)}
                  placeholder="Enter your guess"
                  className="guess-input"
                  onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.button 
                  className="submit-button" 
                  onClick={submitGuess}
                  disabled={currentGuess <= 0}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  Submit
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final Result Display */}
        <AnimatePresence>
          {(gameOver || hasPlayedToday) && (
            <motion.div 
              className={`result-container ${guesses[guesses.length - 1]?.isCorrect ? 'correct' : 'incorrect'}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                duration: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
            >
              <motion.div 
                className="result-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {guesses[guesses.length - 1]?.isCorrect ? '🎉 Correct!' : hasPlayedToday && guesses.length === 0 ? '✅ Already Played Today' : 'Game Over'}
              </motion.div>
              {hasPlayedToday && guesses.length === 0 && (
                <motion.div 
                  className="result-details"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                    Come back tomorrow for a new item!
                  </p>
                </motion.div>
              )}
              {guesses.length > 0 && (
                <motion.div 
                  className="result-details"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.div 
                    className="result-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <span className="result-label">Actual Price:</span>
                    <span className="result-value">${item.actualPrice.toFixed(2)}</span>
                  </motion.div>
                  {(() => {
                    const bestGuess = guesses.reduce((best, current) => 
                      current.difference < best.difference ? current : best
                    );
                    return (
                      <>
                        <motion.div 
                          className="result-row"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                        >
                          <span className="result-label">Your Best Guess:</span>
                          <span className="result-value">
                            ${bestGuess.value.toFixed(2)}
                          </span>
                        </motion.div>
                        <motion.div 
                          className="result-row"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6, duration: 0.3 }}
                        >
                          <span className="result-label">Closest Difference:</span>
                          <span className="result-value">
                            ${bestGuess.difference.toFixed(2)}
                          </span>
                        </motion.div>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </motion.div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirm
          darkMode={darkMode}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            onLogout();
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* Play History Modal */}
      {showPlayHistory && (
        <PlayHistoryModal
          darkMode={darkMode}
          user={user}
          onClose={() => setShowPlayHistory(false)}
          onShowAuth={onShowAuth}
        />
      )}

      {/* About Modal */}
      {showAbout && (
        <AboutModal
          darkMode={darkMode}
          onClose={() => setShowAbout(false)}
        />
      )}
    </motion.div>
  );
}