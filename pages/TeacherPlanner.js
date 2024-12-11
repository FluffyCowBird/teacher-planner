// Constants and Utility Functions
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
  const React = window.React;
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

  // Initialize calendar sequence function
  const initializeCalendarSequence = React.useCallback((startDate, startType) => {
    if (!validateDate(startDate) || !Object.values(DAY_TYPES).includes(startType)) {
      setError('Invalid input for calendar initialization');
      return;
    }

    try {
      const newCalendar = {};
      let currentType = startType;
      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);
      
      // Calculate end date (6 months from start)
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6);

      while (currentDate <= endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          const dateStr = currentDate.toISOString().split('T')[0];
          newCalendar[dateStr] = {
            type: currentType,
            state: 'school',
            notes: '',
            lastModified: new Date().toISOString()
          };
          currentType = currentType === DAY_TYPES.ODD ? DAY_TYPES.EVEN : DAY_TYPES.ODD;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setCalendar(prev => ({
        ...prev,
        ...newCalendar
      }));
      setLoading(false);
      
    } catch (err) {
      console.error('Calendar initialization error:', err);
      setError('Failed to initialize calendar');
      setLoading(false);
    }
  }, []);

  // Initialize calendar on mount
  React.useEffect(() => {
    if (Object.keys(calendar).length === 0 && loading) {
      initializeCalendarSequence(new Date(), DAY_TYPES.ODD);
    }
  }, [calendar, loading, initializeCalendarSequence]);

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
          calendarView === 'month' ? 
            newDate.setMonth(newDate.getMonth() - 1) : 
            newDate.setDate(newDate.getDate() - 7);
          setSelectedDate(newDate);
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
        key: 'title',
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
          calendarView === 'month' ? 
            newDate.setMonth(newDate.getMonth() + 1) : 
            newDate.setDate(newDate.getDate() + 7);
          setSelectedDate(newDate);
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

  const renderCalendarGrid = () => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Day headers
    const headers = WEEKDAYS.map(day => 
      React.createElement('div', {
        key: `header-${day}`,
        style: {
          padding: '10px',
          backgroundColor: THEME.colors.bgSecondary,
          textAlign: 'center',
          fontWeight: 'bold',
          color: THEME.colors.textPrimary,
          borderBottom: `1px solid ${THEME.colors.borderColor}`
        }
      }, day)
    );

    // Calendar days
    const days = [];
    let startDayIndex = firstDay.getDay();
    if (startDayIndex === 0) startDayIndex = 7;
    startDayIndex--;

    // Empty cells before first day
    for (let i = 0; i < startDayIndex; i++) {
      days.push(React.createElement('div', {
        key: `empty-${i}`,
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          opacity: 0.5
        }
      }));
    }

    // Actual calendar days
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendar[dateStr] || {
        type: DAY_TYPES.ODD,
        state: 'school',
        notes: ''
      };

      if (date.getDay() !== 0 && date.getDay() !== 6) {
        days.push(React.createElement('div', {
          key: dateStr,
          style: {
            backgroundColor: getDayTypeColor(dayData.type),
            padding: '10px',
            minHeight: '100px',
            border: `1px solid ${THEME.colors.borderColor}`,
            color: THEME.colors.textPrimary
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
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '5px',
        backgroundColor: THEME.colors.bgPrimary,
        padding: '10px',
        borderRadius: '8px'
      }
    }, [...headers, ...days]);
  };

  // Main render
  return React.createElement('div', {
    className: 'teacher-planner',
    style: {
      minHeight: '100vh',
      backgroundColor: THEME.colors.bgPrimary,
      color: THEME.colors.textPrimary,
      padding: '20px'
    }
  }, [
    // Header
    React.createElement('h1', {
      key: 'header',
      style: {
        fontFamily: '"Abril Fatface", serif',
        marginBottom: '20px'
      }
    }, 'Teacher Planner'),

    // Main content
    React.createElement('div', {
      key: 'content',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '20px',
        borderRadius: '8px'
      }
    }, loading ? 
      'Loading...' : 
      error ? `Error: ${error}` : 
      [
        React.createElement('div', { key: 'controls' }, renderCalendarControls()),
        React.createElement('div', { key: 'calendar' }, renderCalendarGrid())
      ]
    )
  ]);
};

// Export the component
window.TeacherPlanner = TeacherPlanner;
