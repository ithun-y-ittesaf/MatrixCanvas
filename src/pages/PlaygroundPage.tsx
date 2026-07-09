import MatrixInput from '../components/MatrixInput';
import PropertiesPanel from '../components/PropertiesPanel';
import TransformCanvas from '../components/TransformCanvas';
import VectorPanel from '../components/VectorPanel';

export default function PlaygroundPage() {
  return (
    <div className="relative h-[calc(100vh-3.5rem)]">
      {/* Full-bleed canvas */}
      <TransformCanvas />

      {/* Floating matrix panel — bottom-left */}
      <div className="absolute bottom-6 left-6 rounded-xl border border-white/10 px-5 py-4
                      bg-black/50 backdrop-blur-md shadow-2xl">
        <MatrixInput />
      </div>

      {/* Vector panel — top-left */}
      <div className="absolute top-6 left-6">
        <VectorPanel />
      </div>

      {/* Properties legend — bottom-right */}
      <div className="absolute bottom-6 right-6">
        <PropertiesPanel />
      </div>
    </div>
  );
}
