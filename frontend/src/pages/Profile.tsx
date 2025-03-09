import React from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, BookOpen, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600" />
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white -mt-12 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.role}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-5 h-5" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <BookOpen className="w-5 h-5" />
              <span>12 Questions Asked</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>Joined March 2024</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                <p className="text-gray-900">Asked a question about Quantum Physics</p>
                <span className="text-sm text-gray-500">2 days ago</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-600">15</h3>
              <p className="text-gray-600">Questions</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-600">42</h3>
              <p className="text-gray-600">Answers</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-600">89%</h3>
              <p className="text-gray-600">Success Rate</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-600">4.8</h3>
              <p className="text-gray-600">Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;