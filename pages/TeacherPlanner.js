'use strict';

(() => {
  // Ensure React and ReactDOM are loaded
  if (!window.React || !window.ReactDOM) {
    console.error('React and ReactDOM must be loaded before TeacherPlanner.js');
    return;
  }

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

  const STANDARD_TYPES = {
    CONTENT: 'content',
    SKILL: 'skill',
    PRACTICE: 'practice',
    CROSS_CUTTING: 'cross_cutting'
  };

  const RESOURCE_TYPES = {
    DOCUMENT: 'document',
    VIDEO: 'video',
    WEBSITE: 'website',
    ASSESSMENT: 'assessment',
    ACTIVITY: 'activity',
    WORKSHEET: 'worksheet',
    PRESENTATION: 'presentation'
  };

  const QUESTION_TYPES = {
    MULTIPLE_CHOICE: 'multiple_choice',
    SHORT_ANSWER: 'short_answer',
    ESSAY: 'essay',
    MATCHING: 'matching',
    TRUE_FALSE: 'true_false',
    RUBRIC: 'rubric'
  };

  const TEMPLATE_TYPES = {
    PROGRESS_UPDATE: 'progress_update',
    BEHAVIOR_NOTIFICATION: 'behavior_notification',
    ABSENCE_FOLLOW_UP: 'absence_follow_up',
    ASSIGNMENT_REMINDER: 'assignment_reminder',
    PARENT_CONFERENCE: 'parent_conference',
    CUSTOM: 'custom'
  };

  // Utility Functions
  const validateDate = (date) => {
    return date instanceof Date && !isNaN(date) && date > new Date(1900, 0, 1);
  };

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>{}]/g, '');
  };

  const generateUniqueId = (prefix) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Main Component
  const TeacherPlanner = () => {
    // State declarations
    const [view, setView] = React.useState('calendar');
    const [calendarView, setCalendarView] = React.useState('month');
    const [selectedDate, setSelectedDate] = React.useState(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    });
    const [calendar, setCalendar] = React.useState({});
    const [standards, setStandards] = React.useState({});
    const [resources, setResources] = React.useState({});
    const [assessments, setAssessments] = React.useState({});
    const [units, setUnits] = React.useState([]);
    const [classes, setClasses] = React.useState([]);
    const [students, setStudents] = React.useState({});
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    // Initialize calendar on mount
    React.useEffect(() => {
      if (Object.keys(calendar).length === 0) {
        initializeCalendar();
      }
    }, []);

    const initializeCalendar = () => {
      try {
        const newCalendar = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Initialize 6 months of calendar
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 6);
        
        let currentDate = new Date(today);
        let isOdd = true;  // Start with odd day
        
        while (currentDate <= endDate) {
          if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {  // Skip weekends
            const dateStr = currentDate.toISOString().split('T')[0];
            newCalendar[dateStr] = {
              type: isOdd ? DAY_TYPES.ODD : DAY_TYPES.EVEN,
              state: 'school',
              notes: '',
              lastModified: new Date().toISOString()
            };
            isOdd = !isOdd;  // Toggle between odd and even
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
    };

    // Calendar Management
    const updateCalendarDay = React.useCallback((date, updates) => {
      if (!validateDate(date)) {
        setError('Invalid date');
        return;
      }

      const dateStr = date.toISOString().split('T')[0];
      setCalendar(prev => ({
        ...prev,
        [dateStr]: {
          ...(prev[dateStr] || {}),
          ...updates,
          lastModified: new Date().toISOString()
        }
      }));
    }, []);

    // Render Methods
    const renderCalendarHeader = () => {
      return React.createElement('div', {
        className: 'calendar-header',
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }
      }, [
        React.createElement('h2', {
          key: 'title'
        }, selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })),
        React.createElement('div', {
          key: 'controls',
          style: {
            display: 'flex',
            gap: '10px'
          }
        }, [
          React.createElement('button', {
            onClick: () => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }
          }, '← Previous'),
          React.createElement('button', {
            onClick: () => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }
          }, 'Next →')
        ])
      ]);
    };

    const renderCalendarGrid = () => {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Calculate days to display
      const days = [];
      
      // Add day headers
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(day => {
        days.push(React.createElement('div', {
          key: `header-${day}`,
          className: 'calendar-header-cell',
          style: {
            padding: '10px',
            textAlign: 'center',
            fontWeight: 'bold',
            backgroundColor: 'var(--bg-secondary)'
          }
        }, day));
      });

      // Add the days
      let currentDate = new Date(firstDay);
      while (currentDate <= lastDay) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {  // Skip weekends
          const dateStr = currentDate.toISOString().split('T')[0];
          const dayData = calendar[dateStr] || {
            type: DAY_TYPES.ODD,
            state: 'school',
            notes: ''
          };

          days.push(React.createElement('div', {
            key: dateStr,
            className: 'calendar-day',
            onClick: () => updateCalendarDay(currentDate, {
              type: dayData.type === DAY_TYPES.ODD ? DAY_TYPES.EVEN : DAY_TYPES.ODD
            }),
            style: {
              padding: '10px',
              minHeight: '100px',
              backgroundColor: dayData.type === DAY_TYPES.ODD ? 
                'var(--odd-day-bg)' : 'var(--even-day-bg)',
              cursor: 'pointer'
            }
          }, [
            React.createElement('div', {
              key: 'date',
              className: 'date-number'
            }, currentDate.getDate()),
            React.createElement('div', {
              key: 'type',
              className: 'day-type'
            }, dayData.type.toUpperCase())
          ]));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return React.createElement('div', {
        className: 'calendar-grid',
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '5px',
          backgroundColor: 'var(--bg-primary)',
          padding: '10px',
          borderRadius: '8px'
        }
      }, days);
    };

    const renderCalendar = () => {
      return React.createElement('div', {
        className: 'calendar-view'
      }, [
        renderCalendarHeader(),
        renderCalendarGrid()
      ]);
    };

    // Main Render
    return React.createElement('div', {
      className: 'teacher-planner',
      style: {
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }
    }, [
      // Navigation
      React.createElement('nav', {
        key: 'nav',
        style: {
          marginBottom: '20px',
          display: 'flex',
          gap: '10px'
        }
      }, ['calendar', 'standards', 'resources', 'assessments'].map(viewName =>
        React.createElement('button', {
          key: viewName,
          onClick: () => setView(viewName),
          style: {
            padding: '8px 16px',
            backgroundColor: view === viewName ? 
              'var(--accent-primary)' : 'var(--bg-secondary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }
        }, viewName.charAt(0).toUpperCase() + viewName.slice(1))
      )),

      // Error display
      error && React.createElement('div', {
        key: 'error',
        className: 'error-message',
        style: {
          color: 'var(--error-color)',
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: 'var(--error-bg)',
          borderRadius: '4px'
        }
      }, error),

      // Loading spinner
      loading && React.createElement('div', {
        key: 'loading',
        className: 'loading-spinner',
        style: {
          display: 'flex',
          justifyContent: 'center',
          padding: '20px'
        }
      }, 'Loading...'),

      // Main content
      !loading && React.createElement('main', {
        key: 'main'
      }, view === 'calendar' ? renderCalendar() : null)
    ]);
  };

  // Export the component
  if (typeof window !== 'undefined') {
    window.TeacherPlanner = TeacherPlanner;
  }
})();
