import React, { useState, useEffect } from 'react';
import { Plus, Clock, Calendar, Trash2, X } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

interface Task {
  id: string;
  time: string;
  task: string;
}

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

function Scheduler() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [newTask, setNewTask] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  // Add function to fetch tasks
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await fetch('http://127.0.0.1:5050/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      console.log('Fetched tasks:', data.tasks);
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (hours && minutes && newTask) {
        let hour24 = parseInt(hours, 10);
        if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (ampm === 'AM' && hour24 === 12) hour24 = 0;
        const time24 = `${hour24.toString().padStart(2, '0')}:${minutes}`;

        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const userEmail = user?.email;

        if (!token || !userEmail) {
          throw new Error('You must be logged in to add a task');
        }

        const response = await fetch('http://127.0.0.1:5050/api/add_task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            task: newTask,
            time: time24,
            userEmail: userEmail
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add task');
        }

        const result = await response.json();
        console.log('Add task response:', result);

        setTasks(prevTasks => [...prevTasks, {
          id: result.task.id,
          time: time24,
          task: newTask
        }]);

        // Reset form
        setHours('12');
        setMinutes('00');
        setAmpm('AM');
        setNewTask('');
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      setError(error instanceof Error ? error.message : 'Failed to add task');
    }
  };

  // Modify handleDelete to delete from backend
  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`http://127.0.0.1:5050/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete task');
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Task Scheduler</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors duration-200 shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
          </button>
        </div>

        {error && <div className="text-red-400 mb-4">Error: {error}</div>}

        {showForm && (
          <form onSubmit={handleAddTask} className="mb-6">
            <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-600/50 shadow-lg backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  New Task
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                  <div className="flex space-x-2">
                    <select
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="bg-gray-800/50 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <select
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="bg-gray-800/50 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <option key={m} value={m.toString().padStart(2, '0')}>
                          {m.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <select
                      value={ampm}
                      onChange={(e) => setAmpm(e.target.value as 'AM' | 'PM')}
                      className="bg-gray-800/50 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="task" className="block text-sm font-medium text-gray-300 mb-2">
                    Task Description
                  </label>
                  <input
                    type="text"
                    id="task"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Enter your task"
                    className="w-full bg-gray-800/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Task
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {tasks
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((task) => (
              <div
                key={task.id}
                className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 flex items-center justify-between group hover:bg-gray-700/40"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">{task.task}</p>
                    <p className="text-sm text-gray-400">{task.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
        </div>

        {tasks.length === 0 && !showForm && (
          <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-700/50 rounded-xl">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <p>No tasks scheduled. Click the plus button to add a task.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scheduler;
