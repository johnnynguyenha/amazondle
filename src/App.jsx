import { useState, useEffect } from "react";
import DailyPriceGame from "./components/DailyPriceGame";
import AuthModal from "./components/AuthModal";
import "./App.css";

export default function App() {
  // Initialize darkMode from localStorage or default to true
  const getInitialDarkMode = () => {
    const saved = localStorage.getItem("amazondle_darkMode");
    return saved !== null ? saved === "true" : true;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [user, setUser] = useState(null);

  // load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("amazondle_user");
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // save dark mode preference whenever it changes
  useEffect(() => {
    localStorage.setItem("amazondle_darkMode", darkMode.toString());
  }, [darkMode]);

  const handleLogin = (credentials) => {
    // check if user exists in localStorage
    const users = JSON.parse(localStorage.getItem("amazondle_users") || "[]");
    const foundUser = users.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem("amazondle_user", JSON.stringify(foundUser));
      setShowAuthModal(false);
      return { success: true };
    } else {
      return { success: false, error: "Invalid email or password" };
    }
  };

  const handleSignup = (credentials) => {
    // check if user already exists
    const users = JSON.parse(localStorage.getItem("amazondle_users") || "[]");
    const existingUser = users.find(u => u.email === credentials.email);

    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    // create new user
    const newUser = {
      email: credentials.email,
      password: credentials.password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem("amazondle_users", JSON.stringify(users));
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("amazondle_user", JSON.stringify(newUser));
    setShowAuthModal(false);
    return { success: true };
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("amazondle_user");
    setShowAuthModal(false);
  };

  return (
    <>
      <DailyPriceGame 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        isAuthenticated={isAuthenticated}
        user={user}
        onShowAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />
      {showAuthModal && (
        <AuthModal
          darkMode={darkMode}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      )}
    </>
  );
}