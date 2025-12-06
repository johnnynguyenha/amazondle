import { motion, AnimatePresence } from "framer-motion";
import "./Auth.css";
import "../app.css";

export default function AboutModal({ darkMode, onClose }) {
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
          className={`auth-modal about-modal ${darkMode ? 'dark' : 'light'}`}
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
            About Amazondle
          </motion.h1>

          <motion.div
            className="about-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <section className="about-section">
              <h2 className="about-section-title">How to Play</h2>
              <ol className="about-list">
                <li>You'll see an Amazon product, with a picture, its name, and description</li>
                <li>Guess the price of the item, you get 3 attempts to win!</li>
                <li>After each guess, you'll get a hint of how close you are.</li>
                <li>Win by guessing within $1 of the actual price.</li>
                <li>The game ends after 3 guesses or if you win.</li>
              </ol>
            </section>

            <section className="about-section">
              <h2 className="about-section-title">Hints</h2>
              <ul className="about-list">
                <li><strong>Extremely close!</strong> - Within $1 (You win!)</li>
                <li><strong>Very close!</strong> - Within $5</li>
                <li><strong>Close</strong> - Within $10</li>
                <li><strong>Somewhat Close</strong> - Within $20</li>
                <li><strong>In the ballpark</strong> - Within 25% of the price</li>
                <li><strong>Not quite</strong> - Within 50% of the price</li>
                <li><strong>Too low</strong> or <strong>Too high</strong> - Further away</li>
              </ul>
            </section>

            <section className="about-section">
              <h2 className="about-section-title">Features</h2>
              <ul className="about-list">
                <li>Play without logging in! Anyone can play.</li>
                <li>Create an account to track your play history</li>
                <li>View your past games.</li>
                <li>Toggle between light and dark mode</li>
              </ul>
            </section>

            <section className="about-section credits-section">
              <h2 className="about-section-title">Credits</h2>
              <p className="credits-text">
                Created by <strong>Johnny Nguyen</strong>
              </p>
              <p className="credits-subtext">
                Inspired by Wordle.
              </p>
            </section>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

