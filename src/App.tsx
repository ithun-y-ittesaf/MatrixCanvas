import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import PlaygroundPage from './pages/PlaygroundPage';
import LearningPage from './pages/LearningPage';
import ThreeDPage from './pages/ThreeDPage';
import './App.css';

export default function App() {
  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <Routes>
        <Route path="/"      element={<PlaygroundPage />} />
        <Route path="/learn" element={<LearningPage />}   />
        <Route path="/3d"    element={<ThreeDPage />}     />
      </Routes>
    </div>
  );
}
