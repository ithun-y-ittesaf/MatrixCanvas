import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import PlaygroundPage from './pages/PlaygroundPage';
import LearningPage from './pages/LearningPage';
import './App.css';

export default function App() {
  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <Routes>
        <Route path="/"      element={<PlaygroundPage />} />
        <Route path="/learn" element={<LearningPage />}   />
        {/* The old standalone 3D page is now the Playground's 3D mode. */}
        <Route path="/3d"    element={<Navigate to="/?mode=3d" replace />} />
      </Routes>
    </div>
  );
}
