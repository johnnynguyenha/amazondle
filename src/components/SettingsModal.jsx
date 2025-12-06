import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Auth.css";
import "../app.css";

export default function PlayHistoryModal({ darkMode, user, onClose, onShowAuth }) {
  const [playHistory, setPlayHistory] = useState([]);

  useEffect(() => {
    if (user) {
      const history = JSON.parse(localStorage.getItem(`amazondle_history_${user.email}`) || "[]");
      setPlayHistory(history);
    }
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="auth-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`auth-modal settings-modal ${darkMode ? 'dark' : 'light'}`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="auth-modal-close" onClick={onClose}>
            ×
          </button>

          <motion.h1
            className="auth-title"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Play History
          </motion.h1>

          {user ? (
            <motion.div
              className="settings-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {playHistory.length === 0 ? (
                <p className="no-history">No games played yet. Start playing to see your history!</p>
              ) : (
                <div className="history-list">
                  {playHistory.map((game, index) => (
                    <motion.div
                      key={index}
                      className="history-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className="history-header">
                        <span className="history-item-name">{game.itemName}</span>
                        <span className={`history-status ${game.won ? 'won' : 'lost'}`}>
                          {game.won ? '🎉 Won' : '❌ Lost'}
                        </span>
                      </div>
                      <div className="history-details">
                        <div className="history-row">
                          <span>Actual Price:</span>
                          <span className="history-value">${game.actualPrice.toFixed(2)}</span>
                        </div>
                        <div className="history-row">
                          <span>Best Guess:</span>
                          <span className="history-value">${game.bestGuess.toFixed(2)}</span>
                        </div>
                        <div className="history-row">
                          <span>Difference:</span>
                          <span className="history-value">${game.closestDifference.toFixed(2)}</span>
                        </div>
                        <div className="history-row">
                          <span>Guesses Used:</span>
                          <span className="history-value">{game.guessesUsed} / 3</span>
                        </div>
                        <div className="history-date">{formatDate(game.date)}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="settings-content login-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="no-history">Please log in to view your play history.</p>
              <motion.button
                className="auth-button"
                onClick={() => {
                  onClose();
                  if (onShowAuth) {
                    setTimeout(() => onShowAuth(), 300); // Small delay for modal close animation
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: "1rem" }}
              >
                Go to Login
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

