import React, { useState } from "react";

const LANGUAGES = {
  en: { name: "English", flag: "🇺🇸" },
  fi: { name: "Suomi", flag: "🇫🇮" },
  sv: { name: "Svenska", flag: "🇸🇪" },
  no: { name: "Norsk", flag: "🇳🇴" },
};

const TRANSLATIONS = {
  en: { title: "GridRadar", subtitle: "Real-time Utility Service Tracking", login: "Login", username: "Username", password: "Password", welcome: "Welcome to GridRadar" },
  fi: { title: "GridRadar", subtitle: "Reaaliaikainen sähköpalvelujen seuranta", login: "Kirjaudu", username: "Käyttäjänimi", password: "Salasana", welcome: "Tervetuloa GridRadar-palveluun" },
  sv: { title: "GridRadar", subtitle: "Realtidsövervakning av elserviceteam", login: "Logga in", username: "Användarnamn", password: "Lösenord", welcome: "Välkommen till GridRadar" },
  no: { title: "GridRadar", subtitle: "Sanntidsovervåking av elserviceteam", login: "Logg inn", username: "Brukernavn", password: "Passord", welcome: "Velkommen til GridRadar" },
};

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentLang, setCurrentLang] = useState("en");
  const [error, setError] = useState(null);
  const t = TRANSLATIONS[currentLang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.detail || "Login failed");
        return;
      }

      const data = await response.json();
      onLogin(data.token); // Pass token to parent
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <h1 className="login-title">{t.title}</h1>
        <p className="login-sub">{t.subtitle}</p>

        <div className="lang-row">
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrentLang(code)}
              className={`lang-btn ${currentLang === code ? "active" : ""}`}
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder={t.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <button type="submit" className="login-submit">
            {t.login}
          </button>
          {error && <p style={{fontSize: '30px'}} className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
