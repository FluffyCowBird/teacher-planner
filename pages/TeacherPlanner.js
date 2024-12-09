import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0';

// Constants and Types
const DAY_TYPES = {
  ODD: 'odd',
  EVEN: 'even',
  WORKSHOP: 'workshop',
  ASSEMBLY: 'assembly',
  SNOW: 'snow',
  HOLIDAY: 'holiday',
  EARLY_RELEASE: 'early_release',
  OTHER: 'other'
};

const GRADE_LEVELS = [6, 7, 8];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const STATUS_TYPES = {
  PERFORMANCE: {
    EXCEPTIONAL: { icon: '⭐', label: 'Exceptional Performance' },
    IMPROVED: { icon: '📈', label: 'Improved Performance' },
    DECLINING: { icon: '📉', label: 'Declining Performance' }
  },
  BEHAVIOR: {
    POSITIVE: { icon: '👍', label: 'Positive Behavior' },
    DISRUPTIVE: { icon: '⚠️', label: 'Disruptive Behavior' },
    REFERRAL: { icon: '📋', label: 'Office Referral' }
  },
  ENGAGEMENT: {
    HIGH: { icon: '🌟', label: 'High Engagement' },
    LOW: { icon: '😴', label: 'Low Engagement' }
  },
  COMMUNICATION: {
    PARENT_CONTACT: { icon: '📞', label: 'Parent Contact Made' },
    CONFERENCE_NEEDED: { icon: '🤝', label: 'Conference Needed' }
  }
};

const ATTENDANCE_TYPES = {
  PRESENT: 'present',
  ABSENT: 'absent',
  TARDY: 'tardy',
  EXCUSED: 'excused'
};

