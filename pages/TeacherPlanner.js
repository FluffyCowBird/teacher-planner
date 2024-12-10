const React = window.React;
const ReactDOM = window.ReactDOM;

// Utility Functions
const validateDate = (date) => {
  return date instanceof Date && !isNaN(date) && date > new Date(1900, 0, 1);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>{}]/g, '');
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
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

// CSS Theme Variables used throughout the app
const THEME = {
  fonts: {
    title: '"Abril Fatface", serif',
    body: '"Trebuchet MS", sans-serif'
  },
  colors: {
    // These match the CSS variables in index.html
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

// Error handling constants
const ERROR_MESSAGES = {
  INVALID_DATE: 'Invalid date provided',
  INVALID_INPUT: 'Invalid input data',
  STORAGE_ERROR: 'Error saving to local storage',
  LOAD_ERROR: 'Error loading saved data',
  NETWORK_ERROR: 'Network connection error',
  UNKNOWN_ERROR: 'An unknown error occurred'
};

const TeacherPlanner = () => {
  // ============= STATE MANAGEMENT ===============
  const [view, setView] = React.useState('calendar');
  const [calendarView, setCalendarView] = React.useState('month');
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [calendar, setCalendar] = React.useState({});
  const [units, setUnits] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [students, setStudents] = React.useState({});
  const [currentUnit, setCurrentUnit] = React.useState(null);
  const [lessonTemplates, setLessonTemplates] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    gradeLevel: null,
    dayType: null,
    period: null
  });

  // ============= PERSISTENCE LAYER ===============
  // Load data from localStorage
  React.useEffect(() => {
    const loadSavedData = () => {
      try {
        setLoading(true);
        const savedData = localStorage.getItem('teacherPlannerData');
        if (!savedData) return;

        const parsed = JSON.parse(savedData);
        if (typeof parsed !== 'object') throw new Error(ERROR_MESSAGES.INVALID_INPUT);

        // Validate and transform dates in calendar
        const validatedCalendar = {};
        Object.entries(parsed.calendar || {}).forEach(([dateStr, value]) => {
          if (validateDate(new Date(dateStr))) {
            validatedCalendar[dateStr] = value;
          }
        });

        setCalendar(validatedCalendar);
        setUnits(parsed.units || []);
        setClasses(parsed.classes || []);
        setStudents(parsed.students || {});
        setLessonTemplates(parsed.lessonTemplates || []);
        setError(null);
      } catch (err) {
        console.error('Load error:', err);
        setError(ERROR_MESSAGES.LOAD_ERROR);
      } finally {
        setLoading(false);
      }
    };

    loadSavedData();
  }, []);

  // Save data to localStorage with debounce
  const saveData = React.useCallback(
    debounce(() => {
      try {
        const dataToSave = {
          calendar,
          units,
          classes,
          students,
          lessonTemplates
        };
        localStorage.setItem('teacherPlannerData', JSON.stringify(dataToSave));
        setError(null);
      } catch (err) {
        console.error('Save error:', err);
        setError(ERROR_MESSAGES.STORAGE_ERROR);
      }
    }, 1000),
    [calendar, units, classes, students, lessonTemplates]
  );

  React.useEffect(() => {
    saveData();
  }, [calendar, units, classes, students, lessonTemplates, saveData]);

  // Initialize calendar on mount if empty
  React.useEffect(() => {
    if (Object.keys(calendar).length === 0 && !loading) {
      initializeCalendarSequence(new Date(), DAY_TYPES.ODD);
    }
  }, [calendar, loading]);

  // ============= ERROR HANDLING ===============
  React.useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Error display component
  const ErrorMessage = React.useCallback(() => {
    if (!error) return null;
    return React.createElement('div', {
      className: 'error-message',
      style: {
        backgroundColor: THEME.colors.error,
        color: THEME.colors.textPrimary,
        padding: '1rem',
        margin: '1rem 0',
        borderRadius: '4px',
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000
      }
    }, error);
  }, [error]);

  // Loading indicator component
  const LoadingSpinner = React.useCallback(() => {
    if (!loading) return null;
    return React.createElement('div', {
      className: 'loading-spinner',
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: THEME.colors.bgSecondary,
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 1000
      }
    }, 'Loading...');
  }, [loading]);

  // ============= CALENDAR MANAGEMENT ===============
  const initializeCalendarSequence = React.useCallback((startDate, startType) => {
    if (!validateDate(startDate) || !Object.values(DAY_TYPES).includes(startType)) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
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
        // Skip weekends
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
      setError(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }, []);

  const updateDayType = React.useCallback((date, type) => {
    if (!validateDate(date) || !Object.values(DAY_TYPES).includes(type)) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    try {
      const dateStr = date.toISOString().split('T')[0];
      
      setCalendar(prev => {
        const newCalendar = { ...prev };
        newCalendar[dateStr] = {
          ...(newCalendar[dateStr] || {}),
          type,
          lastModified: new Date().toISOString()
        };

        // If day type changes to non-school day, recalculate sequence
        if (type === DAY_TYPES.WORKSHOP || type === DAY_TYPES.HOLIDAY || 
            type === DAY_TYPES.ASSEMBLY || type === DAY_TYPES.SNOW) {
          return recalculateSequence(date, newCalendar);
        }

        return newCalendar;
      });

    } catch (err) {
      console.error('Day type update error:', err);
      setError(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }, []);

  const recalculateSequence = React.useCallback((fromDate, calendarData) => {
    if (!validateDate(fromDate) || !calendarData) {
      return calendarData; // Return unchanged if invalid input
    }

    const newCalendar = { ...calendarData };
    let currentType = null;
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);

    // Look back up to 30 days to find last known school day type
    const searchDate = new Date(startDate);
    for (let i = 0; i < 30; i++) {
      searchDate.setDate(searchDate.getDate() - 1);
      const dateStr = searchDate.toISOString().split('T')[0];
      const dayData = newCalendar[dateStr];
      
      if (dayData?.state === 'school' && 
          (dayData.type === DAY_TYPES.ODD || dayData.type === DAY_TYPES.EVEN)) {
        currentType = dayData.type;
        break;
      }
    }

    // If no previous type found, use default
    if (!currentType) {
      currentType = DAY_TYPES.ODD;
    }

    // Calculate forward for 6 months
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 6);
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const existingDay = newCalendar[dateStr];

        // Only update if it's a school day
        if (!existingDay || existingDay.state === 'school') {
          currentType = currentType === DAY_TYPES.ODD ? DAY_TYPES.EVEN : DAY_TYPES.ODD;
          newCalendar[dateStr] = {
            ...(existingDay || {}),
            type: currentType,
            state: 'school',
            lastModified: new Date().toISOString()
          };
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return newCalendar;
  }, []);

  const addCalendarNote = React.useCallback((date, note) => {
    if (!validateDate(date)) {
      setError(ERROR_MESSAGES.INVALID_DATE);
      return;
    }

    const sanitizedNote = sanitizeInput(note);
    const dateStr = date.toISOString().split('T')[0];

    setCalendar(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || {}),
        notes: sanitizedNote,
        lastModified: new Date().toISOString()
      }
    }));
  }, []);

  const getDayData = React.useCallback((date) => {
    if (!validateDate(date)) {
      return null;
    }

    const dateStr = date.toISOString().split('T')[0];
    return calendar[dateStr] || {
      type: DAY_TYPES.ODD,
      state: 'school',
      notes: '',
      lastModified: new Date().toISOString()
    };
  }, [calendar]);

  // ============= CLASS MANAGEMENT ===============
  const addClass = React.useCallback((classData = {}) => {
    try {
      if (typeof classData !== 'object') throw new Error(ERROR_MESSAGES.INVALID_INPUT);
      
      const newClass = {
        id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: sanitizeInput(classData.name) || 'New Class',
        gradeLevel: GRADE_LEVELS.includes(classData.gradeLevel) ? 
          classData.gradeLevel : GRADE_LEVELS[0],
        period: classData.period && PERIODS.includes(classData.period) ? 
          classData.period : PERIODS[0],
        dayType: Object.values(DAY_TYPES).includes(classData.dayType) ? 
          classData.dayType : DAY_TYPES.ODD,
        room: sanitizeInput(classData.room) || '',
        description: sanitizeInput(classData.description) || '',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      setClasses(prev => [...prev, newClass]);
      setStudents(prev => ({
        ...prev,
        [newClass.id]: []
      }));

      return newClass.id;
    } catch (err) {
      console.error('Class creation error:', err);
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return null;
    }
  }, []);

  const updateClass = React.useCallback((classId, updates) => {
    if (!classId || typeof updates !== 'object') {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        const sanitizedUpdates = {
          name: updates.name ? sanitizeInput(updates.name) : cls.name,
          gradeLevel: GRADE_LEVELS.includes(updates.gradeLevel) ? 
            updates.gradeLevel : cls.gradeLevel,
          period: PERIODS.includes(updates.period) ? 
            updates.period : cls.period,
          dayType: Object.values(DAY_TYPES).includes(updates.dayType) ? 
            updates.dayType : cls.dayType,
          room: updates.room ? sanitizeInput(updates.room) : cls.room,
          description: updates.description ? 
            sanitizeInput(updates.description) : cls.description,
        };

        return {
          ...cls,
          ...sanitizedUpdates,
          lastModified: new Date().toISOString()
        };
      }
      return cls;
    }));
  }, []);

  const deleteClass = React.useCallback((classId) => {
    if (!classId) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    setClasses(prev => prev.filter(cls => cls.id !== classId));
    setStudents(prev => {
      const newStudents = { ...prev };
      delete newStudents[classId];
      return newStudents;
    });
  }, []);

  // ============= UNIT MANAGEMENT ===============
  const addUnit = React.useCallback((unitData = {}) => {
    try {
      if (typeof unitData !== 'object') throw new Error(ERROR_MESSAGES.INVALID_INPUT);

      const startDate = unitData.startDate ? new Date(unitData.startDate) : new Date();
      const endDate = unitData.endDate ? new Date(unitData.endDate) : null;

      if (endDate && endDate < startDate) {
        throw new Error('End date cannot be before start date');
      }

      const newUnit = {
        id: `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: sanitizeInput(unitData.title) || 'New Unit',
        gradeLevel: GRADE_LEVELS.includes(unitData.gradeLevel) ? 
          unitData.gradeLevel : GRADE_LEVELS[0],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        description: sanitizeInput(unitData.description) || '',
        lessons: [],
        standards: (unitData.standards || []).map(standard => 
          sanitizeInput(standard)).filter(Boolean),
        objectives: (unitData.objectives || []).map(objective => 
          sanitizeInput(objective)).filter(Boolean),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      setUnits(prev => [...prev, newUnit]);
      return newUnit.id;
    } catch (err) {
      console.error('Unit creation error:', err);
      setError(err.message || ERROR_MESSAGES.INVALID_INPUT);
      return null;
    }
  }, []);

  const updateUnit = React.useCallback((unitId, updates) => {
    if (!unitId || typeof updates !== 'object') {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    setUnits(prev => prev.map(unit => {
      if (unit.id === unitId) {
        // Validate dates if provided
        let startDate = updates.startDate ? new Date(updates.startDate) : 
          new Date(unit.startDate);
        let endDate = updates.endDate ? new Date(updates.endDate) : 
          (unit.endDate ? new Date(unit.endDate) : null);

        if (endDate && endDate < startDate) {
          setError('End date cannot be before start date');
          return unit;
        }

        const sanitizedUpdates = {
          title: updates.title ? sanitizeInput(updates.title) : unit.title,
          gradeLevel: GRADE_LEVELS.includes(updates.gradeLevel) ? 
            updates.gradeLevel : unit.gradeLevel,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate ? endDate.toISOString().split('T')[0] : '',
          description: updates.description ? 
            sanitizeInput(updates.description) : unit.description,
          standards: updates.standards ? 
            updates.standards.map(standard => 
              sanitizeInput(standard)).filter(Boolean) : unit.standards,
          objectives: updates.objectives ? 
            updates.objectives.map(objective => 
              sanitizeInput(objective)).filter(Boolean) : unit.objectives
        };

        return {
          ...unit,
          ...sanitizedUpdates,
          lastModified: new Date().toISOString()
        };
      }
      return unit;
    }));
  }, []);

  const deleteUnit = React.useCallback((unitId) => {
    if (!unitId) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    setUnits(prev => prev.filter(unit => unit.id !== unitId));
  }, []);

  
