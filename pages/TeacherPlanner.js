const React = window.React;
const ReactDOM = window.ReactDOM;

// Utility functions
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Constants
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
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

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

const TeacherPlanner = () => {
  // State declarations
  const [view, setView] = React.useState('calendar');
  const [calendarView, setCalendarView] = React.useState('month');
  const [calendar, setCalendar] = React.useState({});
  const [units, setUnits] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [students, setStudents] = React.useState({});
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [currentUnit, setCurrentUnit] = React.useState(null);
  const [lessonTemplates, setLessonTemplates] = React.useState([]);
  const [filters, setFilters] = React.useState({
    gradeLevel: null,
    dayType: null,
    period: null
  });

  // Load and save data effects
  React.useEffect(() => {
    const savedData = localStorage.getItem('teacherPlannerData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setCalendar(data.calendar || {});
      setUnits(data.units || []);
      setClasses(data.classes || {});
      setStudents(data.students || {});
      setLessonTemplates(data.lessonTemplates || []);
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('teacherPlannerData', JSON.stringify({
        calendar,
        units,
        classes,
        students,
        lessonTemplates
      }));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [calendar, units, classes, students, lessonTemplates]);

  // Initialize calendar on mount
  React.useEffect(() => {
    if (Object.keys(calendar).length === 0) {
      initializeCalendarSequence(new Date(), DAY_TYPES.ODD);
    }
  }, []);
  // POSSIBLE END OF CHUNK 2, NOT SURE, WILL ASK CLAUDE SONNET AFTER ALL CHUNKS ARE DONE BEING ADDED

  // Calendar Functions
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
      if (type === 'workshop' || type === 'holiday') {
        recalculateSequence(date, newCalendar);
      }
      return newCalendar;
    });
  };

  const recalculateSequence = (fromDate, calendarData) => {
    let currentType = null;
    const currentDate = new Date(fromDate);
    
    // Find the last known school day type before this date
    while (!currentType && currentDate > new Date(2024, 0, 1)) {
      currentDate.setDate(currentDate.getDate() - 1);
      const dateStr = currentDate.toISOString().split('T')[0];
      if (calendarData[dateStr]?.state === 'school') {
        currentType = calendarData[dateStr].type;
      }
    }

    if (!currentType) return;

    // Recalculate forward
    const futureDate = new Date(fromDate);
    while (futureDate <= new Date(2024, 11, 31)) {
      const dateStr = futureDate.toISOString().split('T')[0];
      if (calendarData[dateStr]?.state === 'school') {
        currentType = currentType === DAY_TYPES.ODD ? DAY_TYPES.EVEN : DAY_TYPES.ODD;
        calendarData[dateStr].type = currentType;
      }
      futureDate.setDate(futureDate.getDate() + 1);
    }
  };
