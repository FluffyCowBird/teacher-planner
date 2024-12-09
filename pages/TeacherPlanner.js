const React = window.React;
const ReactDOM = window.ReactDOM;

// Constants and Types
const DAY_TYPES = {
  ODD: 'odd',
  EVEN: 'even',
  WORKSHOP: 'workshop',
  ASSEMBLY: 'assembly',
  SNOW: 'snow',
  HOLIDAY: 'holiday'
};

const GRADE_LEVELS = [6, 7, 8];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const STATUS_TYPES = {
  PERFORMANCE: { icon: '⭐', label: 'Performance' },
  BEHAVIOR: { icon: '📋', label: 'Behavior' },
  ENGAGEMENT: { icon: '👀', label: 'Engagement' }
};

const TeacherPlanner = () => {
  // State Management
  const [view, setView] = React.useState('calendar');
  const [calendar, setCalendar] = React.useState({});
  const [units, setUnits] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [currentUnit, setCurrentUnit] = React.useState(null);

  // Load saved data
  React.useEffect(() => {
    const savedData = localStorage.getItem('teacherPlannerData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setCalendar(data.calendar || {});
      setUnits(data.units || []);
      setClasses(data.classes || []);
    }
  }, []);

  // Save data when it changes
  React.useEffect(() => {
    localStorage.setItem('teacherPlannerData', JSON.stringify({
      calendar,
      units,
      classes
    }));
  }, [calendar, units, classes]);

  // Calendar Functions
  const updateDayType = (date, type) => {
    const dateStr = date.toISOString().split('T')[0];
    setCalendar(prev => ({
      ...prev,
      [dateStr]: type
    }));
  };

  const getDayType = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendar[dateStr] || 'odd';
  };

  // Unit Functions
  const addUnit = () => {
    const newUnit = {
      id: Date.now(),
      title: 'New Unit',
      description: '',
      lessons: []
    };
    setUnits(prev => [...prev, newUnit]);
    setCurrentUnit(newUnit);
  };

  const updateUnit = (id, updates) => {
    setUnits(prev => prev.map(unit => 
      unit.id === id ? { ...unit, ...updates } : unit
    ));
  };

  // Class Functions
  const addClass = () => {
    setClasses(prev => [...prev, {
      id: Date.now(),
      name: 'New Class',
      grade: GRADE_LEVELS[0],
      period: 1,
      students: []
    }]);
  };

  const addStudent = (classId) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: [...cls.students, {
            id: Date.now(),
            name: 'New Student',
            status: []
          }]
        };
      }
      return cls;
    }));
  };

  // Render Functions
  const renderCalendar = () => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add header for days of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(name => {
      days.push(React.createElement('div', { 
        key: `header-${name}`,
        className: 'calendar-header-cell'
      }, name));
    });

    // Add empty cells for first week
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(React.createElement('div', { 
        key: `empty-${i}`,
        className: 'calendar-day empty'
      }));
    }

    // Add days of month
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      const dayType = getDayType(currentDate);
      
      days.push(React.createElement('div', {
        key: currentDate.toISOString(),
        className: `calendar-day ${dayType}`,
        onClick: () => {
          setSelectedDate(currentDate);
          const newType = dayType === 'odd' ? 'even' : 'odd';
          updateDayType(currentDate, newType);
        }
      }, [
        React.createElement('div', { 
          key: 'date',
          className: 'date-number'
        }, currentDate.getDate()),
        React.createElement('div', {
          key: 'type',
          className: 'day-type'
        }, dayType)
      ]));
    }

    return React.createElement('div', { className: 'calendar-container' }, [
      React.createElement('div', { key: 'nav', className: 'month-nav' }, [
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
        }, '→')
      ]),
      React.createElement('div', { 
        key: 'grid',
        className: 'calendar-grid'
      }, days)
    ]);
  };

  const renderUnits = () => {
    return React.createElement('div', { className: 'units-container' }, [
      React.createElement('div', { key: 'header', className: 'units-header' }, [
        React.createElement('h2', { key: 'title' }, 'Units'),
        React.createElement('button', {
          key: 'add',
          onClick: addUnit
        }, 'Add Unit')
      ]),
      React.createElement('div', { 
        key: 'list',
        className: 'units-list'
      }, units.map(unit => 
        React.createElement('div', {
          key: unit.id,
          className: 'unit-item'
        }, [
          React.createElement('input', {
            key: 'title',
            value: unit.title,
            onChange: (e) => updateUnit(unit.id, { title: e.target.value }),
            className: 'unit-title'
          }),
          React.createElement('textarea', {
            key: 'desc',
            value: unit.description,
            onChange: (e) => updateUnit(unit.id, { description: e.target.value }),
            className: 'unit-description',
            placeholder: 'Unit description...'
          })
        ])
      ))
    ]);
  };

  const renderClasses = () => {
    return React.createElement('div', { className: 'classes-container' }, [
      React.createElement('div', { key: 'header', className: 'classes-header' }, [
        React.createElement('h2', { key: 'title' }, 'Classes'),
        React.createElement('button', {
          key: 'add',
          onClick: addClass
        }, 'Add Class')
      ]),
      React.createElement('div', {
        key: 'list',
        className: 'classes-list'
      }, classes.map(cls => 
        React.createElement('div', {
          key: cls.id,
          className: 'class-item'
        }, [
          React.createElement('input', {
            key: 'name',
            value: cls.name,
            onChange: (e) => {
              setClasses(prev => prev.map(c => 
                c.id === cls.id ? { ...c, name: e.target.value } : c
              ));
            },
            className: 'class-name'
          }),
          React.createElement('button', {
            key: 'add-student',
            onClick: () => addStudent(cls.id)
          }, 'Add Student'),
          React.createElement('div', {
            key: 'students',
            className: 'student-list'
          }, cls.students.map(student =>
            React.createElement('div', {
              key: student.id,
              className: 'student-item'
            }, [
              React.createElement('input', {
                key: 'name',
                value: student.name,
                onChange: (e) => {
                  setClasses(prev => prev.map(c => 
                    c.id === cls.id ? {
                      ...c,
                      students: c.students.map(s =>
                        s.id === student.id ? { ...s, name: e.target.value } : s
                      )
                    } : c
                  ));
                },
                className: 'student-name'
              })
            ])
          ))
        ])
      ))
    ]);
  };

  // Main Render
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
    React.createElement('main', { 
      key: 'main',
      className: 'planner-content'
    }, 
      view === 'calendar' ? renderCalendar() :
      view === 'units' ? renderUnits() :
      view === 'classes' ? renderClasses() : null
    ),
    React.createElement('style', { key: 'styles' }, `
      .teacher-planner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      .planner-nav {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }
      .planner-nav button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .planner-nav button.active {
        background: #007bff;
        color: white;
      }
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 5px;
      }
      .calendar-day {
        padding: 10px;
        border: 1px solid #ddd;
        min-height: 80px;
        cursor: pointer;
      }
      .calendar-day.odd { background: #f0f7ff; }
      .calendar-day.even { background: #fff0f0; }
      .unit-item, .class-item {
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      input, textarea {
        width: 100%;
        padding: 8px;
        margin-bottom: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
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
    `)
  ]);
};

// Initialize function
window.initializePlanner = function(rootId) {
  const root = ReactDOM.createRoot(document.getElementById(rootId));
  root.render(React.createElement(TeacherPlanner));
};
