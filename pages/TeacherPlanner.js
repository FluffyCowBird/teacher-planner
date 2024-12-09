const React = window.React;
const ReactDOM = window.ReactDOM;

// ============= CONSTANTS ===============
const DAY_TYPES = {
  ODD: 'odd',
  EVEN: 'even',
  WORKSHOP: 'workshop',
  ASSEMBLY: 'assembly',
  SNOW: 'snow',
  HOLIDAY: 'holiday',
  EARLY_RELEASE: 'early_release'
};

const GRADE_LEVELS = [6, 7, 8];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const STATUS_TYPES = {
  ACADEMIC: {
    EXCEPTIONAL: { icon: '⭐', label: 'Exceptional Work' },
    IMPROVING: { icon: '📈', label: 'Improving' },
    STRUGGLING: { icon: '❗', label: 'Needs Support' }
  },
  BEHAVIOR: {
    POSITIVE: { icon: '👏', label: 'Positive Behavior' },
    DISRUPTIVE: { icon: '⚠️', label: 'Disruptive' },
    REFERRAL: { icon: '📋', label: 'Office Referral' }
  },
  ATTENDANCE: {
    PRESENT: { icon: '✅', label: 'Present' },
    ABSENT: { icon: '❌', label: 'Absent' },
    TARDY: { icon: '⏰', label: 'Tardy' }
  }
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const TeacherPlanner = () => {
  // ============= STATE MANAGEMENT ===============
  const [view, setView] = React.useState('calendar');
  const [calendarView, setCalendarView] = React.useState('month'); // 'month' or 'week'
  const [calendar, setCalendar] = React.useState({});
  const [units, setUnits] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [students, setStudents] = React.useState({});  // Indexed by classId
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [currentUnit, setCurrentUnit] = React.useState(null);
  const [lessonTemplates, setLessonTemplates] = React.useState([]);
  const [filters, setFilters] = React.useState({
    gradeLevel: null,
    dayType: null,
    period: null
  });

  // ============= DATA LOADING & SAVING ===============
  React.useEffect(() => {
    const savedData = localStorage.getItem('teacherPlannerData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setCalendar(data.calendar || {});
      setUnits(data.units || []);
      setClasses(data.classes || []);
      setStudents(data.students || {});
      setLessonTemplates(data.lessonTemplates || []);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('teacherPlannerData', JSON.stringify({
      calendar,
      units,
      classes,
      students,
      lessonTemplates
    }));
  }, [calendar, units, classes, students, lessonTemplates]);

  // ============= CALENDAR FUNCTIONS ===============
  const initializeCalendarSequence = (startDate, startType) => {
    const newCalendar = {};
    let currentType = startType;
    const currentDate = new Date(startDate);
    
    while (currentDate.getMonth() <= new Date(startDate).getMonth() + 4) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const dateStr = currentDate.toISOString().split('T')[0];
        newCalendar[dateStr] = {
          type: currentType,
          state: 'school'
        };
        currentType = currentType === DAY_TYPES.ODD ? DAY_TYPES.EVEN : DAY_TYPES.ODD;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setCalendar(newCalendar);
  };

  const updateDayType = (date, type) => {
    const dateStr = date.toISOString().split('T')[0];
    setCalendar(prev => {
      const newCalendar = { ...prev };
      newCalendar[dateStr] = { ...newCalendar[dateStr], type };
      return newCalendar;
    });
  };

  // ============= CLASS MANAGEMENT ===============
  const addClass = (classData) => {
    const newClass = {
      id: Date.now(),
      name: classData.name || 'New Class',
      gradeLevel: classData.gradeLevel || GRADE_LEVELS[0],
      period: classData.period || 1,
      dayType: classData.dayType || DAY_TYPES.ODD,
      room: classData.room || '',
      description: classData.description || ''
    };
    setClasses(prev => [...prev, newClass]);
    setStudents(prev => ({ ...prev, [newClass.id]: [] }));
  };

  const addStudent = (classId, studentData) => {
    const newStudent = {
      id: Date.now(),
      name: studentData.name || 'New Student',
      status: [],
      notes: '',
      accommodations: studentData.accommodations || ''
    };
    setStudents(prev => ({
      ...prev,
      [classId]: [...(prev[classId] || []), newStudent]
    }));
  };

  const importStudents = async (file, classId) => {
    const text = await file.text();
    const rows = text.split('\n');
    const students = rows.map(row => {
      const [name, ...accommodations] = row.split(',');
      return {
        id: Date.now() + Math.random(),
        name: name.trim(),
        accommodations: accommodations.join(',').trim(),
        status: [],
        notes: ''
      };
    });
    setStudents(prev => ({
      ...prev,
      [classId]: [...(prev[classId] || []), ...students]
    }));
  };

  // ============= UNIT MANAGEMENT ===============
  const addUnit = (unitData) => {
    const newUnit = {
      id: Date.now(),
      title: unitData.title || 'New Unit',
      gradeLevel: unitData.gradeLevel || GRADE_LEVELS[0],
      startDate: unitData.startDate || selectedDate.toISOString().split('T')[0],
      endDate: unitData.endDate || '',
      description: unitData.description || '',
      lessons: [],
      standards: unitData.standards || [],
      objectives: unitData.objectives || []
    };
    setUnits(prev => [...prev, newUnit]);
  };

  const addLessonTemplate = (templateData) => {
    const newTemplate = {
      id: Date.now(),
      title: templateData.title || 'New Template',
      gradeLevel: templateData.gradeLevel || GRADE_LEVELS[0],
      structure: templateData.structure || '',
      materials: templateData.materials || [],
      procedures: templateData.procedures || [],
      assessment: templateData.assessment || '',
      differentiation: templateData.differentiation || {}
    };
    setLessonTemplates(prev => [...prev, newTemplate]);
  };

  // ============= RENDER FUNCTIONS ===============
  const renderWeekView = () => {
    const monday = getMonday(selectedDate);
    
    return React.createElement('div', { className: 'week-view' }, [
      React.createElement('div', { key: 'header', className: 'week-header' },
        WEEKDAYS.map(day => React.createElement('div', { key: day, className: 'day-header' }, day))
      ),
      React.createElement('div', { key: 'grid', className: 'week-grid' },
        PERIODS.map(period => 
          React.createElement('div', { key: period, className: 'period-row' },
            WEEKDAYS.map(day => {
              const date = addDays(monday, WEEKDAYS.indexOf(day));
              const dayType = calendar[date.toISOString().split('T')[0]]?.type;
              const classesForPeriod = classes.filter(c => 
                c.period === period && c.dayType === dayType
              );
              
              return React.createElement('div', {
                key: day,
                className: `period-cell ${dayType || ''}`
              }, classesForPeriod.map(cls => 
                React.createElement('div', {
                  key: cls.id,
                  className: 'class-block'
                }, cls.name)
              ));
            })
          )
        )
      )
    ]);
  };

 const renderMonthView = () => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add month navigation and header
    const header = React.createElement('div', { className: 'month-header' }, [
      React.createElement('button', {
        key: 'prev',
        onClick: () => setSelectedDate(new Date(year, month - 1))
      }, '←'),
      React.createElement('h2', { key: 'title' },
        `${selectedDate.toLocaleString('default', { month: 'long' })} ${year}`
      ),
      React.createElement('button', {
        key: 'next',
        onClick: () => setSelectedDate(new Date(year, month + 1))
      }, '→'),
      React.createElement('button', {
        key: 'toggle',
        onClick: () => setCalendarView(calendarView === 'month' ? 'week' : 'month'),
        className: 'view-toggle'
      }, calendarView === 'month' ? 'Switch to Week' : 'Switch to Month')
    ]);

    // Add weekday headers (Mon-Fri only)
    WEEKDAYS.forEach(day => {
      days.push(React.createElement('div', { 
        key: `header-${day}`,
        className: 'calendar-header'
      }, day));
    });

    // Fill in empty days at start of month
    let startDayIndex = firstDay.getDay();
    if (startDayIndex === 0) startDayIndex = 7;  // Sunday becomes 7
    startDayIndex--;  // Adjust for Monday start
    for (let i = 0; i < startDayIndex; i++) {
      days.push(React.createElement('div', { 
        key: `empty-${i}`,
        className: 'calendar-day empty'
      }));
    }

    // Add month days
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      if (date.getDay() === 0 || date.getDay() === 6) continue;  // Skip weekends
      
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendar[dateStr] || { type: 'odd', state: 'school' };
      const classesForDay = classes.filter(c => c.dayType === dayData.type);
      
      days.push(React.createElement('div', {
        key: dateStr,
        className: `calendar-day ${dayData.type} ${dayData.state}`,
        onClick: () => {
          setSelectedDate(new Date(date));
          showDayDetails(dateStr);
        }
      }, [
        React.createElement('div', { key: 'date', className: 'date-number' }, 
          date.getDate()
        ),
        React.createElement('div', { key: 'type', className: 'day-type' },
          dayData.type
        ),
        React.createElement('div', { key: 'classes', className: 'day-classes' },
          classesForDay.map(cls => 
            React.createElement('div', { 
              key: cls.id,
              className: 'day-class-item'
            }, `P${cls.period}: ${cls.name}`)
          )
        )
      ]));
    }

    return React.createElement('div', { className: 'calendar-container' }, [
      header,
      React.createElement('div', { className: 'calendar-grid' }, days)
    ]);
  };

  const renderUnitsView = () => {
    const filteredUnits = units
      .filter(unit => 
        (!filters.gradeLevel || unit.gradeLevel === filters.gradeLevel)
      )
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    const groupedUnits = {};
    GRADE_LEVELS.forEach(grade => {
      groupedUnits[grade] = filteredUnits.filter(unit => unit.gradeLevel === grade);
    });

    return React.createElement('div', { className: 'units-view' }, [
      React.createElement('div', { key: 'controls', className: 'units-controls' }, [
        React.createElement('button', {
          onClick: () => addUnit({ gradeLevel: filters.gradeLevel })
        }, 'Add Unit'),
        React.createElement('select', {
          value: filters.gradeLevel || '',
          onChange: (e) => setFilters({ ...filters, gradeLevel: e.target.value || null })
        }, [
          React.createElement('option', { value: '' }, 'All Grades'),
          ...GRADE_LEVELS.map(grade => 
            React.createElement('option', { value: grade }, `Grade ${grade}`)
          )
        ])
      ]),
      ...Object.entries(groupedUnits).map(([grade, gradeUnits]) =>
        React.createElement('div', { key: grade, className: 'grade-units' }, [
          React.createElement('h3', null, `Grade ${grade}`),
          React.createElement('div', { className: 'units-grid' },
            gradeUnits.map(unit => 
              React.createElement('div', { key: unit.id, className: 'unit-card' }, [
                React.createElement('input', {
                  key: 'title',
                  value: unit.title,
                  onChange: (e) => updateUnit(unit.id, { title: e.target.value }),
                  className: 'unit-title'
                }),
                React.createElement('div', { key: 'dates', className: 'unit-dates' }, [
                  React.createElement('input', {
                    type: 'date',
                    value: unit.startDate,
                    onChange: (e) => updateUnit(unit.id, { startDate: e.target.value })
                  }),
                  React.createElement('input', {
                    type: 'date',
                    value: unit.endDate,
                    onChange: (e) => updateUnit(unit.id, { endDate: e.target.value })
                  })
                ]),
                React.createElement('textarea', {
                  key: 'description',
                  value: unit.description,
                  onChange: (e) => updateUnit(unit.id, { description: e.target.value }),
                  placeholder: 'Unit description...'
                })
              ])
            )
          )
        ])
      )
    ]);
  };

  const renderClassesView = () => {
    const groupedClasses = {
      odd: classes.filter(c => c.dayType === 'odd'),
      even: classes.filter(c => c.dayType === 'even')
    };

    return React.createElement('div', { className: 'classes-view' }, [
      React.createElement('div', { key: 'controls', className: 'class-controls' }, [
        React.createElement('button', {
          onClick: () => addClass({})
        }, 'Add Class'),
        React.createElement('input', {
          type: 'file',
          accept: '.csv',
          onChange: (e) => importStudents(e.target.files[0])
        })
      ]),
      React.createElement('div', { key: 'grid', className: 'classes-grid' }, [
        React.createElement('div', { key: 'odd', className: 'day-classes' }, [
          React.createElement('h3', null, 'Odd Day Classes'),
          ...groupedClasses.odd.map(cls => renderClassCard(cls))
        ]),
        React.createElement('div', { key: 'even', className: 'day-classes' }, [
          React.createElement('h3', null, 'Even Day Classes'),
          ...groupedClasses.even.map(cls => renderClassCard(cls))
        ])
      ])
    ]);
  };

  const renderClassCard = (cls) => {
    const classStudents = students[cls.id] || [];
    
    return React.createElement('div', { 
      key: cls.id,
      className: 'class-card'
    }, [
      React.createElement('div', { key: 'header', className: 'class-header' }, [
        React.createElement('input', {
          value: cls.name,
          onChange: (e) => updateClass(cls.id, { name: e.target.value }),
          className: 'class-name'
        }),
        React.createElement('div', { className: 'class-meta' }, [
          `Period ${cls.period}`,
          `Grade ${cls.gradeLevel}`,
          cls.room && `Room ${cls.room}`
        ].filter(Boolean).join(' • '))
      ]),
      React.createElement('div', { key: 'students', className: 'class-students' }, [
        ...classStudents.map(student => 
          React.createElement('div', { 
            key: student.id,
            className: 'student-row'
          }, [
            React.createElement('span', null, student.name),
            React.createElement('div', { className: 'student-status' },
              student.status.map((status, i) => 
                React.createElement('span', { 
                  key: i,
                  title: status.label
                }, status.icon)
              )
            )
          ])
        ),
        React.createElement('button', {
          onClick: () => addStudent(cls.id, {}),
          className: 'add-student'
        }, 'Add Student')
      ])
    ]);
  };

  // ============= MAIN RENDER ===============
  return React.createElement('div', { className: 'teacher-planner' }, [
    React.createElement('nav', { key: 'nav', className: 'planner-nav' }, [
      React.createElement('button', {
        key: 'calendar',
        onClick: () => setView('calendar'),
        className: view === 'calendar' ? 'active' : ''
      }, 'Calendar'),
      React.createElement('button', {
        key: 'units',
        onClick: () => setView('units'),
        className: view === 'units' ? 'active' : ''
      }, 'Units'),
      React.createElement('button', {
        key: 'classes',
        onClick: () => setView('classes'),
        className: view === 'classes' ? 'active' : ''
      }, 'Classes')
    ]),
    React.createElement('main', { key: 'content', className: 'planner-content' },
      view === 'calendar' ? (
        calendarView === 'week' ? renderWeekView() : renderMonthView()
      ) : view === 'units' ? (
        renderUnitsView()
      ) : (
        renderClassesView()
      )
    ),
    React.createElement('style', { key: 'styles' }, `
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
  font-size: 14px;
}

.planner-nav button.active {
  background: #007bff;
  color: white;
}

/* Calendar Styles */
.calendar-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
}

.calendar-header {
  padding: 10px;
  background: #f8f9fa;
  text-align: center;
  font-weight: bold;
}

.calendar-day {
  min-height: 100px;
  padding: 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
}

.calendar-day.odd {
  background: #f0f7ff;
}

.calendar-day.even {
  background: #fff0f0;
}

.calendar-day.workshop {
  background: #f0f0f0;
}

.calendar-day.holiday {
  background: #ffe6e6;
}

.date-number {
  font-weight: bold;
  margin-bottom: 5px;
}

.day-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.day-classes {
  font-size: 12px;
}

.day-class-item {
  padding: 2px 4px;
  margin: 2px 0;
  background: white;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* Week View Styles */
.week-view {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
}

.day-header {
  padding: 10px;
  text-align: center;
  font-weight: bold;
  background: #f8f9fa;
}

.period-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
}

.period-cell {
  padding: 10px;
  border: 1px solid #dee2e6;
  min-height: 100px;
}

/* Units View Styles */
.units-view {
  padding: 20px;
}

.units-controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.grade-units {
  margin-bottom: 30px;
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.unit-card {
  padding: 15px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
}

.unit-title {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  font-size: 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.unit-dates {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

/* Classes View Styles */
.classes-view {
  padding: 20px;
}

.classes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.day-classes {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.class-card {
  padding: 15px;
  margin-bottom: 15px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.class-header {
  margin-bottom: 10px;
}

.class-name {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.class-meta {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.student-status {
  display: flex;
  gap: 5px;
}

/* Common Elements */
button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

input, select, textarea {
  padding: 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 14px;
}

.view-toggle {
  margin-left: auto;
  background: #6c757d;
}
  ]);
};

// ============= INITIALIZATION ===============
window.initializePlanner = function(rootId) {
  const root = ReactDOM.createRoot(document.getElementById(rootId));
  root.render(React.createElement(TeacherPlanner));
};