// ============= RENDER FUNCTIONS ===============
  const renderWeekView = () => {
    const monday = getMonday(selectedDate);
    
    return React.createElement('div', { className: 'week-view' }, [
      React.createElement('div', { className: 'week-header' },
        WEEKDAYS.map(day => 
          React.createElement('div', {
            key: day,
            className: 'day-header font-courier'
          }, day)
        )
      ),
      React.createElement('div', { className: 'period-labels' },
        PERIODS.map(period => 
          React.createElement('div', {
            key: period,
            className: 'period-label font-trebuchet'
          }, `Period ${period}`)
        )
      ),
      React.createElement('div', { className: 'week-grid' },
        PERIODS.map(period => 
          React.createElement('div', { key: period, className: 'period-row' },
            WEEKDAYS.map(day => {
              const date = addDays(monday, WEEKDAYS.indexOf(day));
              const dateStr = date.toISOString().split('T')[0];
              const dayData = calendar[dateStr] || { type: 'odd', state: 'school' };
              const classesForPeriod = classes.filter(c => 
                c.period === period && c.dayType === dayData.type
              );
              
              return React.createElement('div', {
                key: day,
                className: `period-cell ${dayData.type} ${dayData.state}`,
                onClick: () => {
                  const newType = prompt('Enter day type:', dayData.type);
                  if (newType && Object.values(DAY_TYPES).includes(newType)) {
                    updateDayType(date, newType);
                  }
                }
              }, [
                React.createElement('div', { className: 'period-classes' },
                  classesForPeriod.map(cls => 
                    React.createElement('div', {
                      key: cls.id,
                      className: 'class-block font-trebuchet'
                    }, [
                      cls.name,
                      React.createElement('div', { className: 'class-room' }, 
                        cls.room ? `Room ${cls.room}` : ''
                      )
                    ])
                  )
                )
              ]);
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

    const header = React.createElement('div', { className: 'month-header' }, [
      React.createElement('button', {
        key: 'prev',
        onClick: () => setSelectedDate(new Date(year, month - 1))
      }, '←'),
      React.createElement('h2', { 
        key: 'title',
        className: 'font-courier'
      }, `${selectedDate.toLocaleString('default', { month: 'long' })} ${year}`),
      React.createElement('button', {
        key: 'next',
        onClick: () => setSelectedDate(new Date(year, month + 1))
      }, '→'),
      React.createElement('button', {
        key: 'toggle',
        className: 'view-toggle',
        onClick: () => setCalendarView(calendarView === 'month' ? 'week' : 'month')
      }, calendarView === 'month' ? 'Switch to Week' : 'Switch to Month')
    ]);

    const days = [];

    WEEKDAYS.forEach(day => {
      days.push(React.createElement('div', {
        key: `header-${day}`,
        className: 'calendar-header font-courier'
      }, day));
    });

    let startDayIndex = firstDay.getDay();
    if (startDayIndex === 0) startDayIndex = 7;
    startDayIndex--;
    
    for (let i = 0; i < startDayIndex; i++) {
      days.push(React.createElement('div', {
        key: `empty-${i}`,
        className: 'calendar-day empty'
      }));
    }

    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendar[dateStr] || { type: 'odd', state: 'school' };
      const classesForDay = classes.filter(c => c.dayType === dayData.type);
      
      days.push(React.createElement('div', {
        key: dateStr,
        className: `calendar-day ${dayData.type} ${dayData.state}`,
        onClick: () => {
          setSelectedDate(new Date(date));
          const newType = prompt('Select day type:', Object.keys(DAY_TYPES).join(', '));
          if (newType && DAY_TYPES[newType.toUpperCase()]) {
            updateDayType(date, DAY_TYPES[newType.toUpperCase()]);
          }
        }
      }, [
        React.createElement('div', { 
          key: 'date',
          className: 'date-number font-trebuchet'
        }, date.getDate()),
        React.createElement('div', {
          key: 'type',
          className: 'day-type font-trebuchet'
        }, dayData.type),
        React.createElement('div', {
          key: 'classes',
          className: 'day-classes'
        }, classesForDay.map(cls => 
          React.createElement('div', {
            key: cls.id,
            className: 'day-class-item font-trebuchet'
          }, `P${cls.period}: ${cls.name}`)
        ))
      ]));
    }

    return React.createElement('div', { className: 'calendar-container' }, [
      header,
      React.createElement('div', { className: 'calendar-grid' }, days)
    ]);
  };

  const renderUnitsView = () => {
    const groupedUnits = {};
    GRADE_LEVELS.forEach(grade => {
      groupedUnits[grade] = units
        .filter(unit => unit.gradeLevel === grade)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    });

    return React.createElement('div', { className: 'units-view' }, [
      React.createElement('div', { className: 'units-controls' }, [
        React.createElement('h2', { className: 'font-courier' }, 'Units'),
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
          React.createElement('h3', { className: 'font-courier' }, `Grade ${grade}`),
          React.createElement('div', { className: 'units-grid' },
            gradeUnits.map(unit => 
              React.createElement('div', { key: unit.id, className: 'unit-card' }, [
                React.createElement('input', {
                  key: 'title',
                  value: unit.title,
                  onChange: (e) => updateUnit(unit.id, { title: e.target.value }),
                  className: 'unit-title font-trebuchet'
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
                  placeholder: 'Unit description...',
                  className: 'font-trebuchet'
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
      React.createElement('div', { className: 'class-controls' }, [
        React.createElement('h2', { className: 'font-courier' }, 'Classes'),
        React.createElement('button', {
          onClick: () => addClass({})
        }, 'Add Class'),
        React.createElement('input', {
          type: 'file',
          accept: '.csv',
          onChange: (e) => importStudents(e.target.files[0])
        })
      ]),
      React.createElement('div', { className: 'classes-grid' }, [
        React.createElement('div', { key: 'odd', className: 'day-classes' }, [
          React.createElement('h3', { className: 'font-courier' }, 'Odd Day Classes'),
          ...groupedClasses.odd.map(cls => renderClassCard(cls))
        ]),
        React.createElement('div', { key: 'even', className: 'day-classes' }, [
          React.createElement('h3', { className: 'font-courier' }, 'Even Day Classes'),
          ...groupedClasses.even.map(cls => renderClassCard(cls))
        ])
      ])
    ]);
  };

  // ============= MAIN RENDER ===============
  return React.createElement('div', { className: 'teacher-planner' }, [
    React.createElement('nav', { className: 'planner-nav' }, [
      React.createElement('button', {
        onClick: () => setView('calendar'),
        className: view === 'calendar' ? 'active' : ''
      }, 'Calendar'),
      React.createElement('button', {
        onClick: () => setView('units'),
        className: view === 'units' ? 'active' : ''
      }, 'Units'),
      React.createElement('button', {
        onClick: () => setView('classes'),
        className: view === 'classes' ? 'active' : ''
      }, 'Classes')
    ]),
    React.createElement('main', { className: 'planner-content' },
      view === 'calendar' ? (
        calendarView === 'week' ? renderWeekView() : renderMonthView()
      ) : view === 'units' ? (
        renderUnitsView()
      ) : (
        renderClassesView()
      )
    ),
    React.createElement('style', null, `
      @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
      
      .teacher-planner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: "Trebuchet MS", sans-serif;
      }

      .font-courier {
        font-family: "Courier Prime", "Courier New", monospace;
        font-weight: 700;
      }

      .font-trebuchet {
        font-family: "Trebuchet MS", sans-serif;
      }

      [Previous CSS styles remain the same...]
    `)
  ]);
};

// ============= INITIALIZATION ===============
window.initializePlanner = function(rootId) {
  const root = ReactDOM.createRoot(document.getElementById(rootId));
  root.render(React.createElement(TeacherPlanner));
};
