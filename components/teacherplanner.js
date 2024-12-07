import React, { useState, useEffect } from 'react';

// Status configuration
const STATUS_GROUPS = {
  performance: {
    label: "Performance",
    options: {
      exceptional_performance: "Exceptional Performance",
      exceptional_participation: "Exceptional Participation",
      outstanding_effort: "Outstanding Effort"
    },
    color: "bg-green-100 text-green-800"
  },
  discipline: {
    label: "Discipline",
    options: {
      discipline_improvement: "Discipline Improvement",
      discipline_issues: "Discipline Issues",
      office_referral: "Office Referral"
    },
    color: "bg-red-100 text-red-800"
  },
  checkIns: {
    label: "Check-ins",
    options: {
      after_school_scheduled: "After-school Chat Scheduled",
      after_school_attended: "After-school Chat Completed",
      after_school_missed: "After-school Chat Missed",
      after_class_scheduled: "After-class Chat Scheduled",
      after_class_attended: "After-class Chat Completed",
      after_class_missed: "After-class Chat Missed"
    },
    color: "bg-blue-100 text-blue-800"
  }
};

const STATUS_ICONS = {
  exceptional_performance: "⭐",
  exceptional_participation: "🌟",
  outstanding_effort: "💫",
  discipline_improvement: "📈",
  discipline_issues: "⚠️",
  office_referral: "📋",
  after_school_scheduled: "📅",
  after_school_attended: "✅",
  after_school_missed: "❌",
  after_class_scheduled: "⏰",
  after_class_attended: "✔️",
  after_class_missed: "❌"
};

// Student Status Component
const StudentStatusButton = ({ student, onUpdateStatus }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div className="relative inline-block text-left">
      <div 
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded hover:bg-gray-50 cursor-pointer flex items-center gap-2"
      >
        <span>{student.name}</span>
        {student.statuses?.map(status => (
          <span key={status} className="text-sm" title={STATUS_GROUPS[status]?.label}>
            {STATUS_ICONS[status]}
          </span>
        ))}
      </div>

      {showMenu && (
        <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="p-1">
            {Object.entries(STATUS_GROUPS).map(([groupKey, group]) => (
              <div key={groupKey} className="px-2 py-1">
                <div className="text-xs font-semibold text-gray-700 mb-1">
                  {group.label}
                </div>
                {Object.entries(group.options).map(([key, label]) => {
                  const isActive = student.statuses?.includes(key);
                  return (
                    <div
                      key={key}
                      onClick={() => onUpdateStatus(key)}
                      className={`
                        px-2 py-1 text-sm rounded cursor-pointer
                        ${isActive ? group.color : 'hover:bg-gray-100'}
                        flex items-center gap-2
                      `}
                    >
                      <span>{STATUS_ICONS[key]}</span>
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main TeacherPlanner Component
const TeacherPlanner = () => {
  const [classes, setClasses] = useState([]);
  const [currentView, setCurrentView] = useState('setup');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [error, setError] = useState(null);

  // Load saved data
  useEffect(() => {
    try {
      const savedClasses = localStorage.getItem('teacherPlannerClasses');
      if (savedClasses) {
        setClasses(JSON.parse(savedClasses));
      }
    } catch (err) {
      setError('Failed to load saved data');
    }
  }, []);

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem('teacherPlannerClasses', JSON.stringify(classes));
  }, [classes]);

  // Update student status
  const updateStudentStatus = (classId, studentId, status) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: cls.students.map(student => {
            if (student.id === studentId) {
              const currentStatuses = student.statuses || [];
              const newStatuses = currentStatuses.includes(status)
                ? currentStatuses.filter(s => s !== status)
                : [...currentStatuses, status];
              
              return {
                ...student,
                statuses: newStatuses
              };
            }
            return student;
          })
        };
      }
      return cls;
    }));
  };

  // Class management
  const addClass = (name, grade, schedule) => {
    try {
      setError(null);
      const newClass = {
        id: Date.now().toString(),
        name,
        grade,
        schedule,
        students: [],
        attendance: {}
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
            {
              id: Date.now().toString(),
              name: studentName,
              statuses: []
            }
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

  // Component for class setup
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

  // Component for student management
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
              <div className="flex gap-2 mb-4">
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
                    <StudentStatusButton
                      key={student.id}
                      student={student}
                      onUpdateStatus={(status) => updateStudentStatus(selectedClass, student.id, status)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Component for attendance
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
          <div className="grid grid-cols-1 gap-4">
            {(cls.students || []).map(student => (
              <div key={student.id} className="flex items-center justify-between">
                <StudentStatusButton
                  student={student}
                  onUpdateStatus={(status) => updateStudentStatus(cls.id, student.id, status)}
                />
                <div className="flex gap-2">
                  {['present', 'absent', 'tardy'].map(status => {
                    const isActive = cls.attendance[selectedDate]?.[student.id] === status;
                    return (
                      <button
                        key={status}
                        onClick={() => updateAttendance(cls.id, student.id, isActive ? '' : status)}
                        className={`
                          px-3 py-1 rounded-md text-sm
                          ${isActive ? (
                            status === 'present' ? 'bg-green-100 text-green-800' :
                            status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          ) : 'bg-gray-100'}
                        `}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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
          {currentView === 'students' && <StudentManagement />}
          {currentView === 'attendance' && <AttendanceView />}
        </div>
      </main>
    </div>
  );
};

export default TeacherPlanner;