const TeacherPlanner = () => {
  // State Management
  const [view, setView] = useState('calendar');
  const [calendar, setCalendar] = useState({});
  const [units, setUnits] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentUnit, setCurrentUnit] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  const [templates, setTemplates] = useState({});
  const [lessonPlans, setLessonPlans] = useState({});
  const [assessments, setAssessments] = useState({});
  const [settings, setSettings] = useState({
    schoolYear: {
      start: null,
      end: null
    },
    terms: [],
    defaultDayType: DAY_TYPES.ODD
  });

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = localStorage.getItem('teacherPlannerData');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setCalendar(parsed.calendar || {});
          setUnits(parsed.units || []);
          setClasses(parsed.classes || []);
          setTemplates(parsed.templates || {});
          setLessonPlans(parsed.lessonPlans || {});
          setAssessments(parsed.assessments || {});
          setSettings(parsed.settings || {
            schoolYear: { start: null, end: null },
            terms: [],
            defaultDayType: DAY_TYPES.ODD
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Implement error handling/recovery
      }
    };
    loadData();
  }, []);

  // Auto-save data changes
  useEffect(() => {
    const saveData = () => {
      try {
        localStorage.setItem('teacherPlannerData', JSON.stringify({
          calendar,
          units,
          classes,
          templates,
          lessonPlans,
          assessments,
          settings
        }));
      } catch (error) {
        console.error('Error saving data:', error);
        // Implement error handling/user notification
      }
    };

    const debounceTimer = setTimeout(saveData, 1000);
    return () => clearTimeout(debounceTimer);
  }, [calendar, units, classes, templates, lessonPlans, assessments, settings]);

  // Calendar Logic
  const calculateDayType = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if it's a specifically set day type
    if (calendar[dateStr]) return calendar[dateStr];
    
    // Find the most recent known day type
    const previousDates = Object.keys(calendar)
      .filter(d => d < dateStr)
      .sort((a, b) => new Date(b) - new Date(a));
    
    if (previousDates.length === 0) {
      return settings.defaultDayType;
    }

    let lastRegularDay = null;
    let skipDays = 0;

    for (const d of previousDates) {
      const type = calendar[d];
      if (type === DAY_TYPES.ODD || type === DAY_TYPES.EVEN) {
        lastRegularDay = { date: d, type };
        break;
      }
      skipDays++;
    }

    if (!lastRegularDay) return settings.defaultDayType;

    const daysDiff = Math.floor(
      (new Date(dateStr) - new Date(lastRegularDay.date)) / (1000 * 60 * 60 * 24)
    );
    
    const effectiveDays = daysDiff - skipDays;
    
    return effectiveDays % 2 === 0 
      ? lastRegularDay.type 
      : (lastRegularDay.type === DAY_TYPES.ODD ? DAY_TYPES.EVEN : DAY_TYPES.ODD);
  };
 // Unit Management
  const addUnit = (unitData) => {
    const newUnit = {
      id: Date.now(),
      title: unitData.title || 'New Unit',
      description: unitData.description || '',
      gradeLevel: unitData.gradeLevel,
      startDate: unitData.startDate,
      endDate: unitData.endDate,
      standards: unitData.standards || [],
      objectives: unitData.objectives || [],
      lessons: [],
      assessments: [],
      resources: [],
      notes: ''
    };

    setUnits(prev => [...prev, newUnit]);
    return newUnit.id;
  };

  const updateUnit = (unitId, updates) => {
    setUnits(prev => prev.map(unit => 
      unit.id === unitId ? { ...unit, ...updates } : unit
    ));
  };

  const deleteUnit = (unitId) => {
    setUnits(prev => prev.filter(unit => unit.id !== unitId));
  };

  // Lesson Planning
  const addLesson = (unitId, lessonData) => {
    const newLesson = {
      id: Date.now(),
      title: lessonData.title || 'New Lesson',
      description: lessonData.description || '',
      date: lessonData.date,
      dayType: calculateDayType(new Date(lessonData.date)),
      objectives: lessonData.objectives || [],
      activities: lessonData.activities || [],
      materials: lessonData.materials || [],
      homework: lessonData.homework || '',
      assessments: lessonData.assessments || [],
      differentiation: lessonData.differentiation || {},
      notes: ''
    };

    setUnits(prev => prev.map(unit => {
      if (unit.id === unitId) {
        return {
          ...unit,
          lessons: [...unit.lessons, newLesson]
        };
      }
      return unit;
    }));

    return newLesson.id;
  };

  const updateLesson = (unitId, lessonId, updates) => {
    setUnits(prev => prev.map(unit => {
      if (unit.id === unitId) {
        return {
          ...unit,
          lessons: unit.lessons.map(lesson =>
            lesson.id === lessonId ? { ...lesson, ...updates } : lesson
          )
        };
      }
      return unit;
    }));
  };

  const deleteLesson = (unitId, lessonId) => {
    setUnits(prev => prev.map(unit => {
      if (unit.id === unitId) {
        return {
          ...unit,
          lessons: unit.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }
      return unit;
    }));
  };

  // Template Management
  const saveTemplate = (templateData) => {
    const newTemplate = {
      id: Date.now(),
      title: templateData.title,
      gradeLevel: templateData.gradeLevel,
      description: templateData.description,
      structure: templateData.structure,
      components: templateData.components,
      defaultDuration: templateData.defaultDuration
    };

    setTemplates(prev => ({
      ...prev,
      [templateData.gradeLevel]: {
        ...(prev[templateData.gradeLevel] || {}),
        [newTemplate.id]: newTemplate
      }
    }));

    return newTemplate.id;
  };

  const useTemplate = (templateId, targetDate) => {
    const gradeLevel = Object.keys(templates).find(grade => 
      templates[grade][templateId]
    );
    
    if (!gradeLevel || !templates[gradeLevel][templateId]) {
      console.error('Template not found');
      return null;
    }

    const template = templates[gradeLevel][templateId];
    return addLesson(currentUnit.id, {
      ...template.structure,
      date: targetDate,
      title: template.title,
      description: template.description
    });
  };

 // Class Management
  const addClass = (classData) => {
    const newClass = {
      id: Date.now(),
      name: classData.name || 'New Class',
      gradeLevel: classData.gradeLevel,
      period: classData.period,
      dayType: classData.dayType,
      room: classData.room || '',
      students: [],
      attendance: {},
      assignments: [],
      notes: ''
    };

    setClasses(prev => [...prev, newClass]);
    return newClass.id;
  };

  const updateClass = (classId, updates) => {
    setClasses(prev => prev.map(cls =>
      cls.id === classId ? { ...cls, ...updates } : cls
    ));
  };

  const deleteClass = (classId) => {
    setClasses(prev => prev.filter(cls => cls.id !== classId));
  };

  // Student Management
  const addStudent = (classId, studentData) => {
    const newStudent = {
      id: Date.now(),
      name: studentData.name,
      number: studentData.number || '',
      email: studentData.email || '',
      guardianContact: studentData.guardianContact || '',
      status: [],
      attendance: {},
      grades: {},
      notes: '',
      accommodations: studentData.accommodations || ''
    };

    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: [...cls.students, newStudent]
        };
      }
      return cls;
    }));

    return newStudent.id;
  };

  const updateStudent = (classId, studentId, updates) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: cls.students.map(student =>
            student.id === studentId ? { ...student, ...updates } : student
          )
        };
      }
      return cls;
    }));
  };

  const updateStudentStatus = (classId, studentId, status) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: cls.students.map(student => {
            if (student.id === studentId) {
              const currentStatuses = student.status || [];
              const statusExists = currentStatuses.find(s => s.type === status.type);
              const newStatuses = statusExists
                ? currentStatuses.filter(s => s.type !== status.type)
                : [...currentStatuses, { ...status, date: new Date().toISOString() }];
              return { ...student, status: newStatuses };
            }
            return student;
          })
        };
      }
      return cls;
    }));
  };

  const updateAttendance = (classId, studentId, date, status) => {
    const dateStr = date.toISOString().split('T')[0];
    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: cls.students.map(student => {
            if (student.id === studentId) {
              return {
                ...student,
                attendance: {
                  ...student.attendance,
                  [dateStr]: status
                }
              };
            }
            return student;
          })
        };
      }
      return cls;
    }));
  };

  const addAssignment = (classId, assignmentData) => {
    const newAssignment = {
      id: Date.now(),
      title: assignmentData.title,
      description: assignmentData.description || '',
      dueDate: assignmentData.dueDate,
      type: assignmentData.type,
      totalPoints: assignmentData.totalPoints,
      grades: {}
    };

    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          assignments: [...cls.assignments, newAssignment]
        };
      }
      return cls;
    }));
  };

  const updateGrade = (classId, assignmentId, studentId, grade) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          assignments: cls.assignments.map(assignment => {
            if (assignment.id === assignmentId) {
              return {
                ...assignment,
                grades: {
                  ...assignment.grades,
                  [studentId]: grade
                }
              };
            }
            return assignment;
          })
        };
      }
      return cls;
    }));
  };

 // UI Components
  const renderCalendar = () => {
    const today = new Date(selectedDate);
    const month = today.getMonth();
    const year = today.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add padding for first week
    for (let i = 0; i < firstDay.getDay(); i++) {
      daysInMonth.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayType = calendar[dateStr] || calculateDayType(date);
      const isSelected = dateStr === selectedDate.toISOString().split('T')[0];
      const hasEvents = units.some(unit => 
        unit.lessons.some(lesson => lesson.date === dateStr)
      );

      daysInMonth.push(
        <div 
          key={dateStr}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${dayType}`}
          onClick={() => setSelectedDate(new Date(date))}
        >
          <div className="date-number">{date.getDate()}</div>
          <div className="day-type">{dayType}</div>
          {hasEvents && <div className="event-indicator">•</div>}
        </div>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={() => setSelectedDate(new Date(year, month - 1))}>←</button>
          <h2>{new Date(year, month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => setSelectedDate(new Date(year, month + 1))}>→</button>
        </div>
        <div className="calendar-grid">
          {dayNames.map(name => (
            <div key={name} className="day-name">{name}</div>
          ))}
          {daysInMonth}
        </div>
        <div className="day-detail">
          <h3>Selected Date: {selectedDate.toLocaleDateString()}</h3>
          <select 
            value={calendar[selectedDate.toISOString().split('T')[0]] || ''}
            onChange={(e) => updateDayType(selectedDate, e.target.value)}
          >
            {Object.entries(DAY_TYPES).map(([key, value]) => (
              <option key={key} value={value}>{key}</option>
            ))}
          </select>
          <div className="day-events">
            {units.map(unit => 
              unit.lessons
                .filter(lesson => lesson.date === selectedDate.toISOString().split('T')[0])
                .map(lesson => (
                  <div key={lesson.id} className="event-item">
                    <span className="event-title">{lesson.title}</span>
                    <span className="event-unit">({unit.title})</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUnitPlanner = () => {
    return (
      <div className="unit-planner">
        <div className="units-list">
          <div className="units-header">
            <h2>Units</h2>
            <button onClick={() => setCurrentUnit({
              title: 'New Unit',
              description: '',
              gradeLevel: GRADE_LEVELS[0],
              lessons: []
            })}>New Unit</button>
          </div>
          {units.map(unit => (
            <div 
              key={unit.id}
              className={`unit-item ${currentUnit?.id === unit.id ? 'selected' : ''}`}
              onClick={() => setCurrentUnit(unit)}
            >
              <div className="unit-title">{unit.title}</div>
              <div className="unit-meta">
                Grade {unit.gradeLevel} • {unit.lessons.length} lessons
              </div>
            </div>
          ))}
        </div>
        
        {currentUnit && (
          <div className="unit-editor">
            <div className="unit-header">
              <input
                type="text"
                value={currentUnit.title}
                onChange={(e) => updateUnit(currentUnit.id, { title: e.target.value })}
                className="unit-title-input"
              />
              <button onClick={() => deleteUnit(currentUnit.id)}>Delete Unit</button>
            </div>
            
            <div className="unit-content">
              <textarea
                value={currentUnit.description}
                onChange={(e) => updateUnit(currentUnit.id, { description: e.target.value })}
                placeholder="Unit description..."
                className="unit-description"
              />
              
              <div className="unit-lessons">
                <h3>Lessons</h3>
                {currentUnit.lessons.map(lesson => (
                  <div key={lesson.id} className="lesson-item">
                    <div className="lesson-header">
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLesson(currentUnit.id, lesson.id, { title: e.target.value })}
                      />
                      <input
                        type="date"
                        value={lesson.date}
                        onChange={(e) => updateLesson(currentUnit.id, lesson.id, { date: e.target.value })}
                      />
                    </div>
                    <textarea
                      value={lesson.description}
                      onChange={(e) => updateLesson(currentUnit.id, lesson.id, { description: e.target.value })}
                      placeholder="Lesson description..."
                    />
                    <button onClick={() => deleteLesson(currentUnit.id, lesson.id)}>Delete Lesson</button>
                  </div>
                ))}
                <button onClick={() => addLesson(currentUnit.id, {
                  title: 'New Lesson',
                  date: selectedDate.toISOString().split('T')[0]
                })}>Add Lesson</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

const renderClassManager = () => {
    return (
      <div className="class-manager">
        <div className="classes-list">
          <h2>Classes</h2>
          {classes.map(cls => (
            <div 
              key={cls.id} 
              className={`class-item ${currentClass?.id === cls.id ? 'selected' : ''}`}
              onClick={() => setCurrentClass(cls)}
            >
              <div className="class-header">
                <h3>{cls.name}</h3>
                <div className="class-meta">
                  Period {cls.period} • Grade {cls.gradeLevel} • {cls.dayType}
                </div>
              </div>
              {currentClass?.id === cls.id && (
                <div className="class-detail">
                  <div className="student-list">
                    {cls.students.map(student => (
                      <div key={student.id} className="student-item">
                        <div className="student-name">{student.name}</div>
                        <div className="student-status">
                          {student.status.map((status, idx) => (
                            <span key={idx} title={STATUS_TYPES[status.type].label}>
                              {STATUS_TYPES[status.type].icon}
                            </span>
                          ))}
                        </div>
                        <div className="student-actions">
                          <select 
                            value={student.attendance[selectedDate.toISOString().split('T')[0]] || ''}
                            onChange={(e) => updateAttendance(cls.id, student.id, selectedDate, e.target.value)}
                          >
                            <option value="">-</option>
                            {Object.entries(ATTENDANCE_TYPES).map(([key, value]) => (
                              <option key={key} value={value}>{key}</option>
                            ))}
                          </select>
                          <button onClick={() => updateStudentStatus(cls.id, student.id, {
                            type: 'PERFORMANCE.EXCEPTIONAL',
                            date: new Date().toISOString()
                          })}>Add Status</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addStudent(cls.id, { name: 'New Student' })}>
                      Add Student
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => addClass({
            name: 'New Class',
            gradeLevel: GRADE_LEVELS[0],
            period: 1,
            dayType: DAY_TYPES.ODD
          })}>Add Class</button>
        </div>
      </div>
    );
  };

  // Main Render
  return (
    <div className="teacher-planner">
      <nav className="planner-nav">
        <button onClick={() => setView('calendar')} className={view === 'calendar' ? 'active' : ''}>
          Calendar
        </button>
        <button onClick={() => setView('units')} className={view === 'units' ? 'active' : ''}>
          Units
        </button>
        <button onClick={() => setView('classes')} className={view === 'classes' ? 'active' : ''}>
          Classes
        </button>
      </nav>

      <main className="planner-content">
        {view === 'calendar' && renderCalendar()}
        {view === 'units' && renderUnitPlanner()}
        {view === 'classes' && renderClassManager()}
      </main>

      <style>{`
        .teacher-planner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .planner-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 5px;
        }

        .planner-nav button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: white;
          cursor: pointer;
        }

        .planner-nav button.active {
          background: #007bff;
          color: white;
        }

        .calendar-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
        }

        .calendar-day {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          min-height: 80px;
        }

        .calendar-day.selected {
          border-color: #007bff;
          background: #f0f7ff;
        }

        .unit-planner {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
        }

        .class-manager {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .class-item {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .class-item.selected {
          border-color: #007bff;
        }

        input, textarea, select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
        }

        button:hover {
          background: #0056b3;
        }
      `}</style>
    </div>
  );
};

// Initialize function
window.initializePlanner = function(rootId) {
  const root = ReactDOM.createRoot(document.getElementById(rootId));
  root.render(React.createElement(TeacherPlanner));
};
