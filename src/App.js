import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import './App.css';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import GiftExchange from './components/GiftExchange';
import About from './components/About';
import GiftCalendar from './components/GiftCalendar';
import { AuthProvider } from './contexts/AuthContext';
import './styles/global.scss';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/gift-exchange" element={<GiftExchange />} />
                <Route path="/about" element={<About />} />
                <Route path="/calendar" element={<GiftCalendar />} />
                <Route path="/user/:userId" element={<LandingPage />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </Router>
    </Provider>
  );
}

export default App;
