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
      
    } catch (err) {
      console.error('Calendar initialization error:', err);
      setError('Failed to initialize calendar');
    }
  }, []);

  // Initialize calendar on mount
  React.useEffect(() => {
    if (Object.keys(calendar).length === 0 && !loading) {
      initializeCalendarSequence(new Date(), DAY_TYPES.ODD);
    }
  }, [calendar, loading, initializeCalendarSequence]);

  // Basic render for testing
  return React.createElement('div', {
    className: 'teacher-planner',
    style: {
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '20px'
    }
  }, [
    React.createElement('h1', {
      style: {
        fontFamily: '"Abril Fatface", serif',
        marginBottom: '20px'
      }
    }, 'Teacher Planner'),
    React.createElement('div', null, 
      loading ? 'Loading...' : 
      error ? `Error: ${error}` : 
      'Calendar initialized successfully'
    )
  ]);
};

// Export the component
window.TeacherPlanner = TeacherPlanner;
