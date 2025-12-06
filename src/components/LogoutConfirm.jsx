import { motion, AnimatePresence } from "framer-motion";
import "./Auth.css";
import "../app.css";

export default function LogoutConfirm({ darkMode, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      <motion.div
        className="auth-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className={`auth-modal confirm-modal ${darkMode ? 'dark' : 'light'}`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="confirm-title">Logout?</h2>
          <p className="confirm-message">Are you sure you want to logout?</p>
          <div className="confirm-buttons">
            <motion.button
              className="confirm-button cancel-button"
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              className="confirm-button confirm-button-primary"
              onClick={onConfirm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Logout
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

