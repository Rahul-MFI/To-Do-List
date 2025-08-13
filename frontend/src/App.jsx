import React, { useState } from 'react';
import { Plus, Check, X, Edit2, Save } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
        createdAt: new Date().toLocaleString()
      };
      setTasks([...tasks, task]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const deleteTasks = (id) => {
    setTasks(tasks.filter(task => task.Id === id))
  }

  const startEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (editText.trim()) {
      setTasks(tasks.map(task => 
        task.id === editingId ? { ...task, text: editText.trim() } : task
      ));
    }
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-800 mb-2">Todo App</h1>
          <p className="text-orange-600">Stay organized and productive!</p>
          {totalCount > 0 && (
            <div className="mt-4 inline-block bg-white rounded-full px-4 py-2 shadow-sm">
              <span className="text-orange-700 font-medium">
                {completedCount} of {totalCount} tasks completed
              </span>
            </div>
          )}
        </div>

        {/* Add Task Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-orange-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-3 border-2 border-yellow-200 rounded-lg focus:outline-none focus:border-orange-400 text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={addTask}
              className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-6 py-3 rounded-lg hover:from-orange-500 hover:to-yellow-500 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus size={20} />
              Add
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-orange-600 text-lg">No tasks yet. Add one above to get started!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-xl shadow-md p-4 border-2 transition-all duration-200 hover:shadow-lg ${
                  task.completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-yellow-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      task.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-orange-300 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    {task.completed && <Check size={16} />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1">
                    {editingId === task.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                          className="flex-1 px-3 py-1 border border-orange-300 rounded focus:outline-none focus:border-orange-500"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          className="p-1 text-green-600 hover:text-green-800"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p
                          className={`text-lg ${
                            task.completed
                              ? 'line-through text-gray-500'
                              : 'text-gray-800'
                          }`}
                        >
                          {task.text}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Created: {task.createdAt}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingId !== task.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(task.id, task.text)}
                        className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex gap-4 text-sm text-orange-600">
              <span>Total: {totalCount}</span>
              <span>•</span>
              <span>Completed: {completedCount}</span>
              <span>•</span>
              <span>Remaining: {totalCount - completedCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}