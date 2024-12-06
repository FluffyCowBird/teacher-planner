import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://jkjrpaxoqtpguktitywu.supabase.co/",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpranJwYXhvcXRwZ3VrdGl0eXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MzgyNjAsImV4cCI6MjA0OTAxNDI2MH0.9hx8tqXkHABSfzCoNwoTUQ8JGXdQv0Wrz8lE8G_Ms1Q"
);

const PlanningView = ({ classes, selectedDate, updateLesson }) => {
  return (
    <div className="space-y-6">
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm p-2"
      />
      {classes.map(cls => (
        <div key={cls.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{cls.name}</h3>
            <span className="text-sm text-gray-500">
              Grade {cls.grade} - {cls.schedule} Days
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Objectives</label>
              <textarea
                value={cls.lessons?.[selectedDate]?.objectives || ''}
                onChange={(e) => updateLesson(cls.id, selectedDate, 'objectives', e.target.value)}
                className="w-full min-h-[100px] rounded-md border-gray-300 shadow-sm p-2"
                placeholder="Learning objectives for this lesson..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Warm-up</label>
              <textarea
                value={cls.lessons?.[selectedDate]?.warmup || ''}
                onChange={(e) => updateLesson(cls.id, selectedDate, 'warmup', e.target.value)}
                className="w-full min-h-[100px] rounded-md border-gray-300 shadow-sm p-2"
                placeholder="Opening activity..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Main Lesson</label>
              <textarea
                value={cls.lessons?.[selectedDate]?.main || ''}
                onChange={(e) => updateLesson(cls.id, selectedDate, 'main', e.target.value)}
                className="w-full min-h-[150px] rounded-md border-gray-300 shadow-sm p-2"
                placeholder="Main lesson content and activities..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assessment/Exit Ticket</label>
              <textarea
                value={cls.lessons?.[selectedDate]?.exit || ''}
                onChange={(e) => updateLesson(cls.id, selectedDate, 'exit', e.target.value)}
                className="w-full min-h-[100px] rounded-md border-gray-300 shadow-sm p-2"
                placeholder="Exit ticket or assessment..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Homework</label>
              <textarea
                value={cls.lessons?.[selectedDate]?.homework || ''}
                onChange={(e) => updateLesson(cls.id, selectedDate, 'homework', e.target.value)}
                className="w-full min-h-[100px] rounded-md border-gray-300 shadow-sm p-2"
                placeholder="Homework assignment..."
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AttendanceView = ({ classes, selectedDate, formatDate, updateAttendance }) => (
  <div className="space-y-6">
    <input
      type="date"
      value={formatDate(selectedDate)}
      onChange={(e) => setSelectedDate(new Date(e.target.value))}
      className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm p-2"
    />
    {classes.map(cls => (
      <div key={cls.id} className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{cls.name}</h3>
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 25 }, (_, i) => i + 1).map(studentId => {
            const status = cls.attendance[formatDate(selectedDate)]?.[studentId] || '';
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
                  updateAttendance(cls.id, selectedDate, studentId, nextStatus);
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

const ClassSetup = ({ addClass }) => (
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
          <label className="block text-sm font-medium text-gray-700">Grade</label>
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

const TeacherPlanner = () => {
  const [classes, setClasses] = useState([]);
  const [currentView, setCurrentView] = useState('planning');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*');
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes. Please try refreshing the page.');
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const addClass = async (name, grade, schedule) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('classes')
        .insert([{ 
          name, 
          grade, 
          schedule, 
          attendance: {}, 
          lessons: {} 
        }])
        .select();
      
      if (error) throw error;
      
      if (data) {
        setClasses([...classes, data[0]]);
        alert('Class added successfully!');
      }
    } catch (error) {
      console.error('Error adding class:', error);
      setError('Failed to add class. Please try again.');
    }
  };

  const updateLesson = async (classId, date, section, content) => {
    try {
      const classToUpdate = classes.find(c => c.id === classId);
      if (!classToUpdate) return;

      const updatedLessons = {
        ...classToUpdate.lessons,
        [date]: {
          ...(classToUpdate.lessons[date] || {}),
          [section]: content
        }
      };

      const { error } = await supabase
        .from('classes')
        .update({ lessons: updatedLessons })
        .eq('id', classId);

      if (error) throw error;

      setClasses(classes.map(cls =>
        cls.id === classId
          ? { ...cls, lessons: updatedLessons }
          : cls
      ));
    } catch (error) {
      console.error('Error updating lesson:', error);
      setError('Failed to save lesson. Please try again.');
    }
  };

  const updateAttendance = async (classId, date, studentId, status) => {
    try {
      const dateStr = formatDate(date);
      const classToUpdate = classes.find(c => c.id === classId);
      if (!classToUpdate) return;

      const updatedAttendance = {
        ...classToUpdate.attendance,
        [dateStr]: {
          ...(classToUpdate.attendance[dateStr] || {}),
          [studentId]: status
        }
      };

      const { error } = await supabase
        .from('classes')
        .update({ attendance: updatedAttendance })
        .eq('id', classId);

      if (error) throw error;

      setClasses(classes.map(cls =>
        cls.id === classId
          ? { ...cls, attendance: updatedAttendance }
          : cls
      ));
    } catch (error) {
      console.error('Error updating attendance:', error);
      setError('Failed to update attendance. Please try again.');
    }
  };

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
              onClick={() => setCurrentView('planning')}
              className={`px-4 py-2 rounded-md ${
                currentView === 'planning'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600'
              }`}
            >
              Lesson Planning
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
            <button
              onClick={() => setCurrentView('reports')}
              className={`px-4 py-2 rounded-md ${
                currentView === 'reports'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600'
              }`}
            >
              Attendance Reports
            </button>
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
          </div>

          {currentView === 'planning' && (
            <PlanningView 
              classes={classes}
              selectedDate={selectedDate}
              updateLesson={updateLesson}
            />
          )}
          {currentView === 'attendance' && (
            <AttendanceView 
              classes={classes}
              selectedDate={selectedDate}
              formatDate={formatDate}
              updateAttendance={updateAttendance}
            />
          )}
          {currentView === 'setup' && (
            <ClassSetup addClass={addClass} />
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherPlanner;
