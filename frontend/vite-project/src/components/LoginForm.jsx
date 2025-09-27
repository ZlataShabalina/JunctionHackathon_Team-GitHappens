import React, { useState } from 'react';

const LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  fi: { name: 'Suomi', flag: '🇫🇮' },
  sv: { name: 'Svenska', flag: '🇸🇪' },
  no: { name: 'Norsk', flag: '🇳🇴' }
};

const TRANSLATIONS = {
  en: {
    title: 'GridRadar',
    subtitle: 'Real-time Utility Service Tracking',
    login: 'Login',
    username: 'Username',
    password: 'Password',
    welcome: 'Welcome to GridRadar'
  },
  fi: {
    title: 'GridRadar',
    subtitle: 'Reaaliaikainen sähköpalvelujen seuranta',
    login: 'Kirjaudu',
    username: 'Käyttäjänimi',
    password: 'Salasana',
    welcome: 'Tervetuloa GridRadar-palveluun'
  },
  sv: {
    title: 'GridRadar',
    subtitle: 'Realtidsövervakning av elserviceteam',
    login: 'Logga in',
    username: 'Användarnamn',
    password: 'Lösenord',
    welcome: 'Välkommen till GridRadar'
  },
  no: {
    title: 'GridRadar',
    subtitle: 'Sanntidsovervåking av elserviceteam',
    login: 'Logg inn',
    username: 'Brukernavn',
    password: 'Passord',
    welcome: 'Velkommen til GridRadar'
  }
};

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentLang, setCurrentLang] = useState('en');

  const t = TRANSLATIONS[currentLang];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add authentication logic here (API call, etc.)
    onLogin(); // mark user as authenticated
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-96">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">{t.title}</h1>
          <p className="text-gray-300">{t.subtitle}</p>
        </div>
        
        <div className="flex justify-center gap-2 mb-6">
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => setCurrentLang(code)}
              className={`px-3 py-1 rounded text-sm ${currentLang === code 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
            required
          />
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-semibold transition-colors"
          >
            {t.login}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;