import React, { useState, useEffect } from 'react';

const TeacherPlanner = () => {
  const [classes, setClasses] = useState([]);
  const [currentView, setCurrentView] = useState('setup');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);

  // Load saved data on mount
  useEffect(() => {
    const savedClasses = localStorage.getItem('teacherPlannerClasses');
    if (savedClasses) {
      try {
        setClasses(JSON.parse(savedClasses));
      } catch (err) {
        setError('Failed to load saved classes');
      }
    }
  }, []);

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem('teacherPlannerClasses', JSON.stringify(classes));
  }, [classes]);

  const addClass = (name, grade, schedule) => {
    try {
      setError(null);
      const newClass = {
        id: Date.now().toString(),
        name,
        grade,
        schedule,
        attendance: {},
        lessons: {}
      };
      setClasses(prev => [...prev, newClass]);
      alert('Class added successfully!');
    } catch (err) {
      setError('Failed to add class. Please try again.');
    }
  };

  const updateAttendance = (classId, studentId, status) => {
    try {
      setError(null);
      setClasses(prev => prev.map(cls => {
        if (cls.id === classId) {
          return {
            ...cls,
            attendance: {
              ...cls.attendance,
              [selectedDate]: {
                ...(cls.attendance[selectedDate] || {}),
                [studentId]: status
              }
            }
          };
        }
        return cls;
      }));
    } catch (err) {
      setError('Failed to update attendance. Please try again.');
    }
  };

  const ClassSetup = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Add New Class</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        addClass(
          formData.get('name'),
          formData.get('grade'),
          formData.get('schedule')
        );
        e.target.reset();
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Name</label>
            <input
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              placeholder="e.g., Math Period 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Grade Level</label>
            <select
              name="grade"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            >
              <option value="6">6th Grade</option>
              <option value="7">7th Grade</option>
              <option value="8">8th Grade</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Schedule</label>
            <select
              name="schedule"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            >
              <option value="even">Even Days</option>
              <option value="odd">Odd Days</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Class
          </button>
        </div>
      </form>
    </div>
  );

  const AttendanceView = () => (
    <div className="space-y-6">
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm p-2"
      />
      {classes.map(cls => (
        <div key={cls.id} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">{cls.name}</h3>
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: 25 }, (_, i) => i + 1).map(studentId => {
              const status = cls.attendance[selectedDate]?.[studentId] || '';
              return (
                <button
                  key={studentId}
                  onClick={() => {
                    const nextStatus = {
                      '': 'present',
                      'present': 'absent',
                      'absent': 'tardy',
                      'tardy': ''
                    }[status];
                    updateAttendance(cls.id, studentId, nextStatus);
                  }}
                  className={`
                    w-10 h-10 rounded-md flex items-center justify-center text-sm
                    ${status === 'present' ? 'bg-green-100 text-green-800' : ''}
                    ${status === 'absent' ? 'bg-red-100 text-red-800' : ''}
                    ${status === 'tardy' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}
                  `}
                >
                  {studentId}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div lang="en">
      <main className="min-h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">Teacher Planner</h1>
          </div>
        </header>

        <div className="container mx-auto p-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setCurrentView('setup')}
              className={`px-4 py-2 rounded-md ${
                currentView === 'setup'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600'
              }`}
            >
              Class Setup
            </button>
            <button
              onClick={() => setCurrentView('attendance')}
              className={`px-4 py-2 rounded-md ${
                currentView === 'attendance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600'
              }`}
            >
              Take Attendance
            </button>
          </div>

          {currentView === 'setup' && <ClassSetup />}
          {currentView === 'attendance' && <AttendanceView />}
        </div>
      </main>
    </div>
  );
};

export default TeacherPlanner;
