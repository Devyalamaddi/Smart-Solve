import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Brain, Users, MessageSquare, School } from 'lucide-react';
import { Link } from 'react-router-dom';

function Brain3D() {
  const group = useRef<THREE.Group>(null);
  return (
    <group ref={group} dispose={null}>
      <mesh>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial color="#6366f1" wireframe />
      </mesh>
    </group>
  );
}

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="w-1/2">
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              Smart Solve
              <span className="block text-indigo-600">Academic Solutions</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect with experts, solve problems, and excel in your academic journey.
            </p>
            <Link
              to="/questions"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
          <div className="w-1/2 h-[400px]">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <Brain3D />
              <OrbitControls autoRotate />
            </Canvas>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose Smart Solve?
          </h2>
          <div className="grid grid-cols-4 gap-8">
            <div className="p-6 bg-gray-50 rounded-xl">
              <Brain className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Solutions</h3>
              <p className="text-gray-600">
                Get intelligent answers to your academic questions
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <Users className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Expert Network</h3>
              <p className="text-gray-600">
                Connect with verified faculty and top students
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <MessageSquare className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
              <p className="text-gray-600">
                Instant communication for quick problem-solving
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <School className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">University Focus</h3>
              <p className="text-gray-600">
                Tailored for your academic institution
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-indigo-600">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-5xl font-bold text-white mb-2">10K+</h3>
              <p className="text-indigo-100">Questions Solved</p>
            </div>
            <div>
              <h3 className="text-5xl font-bold text-white mb-2">500+</h3>
              <p className="text-indigo-100">Expert Tutors</p>
            </div>
            <div>
              <h3 className="text-5xl font-bold text-white mb-2">50+</h3>
              <p className="text-indigo-100">Universities</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;