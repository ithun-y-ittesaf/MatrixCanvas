import Matrix3x3Input from '../components/Matrix3x3Input';
import Scene3D from '../components/Scene3D';

export default function ThreeDPage() {
  return (
    <div className="relative h-[calc(100vh-3.5rem)]">
      <Scene3D />
      <div className="absolute top-3 left-3 z-10">
        <Matrix3x3Input />
      </div>
    </div>
  );
}
