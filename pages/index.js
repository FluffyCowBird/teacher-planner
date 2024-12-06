import React, { useState, useEffect } from 'react';

// Main TeacherPlanner component
const TeacherPlanner = () => {
  // State definitions
  const [classes, setClasses] = useState([]);
  const [currentView, setCurrentView] = useState('setup');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [calendarData, setCalendarData] = useState({
    firstDay: '',
    specialDays: {}
  });

  // Class Setup Component - Defined BEFORE it's used
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

  // Student Management Component
  const StudentManagement = () => {
    const [newStudentName, setNewStudentName] = useState('');
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Manage Students</h2>
          <div className="mb-4">
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Enter student name"
                />
                <button
                  onClick={() => {
                    if (newStudentName.trim()) {
                      addStudent(selectedClass, newStudentName.trim());
                      setNewStudentName('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Add Student
                </button>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Current Students</h3>
                <div className="space-y-2">
                  {classes.find(c => c.id === selectedClass)?.students?.map(student => (
                    <div key={student.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{student.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Calendar Setup Component
  const CalendarSetup = () => {
    const [newDate, setNewDate] = useState('');
    const [dateType, setDateType] = useState('non-academic');
    const [description, setDescription] = useState('');

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Calendar Setup</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">First Day of School</label>
            <input
              type="date"
              value={calendarData.firstDay}
              onChange={(e) => setCalendarData(prev => ({
                ...prev,
                firstDay: e.target.value
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            />
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Add Special Days</h3>
            <div className="grid gap-4">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
              <select
                value={dateType}
                onChange={(e) => setDateType(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2"
              >
                <option value="non-academic">Non-Academic Day</option>
                <option value="no-school">No School</option>
              </select>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (e.g., Assembly Day)"
                className="block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
              <button
                onClick={() => {
                  if (newDate) {
                    setCalendarData(prev => ({
                      ...prev,
                      specialDays: {
                        ...prev.specialDays,
                        [newDate]: { type: dateType, description }
                      }
                    }));
                    setNewDate('');
                    setDescription('');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Add Special Day
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Special Days</h3>
            <div className="space-y-2">
              {Object.entries(calendarData.specialDays)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, info]) => (
                  <div key={date} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{new Date(date).toLocaleDateString()} - {info.type} - {info.description}</span>
                    <button
                      onClick={() => {
                        setCalendarData(prev => {
                          const newSpecialDays = { ...prev.specialDays };
                          delete newSpecialDays[date];
                          return { ...prev, specialDays: newSpecialDays };
                        });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Load data effect
  useEffect(() => {
    try {
      const savedClasses = localStorage.getItem('teacherPlannerClasses');
      const savedCalendar = localStorage.getItem('teacherPlannerCalendar');
      
      if (savedClasses) {
        setClasses(JSON.parse(savedClasses));
      }
      if (savedCalendar) {
        setCalendarData(JSON.parse(savedCalendar));
      }
    } catch (err) {
      setError('Failed to load saved data');
    }
  }, []);

  // Save data effect
  useEffect(() => {
    localStorage.setItem('teacherPlannerClasses', JSON.stringify(classes));
    localStorage.setItem('teacherPlannerCalendar', JSON.stringify(calendarData));
  }, [classes, calendarData]);

  // Helper functions
  const isSchoolDay = (date) => {
    const dayType = calendarData.specialDays[date]?.type;
    return dayType !== 'no-school';
  };

  const isAcademicDay = (date) => {
    const dayType = calendarData.specialDays[date]?.type;
    return isSchoolDay(date) && dayType !== 'non-academic';
  };

  const calculateDayType = (date) => {
    if (!calendarData.firstDay || !isAcademicDay(date)) {
      return null;
    }

    let academicDayCount = 0;
    const startDate = new Date(calendarData.firstDay);
    const targetDate = new Date(date);
    
    for (let d = startDate; d <= targetDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      if (isAcademicDay(dateString)) {
        academicDayCount++;
      }
    }

    return academicDayCount % 2 === 0 ? 'even' : 'odd';
  };

  // Class management functions
  const addClass = (name, grade, schedule) => {
    try {
      setError(null);
      const newClass = {
        id: Date.now().toString(),
        name,
        grade,
        schedule,
        attendance: {},
        students: [],
        lessons: {}
      };
      setClasses(prev => [...prev, newClass]);
      alert('Class added successfully!');
    } catch (err) {
      setError('Failed to add class. Please try again.');
    }
  };

  const addStudent = (classId, studentName) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: [
            ...(cls.students || []),
            { id: Date.now().toString(), name: studentName }
          ]
        };
      }
      return cls;
    }));
  };

  // Attendance management
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

  // Attendance View Component
  const AttendanceView = () => {
    const dayType = calculateDayType(selectedDate);
    const specialDay = calendarData.specialDays[selectedDate];

    if (!isSchoolDay(selectedDate)) {
      return (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-700">No school on this date.</p>
          {specialDay?.description && (
            <p className="text-yellow-600 mt-2">{specialDay.description}</p>
          )}
        </div>
      );
    }

    if (!isAcademicDay(selectedDate)) {
      return (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-700">Non-academic day.</p>
          {specialDay?.description && (
            <p className="text-blue-600 mt-2">{specialDay.description}</p>
          )}
        </div>
      );
    }

    const relevantClasses = classes.filter(cls => cls.schedule === dayType);

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700">
            {dayType ? `${dayType.toUpperCase()} Day` : 'Please set first day of school in Calendar Setup'}
          </p>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-2 block w-full max-w-xs rounded-md border-gray-300 shadow-sm p-2"
          />
        </div>

        {relevantClasses.map(cls => (
          <div key={cls.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{cls.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {(cls.students || []).map(student => {
                const status = cls.attendance[selectedDate]?.[student.id] || '';
                return (
                  <button
                    key={student.id}
                    onClick={() => {
                      const nextStatus = {
                        '': 'present',
                        'present': 'absent',
                        'absent': 'tardy',
                        'tardy': ''
                      }[status];
                      updateAttendance(cls.id, student.id, nextStatus);
                    }}
                    className={`
                      p-2 rounded-md flex items-center justify-between
                      ${status === 'present' ? 'bg-green-100 text-green-800' : ''}
                      ${status === 'absent' ? 'bg-red-100 text-red-800' : ''}
                      ${status === 'tardy' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}
                    `}
                  >
`}
                  >
                    <span>{student.name}</span>
                    <span className="text-sm">
                      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not set'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Main render
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
              onClick={() => setCurrentView('calendar')}
              className={`px-4 py-2 rounded-md ${
                currentView === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600'
              }`}
            >
              Calendar Setup
            </button>
            <button
              onClick={() => setCurrentView('students')}
              className={`px-4 py-2 rounded-md ${
                currentView === 'students'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600'
              }`}
            >
              Manage Students
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
          {currentView === 'calendar' && <CalendarSetup />}
          {currentView === 'students' && <StudentManagement />}
          {currentView === 'attendance' && <AttendanceView />}
        </div>
      </main>
    </div>
  );
};

export default TeacherPlanner;
