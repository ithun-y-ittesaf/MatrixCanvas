import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import PlaygroundPage from './pages/PlaygroundPage';
import LearningPage from './pages/LearningPage';
import './App.css';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0d0f1a]">
      <NavBar />
      <Routes>
        <Route path="/"      element={<PlaygroundPage />} />
        <Route path="/learn" element={<LearningPage />}   />
      </Routes>
    </div>
  );
}
