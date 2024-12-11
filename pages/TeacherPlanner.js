// Ensure React and ReactDOM are available
const React = window.React;
const ReactDOM = window.ReactDOM;

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

const THEME = {
  colors: {
    bgPrimary: 'var(--bg-primary)',
    bgSecondary: 'var(--bg-secondary)',
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    accentPrimary: 'var(--accent-primary)',
    accentSecondary: 'var(--accent-secondary)',
    borderColor: 'var(--border-color)',
    success: 'var(--success-color)',
    error: 'var(--error-color)',
    warning: 'var(--warning-color)',
    oddDayBg: 'var(--odd-day-bg)',
    evenDayBg: 'var(--even-day-bg)',
    holidayBg: 'var(--holiday-bg)',
    workshopBg: 'var(--workshop-bg)'
  }
};

// Utility Functions
const validateDate = (date) => {
  return date instanceof Date && !isNaN(date) && date > new Date(1900, 0, 1);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>{}]/g, '');
};

const getMonday = (date) => {
  if (!validateDate(date)) return new Date();
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const addDays = (date, days) => {
  if (!validateDate(date) || typeof days !== 'number') return new Date();
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getDayTypeColor = (type) => {
  switch (type) {
    case DAY_TYPES.ODD:
      return THEME.colors.oddDayBg;
    case DAY_TYPES.EVEN:
      return THEME.colors.evenDayBg;
    case DAY_TYPES.WORKSHOP:
      return THEME.colors.workshopBg;
    case DAY_TYPES.HOLIDAY:
      return THEME.colors.holidayBg;
    default:
      return THEME.colors.bgSecondary;
  }
};

// Main TeacherPlanner Component
const TeacherPlanner = () => {
  // State
  const [view, setView] = React.useState('calendar');
  const [calendarView, setCalendarView] = React.useState('month');
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [calendar, setCalendar] = React.useState({});
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Calendar Initialization
  const initializeCalendarSequence = React.useCallback(() => {
    try {
      const newCalendar = {};
      const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
      const currentDate = new Date(yearStart);
      currentDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate.getFullYear(), 11, 31);
      let schoolDayCount = 0;

      while (currentDate <= endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          schoolDayCount++;
          const dateStr = currentDate.toISOString().split('T')[0];
          newCalendar[dateStr] = {
            type: schoolDayCount % 2 === 1 ? DAY_TYPES.ODD : DAY_TYPES.EVEN,
            state: 'school',
            notes: '',
            lastModified: new Date().toISOString()
          };
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setCalendar(newCalendar);
      setLoading(false);
    } catch (err) {
      console.error('Calendar initialization error:', err);
      setError('Failed to initialize calendar');
      setLoading(false);
    }
  }, [selectedDate]);

  React.useEffect(() => {
    if (Object.keys(calendar).length === 0) {
      initializeCalendarSequence();
    }
  }, [calendar, initializeCalendarSequence]);

  // Event Handlers
  const handleDateChange = (newDate) => {
    setSelectedDate(new Date(newDate));
  };

  const handleDayTypeChange = (date, type) => {
    const dateStr = date.toISOString().split('T')[0];
    setCalendar(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || {}),
        type,
        lastModified: new Date().toISOString()
      }
    }));
  };

  // Render Functions
  const renderCalendarControls = () => {
    return React.createElement('div', {
      className: 'calendar-controls',
      style: {
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }
    }, [
      React.createElement('button', {
        key: 'prev',
        onClick: () => {
          const newDate = new Date(selectedDate);
          if (calendarView === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
          } else {
            newDate.setDate(newDate.getDate() - 7);
          }
          handleDateChange(newDate);
        },
        style: {
          padding: '8px 16px',
          backgroundColor: THEME.colors.bgSecondary,
          border: 'none',
          borderRadius: '4px',
          color: THEME.colors.textPrimary,
          cursor: 'pointer'
        }
      }, '←'),
      React.createElement('h2', {
        key: 'current-date',
        style: {
          margin: 0,
          color: THEME.colors.textPrimary
        }
      }, calendarView === 'month' ? 
        selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' }) :
        `Week of ${getMonday(selectedDate).toLocaleDateString()}`),
      React.createElement('button', {
        key: 'next',
        onClick: () => {
          const newDate = new Date(selectedDate);
          if (calendarView === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
          } else {
            newDate.setDate(newDate.getDate() + 7);
          }
          handleDateChange(newDate);
        },
        style: {
          padding: '8px 16px',
          backgroundColor: THEME.colors.bgSecondary,
          border: 'none',
          borderRadius: '4px',
          color: THEME.colors.textPrimary,
          cursor: 'pointer'
        }
      }, '→'),
      React.createElement('button', {
        key: 'view-toggle',
        onClick: () => setCalendarView(prev => prev === 'month' ? 'week' : 'month'),
        style: {
          marginLeft: 'auto',
          padding: '8px 16px',
          backgroundColor: THEME.colors.accentPrimary,
          border: 'none',
          borderRadius: '4px',
          color: THEME.colors.textPrimary,
          cursor: 'pointer'
        }
      }, `Switch to ${calendarView === 'month' ? 'Week' : 'Month'} View`)
    ]);
  };

  const renderWeekView = () => {
    const monday = getMonday(selectedDate);
    const days = [];

    // Headers
    WEEKDAYS.forEach(day => {
      days.push(React.createElement('div', {
        key: `header-${day}`,
        style: {
          padding: '10px',
          backgroundColor: THEME.colors.bgSecondary,
          textAlign: 'center',
          fontWeight: 'bold',
          color: THEME.colors.textPrimary,
          borderBottom: `1px solid ${THEME.colors.borderColor}`
        }
      }, day));
    });

    // Week days
    for (let i = 0; i < 5; i++) {
      const date = addDays(monday, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendar[dateStr] || {
        type: DAY_TYPES.ODD,
        state: 'school',
        notes: ''
      };

      days.push(React.createElement('div', {
        key: `day-${dateStr}`,
        style: {
          backgroundColor: getDayTypeColor(dayData.type),
          padding: '10px',
          minHeight: '150px',
          border: `1px solid ${THEME.colors.borderColor}`,
          color: THEME.colors.textPrimary
        }
      }, [
        React.createElement('div', {
          key: 'date-header',
          style: { 
            fontWeight: 'bold',
            marginBottom: '10px' 
          }
        }, `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`),
        React.createElement('div', {
          key: 'day-type',
          style: { 
            fontSize: '0.8em',
            color: THEME.colors.textSecondary,
            marginBottom: '10px'
          }
        }, dayData.type.toUpperCase()),
        React.createElement('div', {
          key: 'periods',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }
        }, PERIODS.map(period => 
          React.createElement('div', {
            key: `period-${period}`,
            style: {
              padding: '5px',
              backgroundColor: THEME.colors.bgSecondary,
              borderRadius: '4px',
              fontSize: '0.8em'
            }
          }, `Period ${period}`)
        ))
      ]));
    }

    return React.createElement('div', {
      className: 'week-view',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '5px',
        backgroundColor: THEME.colors.bgPrimary,
        padding: '10px',
        borderRadius: '8px'
      }
    }, days);
  };

  const renderCalendarGrid = () => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Headers
    WEEKDAYS.forEach(day => {
      days.push(React.createElement('div', {
        key: `header-${day}`,
        style: {
          padding: '10px',
          backgroundColor: THEME.colors.bgSecondary,
          textAlign: 'center',
          fontWeight: 'bold',
          color: THEME.colors.textPrimary,
          borderBottom: `1px solid ${THEME.colors.borderColor}`
        }
      }, day));
    });

    // Empty cells
    let startDayIndex = firstDay.getDay();
    if (startDayIndex === 0) startDayIndex = 7;
    startDayIndex--;

    for (let i = 0; i < startDayIndex; i++) {
      days.push(React.createElement('div', {
        key: `empty-start-${i}`,
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          opacity: 0.5
        }
      }));
    }

    // Calendar days
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const dateStr = date.toISOString().split('T')[0];
        const dayData = calendar[dateStr] || {
          type: DAY_TYPES.ODD,
          state: 'school',
          notes: ''
        };

        days.push(React.createElement('div', {
          key: `day-${dateStr}`,
          onClick: () => {
            const newType = prompt('Enter day type (ODD, EVEN, HOLIDAY, WORKSHOP):', dayData.type.toUpperCase());
            if (newType && Object.values(DAY_TYPES).includes(newType.toLowerCase())) {
              handleDayTypeChange(date, newType.toLowerCase());
            }
          },
          style: {
            backgroundColor: getDayTypeColor(dayData.type),
            padding: '10px',
            minHeight: '100px',
            border: `1px solid ${THEME.colors.borderColor}`,
            color: THEME.colors.textPrimary,
            cursor: 'pointer'
          }
        }, [
          React.createElement('div', {
            key: 'date',
            style: { fontWeight: 'bold' }
          }, date.getDate()),
          React.createElement('div', {
            key: 'type',
            style: { 
              fontSize: '0.8em',
              color: THEME.colors.textSecondary
            }
          }, dayData.type.toUpperCase())
        ]));
      }
    }

    return React.createElement('div', {
      className: 'month-view',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '5px',
        backgroundColor: THEME.colors.bgPrimary,
        padding: '10px',
        borderRadius: '8px'
      }
    }, days);
  };

  const renderNavigation = () => {
    const navItems = [
      { id: 'calendar', label: 'Calendar' }
    ];

    return React.createElement('nav', {
      className: 'main-navigation',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '1rem',
        marginBottom: '20px'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
      }
    }, navItems.map(item =>
      React.createElement('button', {
        key: item.id,
        onClick: () => setView(item.id),
        style: {
          backgroundColor: view === item.id ? 
            THEME.colors.accentPrimary : 'transparent',
          color: THEME.colors.textPrimary,
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, item.label)
    )));
  };

  const renderError = () => {
    if (!error) return null;

    return React.createElement('div', {
      key: 'error',
      style: {
        backgroundColor: THEME.colors.error,
        color: THEME.colors.textPrimary,
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '20px'
      }
    }, error);
  };

  const renderLoading = () => {
    if (!loading) return null;

    return React.createElement('div', {
      key: 'loading',
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }
    }, 'Loading...');
  };

  const renderCalendarContainer = () => {
    if (loading) return renderLoading();
    if (error) return renderError();

    return React.createElement('div', {
      key: 'calendar-container',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '20px',
        borderRadius: '8px'
      }
    }, [
      renderCalendarControls(),
      calendarView === 'month' ? renderCalendarGrid() : renderWeekView()
    ]);
  };

  return React.createElement('div', {
    className: 'teacher-planner',
    style: {
      minHeight: '100vh',
      backgroundColor: THEME.colors.bgPrimary,
      color: THEME.colors.textPrimary,
      padding: '20px'
    }
  }, [
    React.createElement('h1', {
      key: 'header',
      style: {
        fontFamily: '"Abril Fatface", serif',
        marginBottom: '20px',
        color: THEME.colors.textPrimary
      }
    }, 'Teacher Planner'),
    renderNavigation(),
    React.createElement('main', {
      key: 'main',
      style: {
        flex: 1
      }
    }, renderCalendarContainer())
  ]);
};

// Make sure React and ReactDOM are loaded before exporting
if (typeof window !== 'undefined' && window.React && window.ReactDOM) {
  window.TeacherPlanner = TeacherPlanner;
} else {
  console.error('React and ReactDOM must be loaded before TeacherPlanner.js');
}
