import React, { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';

const Questions = () => {
  const [questions] = useState([
    {
      id: 1,
      title: "Understanding Quantum Mechanics Fundamentals",
      author: "John Doe",
      tags: ["Physics", "Quantum Mechanics"],
      status: "open",
      createdAt: "2024-02-28T10:00:00Z"
    },
    {
      id: 2,
      title: "Advanced Calculus Integration Techniques",
      author: "Jane Smith",
      tags: ["Mathematics", "Calculus"],
      status: "in-progress",
      createdAt: "2024-02-28T09:30:00Z"
    },
    {
      id: 3,
      title: "Data Structures in Computer Science",
      author: "Mike Johnson",
      tags: ["Computer Science", "Algorithms"],
      status: "resolved",
      createdAt: "2024-02-28T09:00:00Z"
    }
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-5 h-5" />
          Ask Question
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-900 hover:text-indigo-600 cursor-pointer">
                {question.title}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                question.status === 'open' ? 'bg-green-100 text-green-800' :
                question.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {question.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Posted by {question.author}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  {new Date(question.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                {question.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Questions;