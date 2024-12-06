import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://jkjrpaxoqtpguktitywu.supabase.co/",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpranJwYXhvcXRwZ3VrdGl0eXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MzgyNjAsImV4cCI6MjA0OTAxNDI2MH0.9hx8tqXkHABSfzCoNwoTUQ8JGXdQv0Wrz8lE8G_Ms1Q"
);

// First, define all components that will be used
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

const AttendanceReport = ({ classes, selectedClass, setSelectedClass, selectedStudent, setSelectedStudent, dateRange, setDateRange }) => {
  const generateReport = () => {
    if (!selectedClass || !selectedStudent || !dateRange.start || !dateRange.end) return null;

    const classData = classes.find(c => c.id === selectedClass);
    if (!classData) return null;

    const records = Object.entries(classData.attendance || {})
      .filter(([date]) => {
        const currentDate = new Date(date);
        return currentDate >= new Date(dateRange.start) &&
               currentDate <= new Date(dateRange.end);
      })
      .map(([date, data]) => ({
        date,
        status: data[selectedStudent] || 'absent'
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const stats = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      tardy: records.filter(r => r.status === 'tardy').length,
      total: records.length
    };

    return { records, stats };
  };

  const report = generateReport();

  return (
    <div className="space-y-6">
      {/* Report generation form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Generate Attendance Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Select a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Select a student...</option>
              {Array.from({ length: 25 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Student {i + 1}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>
        <button
          onClick={() => window.print()}
          disabled={!report}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
        >
          Print Report
        </button>
      </div>

      {/* Report display */}
      {report && (
        <div className="bg-white rounded-lg shadow p-6 print:shadow-none">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Attendance Report</h2>
            <p>Student {selectedStudent} - {classes.find(c => c.id === selectedClass)?.name}</p>
            <p className="text-gray-600">
              {dateRange.start} to {dateRange.end}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Summary</h3>
              <ul className="space-y-1">
                <li>Present: {report.stats.present} days</li>
                <li>Absent: {report.stats.absent} days</li>
                <li>Tardy: {report.stats.tardy} days</li>
                <li className="font-semibold">
                  Attendance Rate: {((report.stats.present / report.stats.total) * 100).toFixed(1)}%
                </li>
              </ul>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.records.map(record => (
                <tr key={record.date} className="border-t">
                  <td className="px-4 py-2">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`
                      px-2 py-1 rounded-full text-sm
                      ${record.status === 'present' ? 'bg-green-100 text-green-800' : ''}
                      ${record.status === 'absent' ? 'bg-red-100 text-red-800' : ''}
                      ${record.status === 'tardy' ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Main TeacherPlanner component
const TeacherPlanner = () => {
  const [classes, setClasses] = useState([]);
  const [currentView, setCurrentView] = useState('attendance');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

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
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const addClass = async (name, grade, schedule) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([{ name, grade, schedule, attendance: {}, lessons: {} }])
        .select();
      if (error) throw error;
      if (data) {
        setClasses([...classes, data[0]]);
      }
    } catch (error) {
      console.error('Error adding class:', error);
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
          <div className="flex gap-4 mb-6">
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

          {currentView === 'attendance' && (
            <AttendanceView 
              classes={classes}
              selectedDate={selectedDate}
              formatDate={formatDate}
              updateAttendance={updateAttendance}
            />
          )}
          {currentView === 'reports' && (
            <AttendanceReport
              classes={classes}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              dateRange={dateRange}
              setDateRange={setDateRange}
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
