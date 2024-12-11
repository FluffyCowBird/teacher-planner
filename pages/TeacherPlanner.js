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

// Add additional input validation
const validateResourceUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Enhance sanitization
const enhancedSanitizeInput = (input, type = 'text') => {
  if (typeof input !== 'string') return '';
  let sanitized = input.trim();
  
  switch(type) {
    case 'html':
      // Remove all HTML tags for safety
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      break;
    case 'email':
      // Basic email sanitization
      sanitized = sanitized.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
      break;
    case 'filename':
      // Safe filename characters only
      sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
      break;
    default:
      // Basic XSS prevention
      sanitized = sanitized.replace(/[<>{}]/g, '');
  }
  
  return sanitized;
};

// Add data validation before save
const validateDataBeforeSave = (data) => {
  const validationRules = {
    standards: (standard) => (
      standard.code && 
      standard.subject && 
      GRADE_LEVELS.includes(standard.gradeLevel)
    ),
    resources: (resource) => (
      resource.title && 
      Object.values(RESOURCE_TYPES).includes(resource.type) &&
      (!resource.url || validateResourceUrl(resource.url))
    ),
    assessments: (assessment) => (
      assessment.title &&
      typeof assessment.totalPoints === 'number' &&
      Array.isArray(assessment.questions)
    )
  };

  return Object.entries(validationRules).every(([key, validate]) => {
    if (!data[key]) return true;
    return Object.values(data[key]).every(validate);
  });
};

// Enhanced error handling
const handleError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  let userMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
  
  if (error.code === 'QUOTA_EXCEEDED_ERR') {
    userMessage = 'Storage quota exceeded. Please delete some items.';
  } else if (error.name === 'SecurityError') {
    userMessage = 'Security validation failed. Please check your input.';
  }
  
  setError(userMessage);
  return null;
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
  const [standards, setStandards] = React.useState({});
const [resources, setResources] = React.useState({});
const [assessments, setAssessments] = React.useState({});
const [communicationTemplates, setCommunicationTemplates] = React.useState({});
const [unitConnections, setUnitConnections] = React.useState({});
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
        
        // Load new state
        setStandards(parsed.standards || {});
        setResources(parsed.resources || {});
        setAssessments(parsed.assessments || {});
        setCommunicationTemplates(parsed.communicationTemplates || {});
        setUnitConnections(parsed.unitConnections || {});
        
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
          lessonTemplates,
          standards,
          resources,
          assessments,
          communicationTemplates,
          unitConnections
        };
        localStorage.setItem('teacherPlannerData', JSON.stringify(dataToSave));
        setError(null);
      } catch (err) {
        console.error('Save error:', err);
        setError(ERROR_MESSAGES.STORAGE_ERROR);
      }
    }, 1000),
    [calendar, units, classes, students, lessonTemplates, 
     standards, resources, assessments, communicationTemplates, unitConnections]
  );

  React.useEffect(() => {
    saveData();
  }, [calendar, units, classes, students, lessonTemplates, 
      standards, resources, assessments, communicationTemplates, 
      unitConnections, saveData]);

  // Initialize calendar on mount if empty
  React.useEffect(() => {
    if (Object.keys(calendar).length === 0 && !loading) {
      initializeCalendarSequence(new Date(), DAY_TYPES.ODD);
    }
  }, [calendar, loading, initializeCalendarSequence]);

  // ============= CALENDAR MANAGEMENT ===============

  // ============= CALENDAR MANAGEMENT ===============

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

    // ============= STUDENT MANAGEMENT ===============
  const addStudent = React.useCallback((classId, studentData = {}) => {
    if (!classId || typeof studentData !== 'object') {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return null;
    }

    try {
      const newStudent = {
        id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: sanitizeInput(studentData.name) || 'New Student',
        email: sanitizeInput(studentData.email) || '',
        guardianEmail: sanitizeInput(studentData.guardianEmail) || '',
        guardianPhone: sanitizeInput(studentData.guardianPhone) || '',
        accommodations: sanitizeInput(studentData.accommodations) || '',
        status: [],
        attendance: {},
        grades: {},
        notes: sanitizeInput(studentData.notes) || '',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      setStudents(prev => ({
        ...prev,
        [classId]: [...(prev[classId] || []), newStudent]
      }));

      return newStudent.id;
    } catch (err) {
      console.error('Student creation error:', err);
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return null;
    }
  }, []);

  const updateStudent = React.useCallback((classId, studentId, updates) => {
    if (!classId || !studentId || typeof updates !== 'object') {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    setStudents(prev => {
      const classStudents = prev[classId] || [];
      return {
        ...prev,
        [classId]: classStudents.map(student => {
          if (student.id === studentId) {
            const sanitizedUpdates = {
              name: updates.name ? sanitizeInput(updates.name) : student.name,
              email: updates.email ? sanitizeInput(updates.email) : student.email,
              guardianEmail: updates.guardianEmail ? 
                sanitizeInput(updates.guardianEmail) : student.guardianEmail,
              guardianPhone: updates.guardianPhone ? 
                sanitizeInput(updates.guardianPhone) : student.guardianPhone,
              accommodations: updates.accommodations ? 
                sanitizeInput(updates.accommodations) : student.accommodations,
              notes: updates.notes ? sanitizeInput(updates.notes) : student.notes
            };

            return {
              ...student,
              ...sanitizedUpdates,
              lastModified: new Date().toISOString()
            };
          }
          return student;
        })
      };
    });
  }, []);

  // ============= ATTENDANCE MANAGEMENT ===============
  const updateAttendance = React.useCallback((classId, studentId, date, status) => {
    if (!classId || !studentId || !validateDate(date) || 
        !Object.values(STATUS_TYPES.ATTENDANCE).some(s => s.label === status)) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    const dateStr = date.toISOString().split('T')[0];

    setStudents(prev => {
      const classStudents = prev[classId] || [];
      return {
        ...prev,
        [classId]: classStudents.map(student => {
          if (student.id === studentId) {
            return {
              ...student,
              attendance: {
                ...student.attendance,
                [dateStr]: {
                  status,
                  timestamp: new Date().toISOString(),
                  modified: true
                }
              },
              lastModified: new Date().toISOString()
            };
          }
          return student;
        })
      };
    });
  }, []);

  const bulkUpdateAttendance = React.useCallback((classId, date, defaultStatus) => {
    if (!classId || !validateDate(date) || 
        !Object.values(STATUS_TYPES.ATTENDANCE).some(s => s.label === defaultStatus)) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    setStudents(prev => {
      const classStudents = prev[classId] || [];
      return {
        ...prev,
        [classId]: classStudents.map(student => ({
          ...student,
          attendance: {
            ...student.attendance,
            [dateStr]: {
              status: defaultStatus,
              timestamp,
              modified: false
            }
          },
          lastModified: timestamp
        }))
      };
    });
  }, []);

  // ============= STUDENT STATUS MANAGEMENT ===============
  const updateStudentStatus = React.useCallback((classId, studentId, statusType, category) => {
    if (!classId || !studentId || !STATUS_TYPES[category]?.[statusType]) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    setStudents(prev => {
      const classStudents = prev[classId] || [];
      return {
        ...prev,
        [classId]: classStudents.map(student => {
          if (student.id === studentId) {
            const newStatus = {
              type: statusType,
              category,
              icon: STATUS_TYPES[category][statusType].icon,
              label: STATUS_TYPES[category][statusType].label,
              timestamp: new Date().toISOString()
            };

            // Remove existing status of same type if exists
            const filteredStatus = student.status.filter(s => 
              !(s.category === category && s.type === statusType)
            );

            return {
              ...student,
              status: [...filteredStatus, newStatus],
              lastModified: new Date().toISOString()
            };
          }
          return student;
        })
      };
    });
  }, []);

  // ============= STUDENT DATA IMPORT/EXPORT ===============
  const importStudents = React.useCallback(async (file, classId) => {
    if (!file || !classId) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    try {
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      
      const students = rows.map(row => {
        const [name, email, guardianEmail, guardianPhone, accommodations] = 
          row.split(',').map(field => sanitizeInput(field));

        return {
          id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name || 'New Student',
          email: email || '',
          guardianEmail: guardianEmail || '',
          guardianPhone: guardianPhone || '',
          accommodations: accommodations || '',
          status: [],
          attendance: {},
          grades: {},
          notes: '',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
      });

      setStudents(prev => ({
        ...prev,
        [classId]: [...(prev[classId] || []), ...students]
      }));

      return students.length;
    } catch (err) {
      console.error('Student import error:', err);
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return 0;
    }
  }, []);

  const exportStudentData = React.useCallback((classId) => {
    if (!classId) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return null;
    }

    try {
      const classStudents = students[classId] || [];
      const csvContent = classStudents.map(student => [
        student.name,
        student.email,
        student.guardianEmail,
        student.guardianPhone,
        student.accommodations
      ].join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Student export error:', err);
      setError(ERROR_MESSAGES.UNKNOWN_ERROR);
      return null;
    }
  }, [students]);

    setUnits(prev => prev.filter(unit => unit.id !== unitId));
  }, []);

  // ============= UI COMPONENTS ===============
  const renderHeader = React.useCallback(() => {
    return React.createElement('header', { 
      className: 'planner-header',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        borderBottom: `1px solid ${THEME.colors.borderColor}`,
        padding: '1rem',
        marginBottom: '2rem'
      }
    }, [
      React.createElement('h1', {
        style: {
          fontFamily: THEME.fonts.title,
          fontSize: '2rem',
          margin: 0
        }
      }, 'Teacher Planner'),
      React.createElement('nav', {
        className: 'planner-nav',
        style: {
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem'
        }
      }, [
        ['calendar', 'units', 'classes'].map(viewType =>
          React.createElement('button', {
            key: viewType,
            onClick: () => setView(viewType),
            className: view === viewType ? 'active' : '',
            style: {
              backgroundColor: view === viewType ? 
                THEME.colors.accentPrimary : THEME.colors.bgPrimary,
              color: THEME.colors.textPrimary,
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: THEME.fonts.body,
              transition: 'all 0.2s ease'
            }
          }, viewType.charAt(0).toUpperCase() + viewType.slice(1))
        ),
        React.createElement('div', {
          style: {
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }
        }, [
          React.createElement('span', {
            style: {
              fontFamily: THEME.fonts.body,
              fontSize: '0.9rem',
              color: THEME.colors.textSecondary
            }
          }, new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })),
          React.createElement('button', {
            onClick: () => window.signOut(),
            style: {
              backgroundColor: THEME.colors.error,
              color: THEME.colors.textPrimary,
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Sign Out')
        ])
      ])
    ]);
  }, [view]);

  const renderCalendarControls = React.useCallback(() => {
    const viewToggleButton = React.createElement('button', {
      onClick: () => setCalendarView(
        calendarView === 'month' ? 'week' : 'month'
      ),
      className: 'view-toggle-button',
      style: {
        backgroundColor: THEME.colors.accentSecondary,
        color: THEME.colors.textPrimary,
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginLeft: 'auto'
      }
    }, `Switch to ${calendarView === 'month' ? 'Week' : 'Month'} View`);

    const dateNavigator = React.createElement('div', {
      className: 'date-navigator',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }
    }, [
      React.createElement('button', {
        onClick: () => {
          const newDate = new Date(selectedDate);
          if (calendarView === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
          } else {
            newDate.setDate(newDate.getDate() - 7);
          }
          setSelectedDate(newDate);
        },
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          color: THEME.colors.textPrimary,
          padding: '0.5rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, '←'),
      React.createElement('h2', {
        style: {
          fontFamily: THEME.fonts.title,
          margin: 0
        }
      }, calendarView === 'month' 
        ? selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })
        : `Week of ${getMonday(selectedDate).toLocaleDateString()}`
      ),
      React.createElement('button', {
        onClick: () => {
          const newDate = new Date(selectedDate);
          if (calendarView === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
          } else {
            newDate.setDate(newDate.getDate() + 7);
          }
          setSelectedDate(newDate);
        },
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          color: THEME.colors.textPrimary,
          padding: '0.5rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, '→'),
      viewToggleButton
    ]);

    const dayTypeSelector = React.createElement('div', {
      className: 'day-type-selector',
      style: {
        marginTop: '1rem',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }
    }, Object.entries(DAY_TYPES).map(([key, value]) =>
      React.createElement('button', {
        key,
        onClick: () => {
          if (selectedDate) {
            updateDayType(selectedDate, value);
          }
        },
        style: {
          backgroundColor: getDayData(selectedDate)?.type === value 
            ? THEME.colors.accentPrimary 
            : THEME.colors.bgSecondary,
          color: THEME.colors.textPrimary,
          padding: '0.25rem 0.5rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }
      }, key)
    ));

    return React.createElement('div', {
      className: 'calendar-controls',
      style: {
        marginBottom: '2rem'
      }
    }, [dateNavigator, dayTypeSelector]);
  }, [calendarView, selectedDate, updateDayType, getDayData]);

  // ============= CALENDAR RENDERING ===============
  const renderCalendarGrid = React.useCallback(() => {
    const today = new Date();
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Day headers (Monday-Friday only)
    WEEKDAYS.forEach(day => {
      days.push(React.createElement('div', {
        key: `header-${day}`,
        className: 'calendar-header',
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          color: THEME.colors.textPrimary,
          padding: '0.5rem',
          textAlign: 'center',
          fontFamily: THEME.fonts.title,
          borderBottom: `2px solid ${THEME.colors.borderColor}`
        }
      }, day));
    });

    // Empty cells for days before first of month
    let startDayIndex = firstDay.getDay();
    if (startDayIndex === 0) startDayIndex = 7; // Sunday becomes 7
    startDayIndex--; // Adjust for Monday start
    for (let i = 0; i < startDayIndex; i++) {
      days.push(React.createElement('div', {
        key: `empty-${i}`,
        className: 'calendar-day empty',
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          opacity: 0.5
        }
      }));
    }

    // Calendar days
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

      const dateStr = date.toISOString().split('T')[0];
      const dayData = getDayData(date);
      const classesForDay = classes.filter(c => c.dayType === dayData.type);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      days.push(React.createElement('div', {
        key: dateStr,
        className: `calendar-day ${dayData.type}`,
        onClick: () => {
          setSelectedDate(new Date(date));
          if (dayData.type === 'school') {
            const newType = prompt('Enter day type:', Object.keys(DAY_TYPES).join(', '));
            if (newType && DAY_TYPES[newType.toUpperCase()]) {
              updateDayType(date, DAY_TYPES[newType.toUpperCase()]);
            }
          }
        },
        style: {
          backgroundColor: getDayTypeColor(dayData.type),
          border: isToday ? `2px solid ${THEME.colors.accentPrimary}` :
                 isSelected ? `2px solid ${THEME.colors.accentSecondary}` :
                 `1px solid ${THEME.colors.borderColor}`,
          padding: '0.5rem',
          minHeight: '100px',
          cursor: 'pointer',
          position: 'relative'
        }
      }, [
        // Date number
        React.createElement('div', {
          className: 'date-number',
          style: {
            fontFamily: THEME.fonts.title,
            fontSize: '1.1rem',
            marginBottom: '0.5rem'
          }
        }, date.getDate()),

        // Day type indicator
        React.createElement('div', {
          className: 'day-type',
          style: {
            fontSize: '0.8rem',
            color: THEME.colors.textSecondary,
            marginBottom: '0.5rem'
          }
        }, dayData.type.toUpperCase()),

        // Classes list
        React.createElement('div', {
          className: 'day-classes',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }
        }, classesForDay.map(cls =>
          React.createElement('div', {
            key: cls.id,
            className: 'day-class-item',
            style: {
              backgroundColor: THEME.colors.bgSecondary,
              padding: '0.25rem 0.5rem',
              borderRadius: '2px',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }
          }, `P${cls.period}: ${cls.name}`)
        )),

        // Notes indicator
        dayData.notes && React.createElement('div', {
          className: 'notes-indicator',
          style: {
            position: 'absolute',
            bottom: '0.25rem',
            right: '0.25rem',
            fontSize: '0.8rem',
            color: THEME.colors.textSecondary
          }
        }, '📝')
      ]));
    }

    return React.createElement('div', {
      className: 'calendar-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.5rem',
        backgroundColor: THEME.colors.bgPrimary,
        padding: '1rem',
        borderRadius: '8px'
      }
    }, days);
  }, [selectedDate, classes, getDayData, updateDayType]);

  // Helper function for day type colors
  const getDayTypeColor = React.useCallback((type) => {
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
  }, []);

  // ============= WEEK VIEW RENDERING ===============
  const renderWeekView = React.useCallback(() => {
    const monday = getMonday(selectedDate);
    const periodLabels = React.createElement('div', {
      className: 'period-labels',
      style: {
        display: 'grid',
        gridTemplateRows: `50px repeat(${PERIODS.length}, 1fr)`,
        gap: '0.5rem',
        marginRight: '0.5rem'
      }
    }, [
      // Empty cell for top-left corner
      React.createElement('div', {
        key: 'corner',
        style: { height: '50px' }
      }),
      // Period numbers
      ...PERIODS.map(period => 
        React.createElement('div', {
          key: `period-${period}`,
          style: {
            backgroundColor: THEME.colors.bgSecondary,
            padding: '0.5rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: THEME.fonts.title,
            color: THEME.colors.textPrimary
          }
        }, `Period ${period}`)
      )
    ]);

    const weekGrid = React.createElement('div', {
      className: 'week-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.5rem',
        flex: 1
      }
    }, WEEKDAYS.map((day, index) => {
      const currentDate = addDays(monday, index);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = getDayData(currentDate);

      return React.createElement('div', {
        key: day,
        className: 'day-column',
        style: {
          display: 'grid',
          gridTemplateRows: `50px repeat(${PERIODS.length}, 1fr)`,
          gap: '0.5rem'
        }
      }, [
        // Day header
        React.createElement('div', {
          className: 'day-header',
          style: {
            backgroundColor: THEME.colors.bgSecondary,
            padding: '0.5rem',
            borderRadius: '4px',
            textAlign: 'center',
            fontFamily: THEME.fonts.title,
            position: 'relative'
          }
        }, [
          React.createElement('div', null, day),
          React.createElement('div', {
            style: {
              fontSize: '0.8rem',
              color: THEME.colors.textSecondary
            }
          }, currentDate.getDate()),
          React.createElement('div', {
            style: {
              position: 'absolute',
              top: '0.25rem',
              right: '0.25rem',
              fontSize: '0.8rem',
              color: THEME.colors.textSecondary,
              backgroundColor: getDayTypeColor(dayData.type),
              padding: '0.1rem 0.3rem',
              borderRadius: '2px'
            }
          }, dayData.type)
        ]),
        // Period cells
        ...PERIODS.map(period => {
          const classesForPeriod = classes.filter(c => 
            c.period === period && c.dayType === dayData.type
          );

          return React.createElement('div', {
            key: `p${period}`,
            className: 'period-cell',
            style: {
              backgroundColor: THEME.colors.bgSecondary,
              padding: '0.5rem',
              borderRadius: '4px',
              minHeight: '120px',
              position: 'relative'
            },
            onClick: () => quickAddLesson(dateStr, period)
          }, [
            // Classes
            ...classesForPeriod.map(cls => 
              React.createElement('div', {
                key: cls.id,
                className: 'class-block',
                style: {
                  backgroundColor: THEME.colors.bgPrimary,
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  borderRadius: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }
              }, [
                React.createElement('div', {
                  style: {
                    fontWeight: 'bold',
                    marginBottom: '0.25rem'
                  }
                }, cls.name),
                React.createElement('div', {
                  style: {
                    fontSize: '0.8rem',
                    color: THEME.colors.textSecondary
                  }
                }, `Room ${cls.room}`),
                // Quick attendance buttons
                React.createElement('div', {
                  className: 'quick-attendance',
                  style: {
                    marginTop: '0.5rem',
                    display: 'flex',
                    gap: '0.25rem'
                  }
                }, [
                  React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      bulkUpdateAttendance(cls.id, currentDate, STATUS_TYPES.ATTENDANCE.PRESENT.label);
                    },
                    style: {
                      padding: '0.25rem',
                      fontSize: '0.8rem',
                      backgroundColor: THEME.colors.success
                    }
                  }, '✓ All'),
                  React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      showAttendanceModal(cls.id, currentDate);
                    },
                    style: {
                      padding: '0.25rem',
                      fontSize: '0.8rem',
                      backgroundColor: THEME.colors.accentPrimary
                    }
                  }, '📋')
                ])
              ])
            ),
            // Quick add lesson button
            classesForPeriod.length > 0 && React.createElement('button', {
              className: 'quick-add-lesson',
              onClick: (e) => {
                e.stopPropagation();
                quickAddLesson(dateStr, period);
              },
              style: {
                position: 'absolute',
                bottom: '0.25rem',
                right: '0.25rem',
                padding: '0.25rem',
                fontSize: '0.8rem',
                backgroundColor: THEME.colors.accentSecondary,
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }
            }, '+')
          ]);
        })
      ]);
    }));

    return React.createElement('div', {
      className: 'week-view',
      style: {
        display: 'flex',
        gap: '0.5rem',
        height: 'calc(100vh - 200px)', // Adjust based on header height
        overflow: 'auto'
      }
    }, [periodLabels, weekGrid]);
  }, [selectedDate, classes, getDayData, bulkUpdateAttendance, quickAddLesson]);

  // ============= QUICK LESSON FUNCTIONS ===============
  const quickAddLesson = React.useCallback((dateStr, period) => {
    const classesForPeriod = classes.filter(c => {
      const dayData = getDayData(new Date(dateStr));
      return c.period === period && c.dayType === dayData.type;
    });

    if (classesForPeriod.length === 0) return;

    // Create modal content
    const modalContent = React.createElement('div', {
      className: 'quick-lesson-modal',
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: THEME.colors.bgSecondary,
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        zIndex: 1000
      }
    }, [
      // Modal Header
      React.createElement('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }
      }, [
        React.createElement('h3', {
          style: {
            fontFamily: THEME.fonts.title,
            margin: 0
          }
        }, `Quick Lesson Plan - ${new Date(dateStr).toLocaleDateString()}`),
        React.createElement('button', {
          onClick: closeQuickLessonModal,
          style: {
            backgroundColor: 'transparent',
            border: 'none',
            color: THEME.colors.textSecondary,
            fontSize: '1.5rem',
            cursor: 'pointer'
          }
        }, '×')
      ]),

      // Lesson Form
      React.createElement('form', {
        onSubmit: (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const lessonData = {
            classId: formData.get('classId'),
            title: formData.get('title'),
            objectives: formData.get('objectives').split('\n').filter(Boolean),
            materials: formData.get('materials').split('\n').filter(Boolean),
            procedure: formData.get('procedure').split('\n').filter(Boolean),
            homework: formData.get('homework'),
            date: dateStr,
            period: period
          };
          saveLessonPlan(lessonData);
          closeQuickLessonModal();
        },
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }
      }, [
        // Class Selection
        React.createElement('div', {
          className: 'form-group'
        }, [
          React.createElement('label', {
            htmlFor: 'classId',
            style: { color: THEME.colors.textSecondary }
          }, 'Class'),
          React.createElement('select', {
            name: 'classId',
            required: true,
            style: {
              width: '100%',
              padding: '0.5rem',
              backgroundColor: THEME.colors.bgPrimary,
              color: THEME.colors.textPrimary,
              border: `1px solid ${THEME.colors.borderColor}`,
              borderRadius: '4px'
            }
          }, classesForPeriod.map(cls =>
            React.createElement('option', {
              key: cls.id,
              value: cls.id
            }, cls.name)
          ))
        ]),

        // Title
        React.createElement('div', {
          className: 'form-group'
        }, [
          React.createElement('label', {
            htmlFor: 'title',
            style: { color: THEME.colors.textSecondary }
          }, 'Lesson Title'),
          React.createElement('input', {
            name: 'title',
            required: true,
            placeholder: 'Enter lesson title',
            style: {
              width: '100%',
              padding: '0.5rem',
              backgroundColor: THEME.colors.bgPrimary,
              color: THEME.colors.textPrimary,
              border: `1px solid ${THEME.colors.borderColor}`,
              borderRadius: '4px'
            }
          })
        ]),

        // Quick Template Selection
        React.createElement('div', {
          className: 'form-group'
        }, [
          React.createElement('label', {
            style: { color: THEME.colors.textSecondary }
          }, 'Quick Templates'),
          React.createElement('div', {
            style: {
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }
          }, lessonTemplates.map(template =>
            React.createElement('button', {
              type: 'button',
              key: template.id,
              onClick: () => applyLessonTemplate(template.id),
              style: {
                padding: '0.5rem',
                backgroundColor: THEME.colors.accentSecondary,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            }, template.title)
          ))
        ]),

        // Objectives
        React.createElement('div', {
          className: 'form-group'
        }, [
          React.createElement('label', {
            htmlFor: 'objectives',
            style: { color: THEME.colors.textSecondary }
          }, 'Objectives (one per line)'),
          React.createElement('textarea', {
            name: 'objectives',
            rows: 3,
            placeholder: 'Enter lesson objectives',
            style: {
              width: '100%',
              padding: '0.5rem',
              backgroundColor: THEME.colors.bgPrimary,
              color: THEME.colors.textPrimary,
              border: `1px solid ${THEME.colors.borderColor}`,
              borderRadius: '4px'
            }
          })
        ]),

        // Additional fields following same pattern...
        // [Previous code continues with materials, procedure, homework fields]

        // Submit Button
        React.createElement('button', {
          type: 'submit',
          style: {
            padding: '0.75rem',
            backgroundColor: THEME.colors.accentPrimary,
            color: THEME.colors.textPrimary,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem'
          }
        }, 'Save Lesson Plan')
      ])
    ]);

    // Add modal to DOM
    const modalContainer = document.createElement('div');
    modalContainer.id = 'quick-lesson-modal';
    document.body.appendChild(modalContainer);
    ReactDOM.render(modalContent, modalContainer);
  }, [classes, getDayData, lessonTemplates, closeQuickLessonModal, saveLessonPlan]);

  // ============= UNIT & CURRICULUM MANAGEMENT ===============
  const renderUnitPlanner = React.useCallback(() => {
    const filteredUnits = units
      .filter(unit => !filters.gradeLevel || unit.gradeLevel === filters.gradeLevel)
      .sort((a, b) => {
        // Sort by grade level first, then by start date
        if (a.gradeLevel !== b.gradeLevel) return a.gradeLevel - b.gradeLevel;
        return new Date(a.startDate) - new Date(b.startDate);
      });

    const unitsByGrade = GRADE_LEVELS.reduce((acc, grade) => {
      acc[grade] = filteredUnits.filter(unit => unit.gradeLevel === grade);
      return acc;
    }, {});

    return React.createElement('div', {
      className: 'unit-planner',
      style: {
        padding: '1rem',
        backgroundColor: THEME.colors.bgPrimary,
        borderRadius: '8px'
      }
    }, [
      // Unit Controls
      React.createElement('div', {
        className: 'unit-controls',
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }
      }, [
        React.createElement('div', {
          style: {
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }
        }, [
          React.createElement('button', {
            onClick: () => showNewUnitModal(),
            style: {
              backgroundColor: THEME.colors.accentPrimary,
              color: THEME.colors.textPrimary,
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: THEME.fonts.body
            }
          }, '+ New Unit'),
          React.createElement('select', {
            value: filters.gradeLevel || '',
            onChange: (e) => setFilters(prev => ({
              ...prev,
              gradeLevel: e.target.value ? parseInt(e.target.value) : null
            })),
            style: {
              padding: '0.5rem',
              backgroundColor: THEME.colors.bgSecondary,
              color: THEME.colors.textPrimary,
              border: `1px solid ${THEME.colors.borderColor}`,
              borderRadius: '4px'
            }
          }, [
            React.createElement('option', { value: '' }, 'All Grades'),
            ...GRADE_LEVELS.map(grade => 
              React.createElement('option', { 
                key: grade, 
                value: grade 
              }, `Grade ${grade}`)
            )
          ])
        ]),
        React.createElement('div', {
          style: {
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }
        }, [
          React.createElement('button', {
            onClick: showStandardsLibrary,
            style: {
              backgroundColor: THEME.colors.bgSecondary,
              color: THEME.colors.textPrimary,
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Standards Library'),
          React.createElement('button', {
            onClick: showResourceLibrary,
            style: {
              backgroundColor: THEME.colors.bgSecondary,
              color: THEME.colors.textPrimary,
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Resources')
        ])
      ]),

      // Units by Grade Level
      ...Object.entries(unitsByGrade).map(([grade, gradeUnits]) =>
        React.createElement('div', {
          key: grade,
          className: 'grade-units',
          style: {
            marginBottom: '2rem'
          }
        }, [
          React.createElement('h3', {
            style: {
              fontFamily: THEME.fonts.title,
              color: THEME.colors.textPrimary,
              marginBottom: '1rem',
              borderBottom: `2px solid ${THEME.colors.borderColor}`,
              paddingBottom: '0.5rem'
            }
          }, `Grade ${grade} Units`),
          React.createElement('div', {
            className: 'units-grid',
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem'
            }
          }, gradeUnits.map(unit => renderUnitCard(unit)))
        ])
      )
    ]);
  }, [units, filters, showNewUnitModal, showStandardsLibrary, showResourceLibrary]);

  const renderUnitCard = React.useCallback((unit) => {
    const progressData = calculateUnitProgress(unit);
    
    return React.createElement('div', {
      key: unit.id,
      className: 'unit-card',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative'
      }
    }, [
      // Unit Header
      React.createElement('div', {
        className: 'unit-header',
        style: {
          marginBottom: '1rem'
        }
      }, [
        React.createElement('input', {
          value: unit.title,
          onChange: (e) => updateUnit(unit.id, { title: sanitizeInput(e.target.value) }),
          style: {
            width: '100%',
            padding: '0.5rem',
            backgroundColor: THEME.colors.bgPrimary,
            color: THEME.colors.textPrimary,
            border: `1px solid ${THEME.colors.borderColor}`,
            borderRadius: '4px',
            fontFamily: THEME.fonts.title,
            fontSize: '1.1rem'
          }
        }),
        React.createElement('div', {
          style: {
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.5rem'
          }
        }, [
          React.createElement('input', {
            type: 'date',
            value: unit.startDate,
            onChange: (e) => updateUnit(unit.id, { startDate: e.target.value }),
            style: {
              padding: '0.25rem',
              backgroundColor: THEME.colors.bgPrimary,
              color: THEME.colors.textPrimary,
              border: `1px solid ${THEME.colors.borderColor}`,
              borderRadius: '4px',
              flex: 1
            }
          }),
          React.createElement('input', {
            type: 'date',
            value: unit.endDate,
            onChange: (e) => updateUnit(unit.id, { endDate: e.target.value }),
            style: {
              padding: '0.25rem',
              backgroundColor: THEME.colors.bgPrimary,
              color: THEME.colors.textPrimary,
              border: `1px solid ${THEME.colors.borderColor}`,
              borderRadius: '4px',
              flex: 1
            }
          })
        ])
      ]),

      // Progress Bar
      React.createElement('div', {
        className: 'progress-bar',
        style: {
          height: '4px',
          backgroundColor: THEME.colors.bgPrimary,
          borderRadius: '2px',
          marginBottom: '1rem'
        }
      }, React.createElement('div', {
        style: {
          width: `${progressData.percentage}%`,
          height: '100%',
          backgroundColor: THEME.colors.accentPrimary,
          borderRadius: '2px',
          transition: 'width 0.3s ease'
        }
      })),

      // Quick Stats
      React.createElement('div', {
        className: 'unit-stats',
        style: {
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: THEME.colors.textSecondary
        }
      }, [
        React.createElement('span', null, `${progressData.completedLessons}/${progressData.totalLessons} Lessons`),
        React.createElement('span', null, `${progressData.standards.length} Standards`),
        React.createElement('span', null, `${progressData.resources.length} Resources`)
      ]),

      // Action Buttons
      React.createElement('div', {
        className: 'unit-actions',
        style: {
          display: 'flex',
          gap: '0.5rem',
          marginTop: 'auto'
        }
      }, [
        React.createElement('button', {
          onClick: () => showUnitDetails(unit.id),
          style: {
            flex: 1,
            padding: '0.5rem',
            backgroundColor: THEME.colors.accentSecondary,
            color: THEME.colors.textPrimary,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Details'),
        React.createElement('button', {
          onClick: () => showUnitPlanning(unit.id),
          style: {
            flex: 1,
            padding: '0.5rem',
            backgroundColor: THEME.colors.accentPrimary,
            color: THEME.colors.textPrimary,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Plan')
      ])
    ]);
  }, [updateUnit, showUnitDetails, showUnitPlanning, calculateUnitProgress]);

  // ============= STANDARDS MANAGEMENT ===============
const [selectedSubject, setSelectedSubject] = React.useState(null);

const SUBJECTS = {
  MATH: 'math',
  ELA: 'ela',
  SCIENCE: 'science',
  SOCIAL_STUDIES: 'social_studies'
};

const addStandard = React.useCallback((standardData) => {
  try {
    const newStandard = {
      id: `standard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: sanitizeInput(standardData.code),
      subject: standardData.subject,
      gradeLevel: GRADE_LEVELS.includes(standardData.gradeLevel) ? 
        standardData.gradeLevel : null,
      description: sanitizeInput(standardData.description),
      category: sanitizeInput(standardData.category),
      subcategory: sanitizeInput(standardData.subcategory),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setStandards(prev => ({
      ...prev,
      [newStandard.id]: newStandard
    }));

    return newStandard.id;
  } catch (err) {
    console.error('Standard creation error:', err);
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return null;
  }
}, []);

const updateStandard = React.useCallback((standardId, updates) => {
  if (!standardId || typeof updates !== 'object') {
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return;
  }

  setStandards(prev => ({
    ...prev,
    [standardId]: {
      ...prev[standardId],
      ...Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [key, sanitizeInput(value)])
      ),
      lastModified: new Date().toISOString()
    }
  }));
}, []);

// ============= RESOURCE LIBRARY ===============
const [resourceTags, setResourceTags] = React.useState([]);

const RESOURCE_TYPES = {
  DOCUMENT: 'document',
  VIDEO: 'video',
  WEBSITE: 'website',
  ASSESSMENT: 'assessment',
  ACTIVITY: 'activity'
};

const addResource = React.useCallback(async (resourceData, file = null) => {
  try {
    const newResource = {
      id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: sanitizeInput(resourceData.title),
      type: RESOURCE_TYPES[resourceData.type] || RESOURCE_TYPES.DOCUMENT,
      description: sanitizeInput(resourceData.description),
      tags: (resourceData.tags || []).map(tag => sanitizeInput(tag)),
      standards: resourceData.standards || [],
      url: sanitizeInput(resourceData.url),
      gradeLevel: GRADE_LEVELS.includes(resourceData.gradeLevel) ? 
        resourceData.gradeLevel : null,
      subject: resourceData.subject,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    // Once we switch to Firebase, this will upload the file to storage
    if (file) {
      newResource.fileName = file.name;
      // TODO: Add Firebase storage upload logic here
    }

    setResources(prev => ({
      ...prev,
      [newResource.id]: newResource
    }));

    // Update tag list
    setResourceTags(prev => [
      ...new Set([...prev, ...(resourceData.tags || [])])
    ]);

    return newResource.id;
  } catch (err) {
    console.error('Resource creation error:', err);
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return null;
  }
}, []);

// ============= ASSESSMENT TOOLS ===============
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
  MATCHING: 'matching',
  TRUE_FALSE: 'true_false'
};

const addAssessment = React.useCallback((assessmentData) => {
  try {
    const newAssessment = {
      id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: sanitizeInput(assessmentData.title),
      description: sanitizeInput(assessmentData.description),
      standards: assessmentData.standards || [],
      timeLimit: assessmentData.timeLimit || null,
      totalPoints: assessmentData.totalPoints || 0,
      questions: [],
      rubrics: {},
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setAssessments(prev => ({
      ...prev,
      [newAssessment.id]: newAssessment
    }));

    return newAssessment.id;
  } catch (err) {
    console.error('Assessment creation error:', err);
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return null;
  }
}, []);

const addQuestion = React.useCallback((assessmentId, questionData) => {
  if (!assessmentId || typeof questionData !== 'object') {
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return null;
  }

  try {
    const newQuestion = {
      id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: QUESTION_TYPES[questionData.type] || QUESTION_TYPES.MULTIPLE_CHOICE,
      text: sanitizeInput(questionData.text),
      points: questionData.points || 1,
      options: (questionData.options || []).map(opt => sanitizeInput(opt)),
      correctAnswer: questionData.correctAnswer,
      rubric: questionData.rubric || null,
      standards: questionData.standards || []
    };

    setAssessments(prev => ({
      ...prev,
      [assessmentId]: {
        ...prev[assessmentId],
        questions: [...prev[assessmentId].questions, newQuestion],
        lastModified: new Date().toISOString()
      }
    }));

    return newQuestion.id;
  } catch (err) {
    console.error('Question creation error:', err);
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return null;
  }
}, []);

// ============= PROGRESS REPORTING ===============
const generateProgressReport = React.useCallback((classId, startDate, endDate) => {
  if (!classId || !validateDate(startDate) || !validateDate(endDate)) {
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return null;
  }

  try {
    const classStudents = students[classId] || [];
    const reportData = {
      generated: new Date().toISOString(),
      class: classes.find(c => c.id === classId),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      students: classStudents.map(student => ({
        id: student.id,
        name: student.name,
        attendance: calculateAttendanceStats(student, startDate, endDate),
        standards: calculateStandardsMastery(student, startDate, endDate),
        assessments: calculateAssessmentProgress(student, startDate, endDate)
      }))
    };

    return reportData;
  } catch (err) {
    console.error('Progress report generation error:', err);
    setError(ERROR_MESSAGES.UNKNOWN_ERROR);
    return null;
  }
}, [students, classes]);

// Helper functions for progress reporting
const calculateAttendanceStats = (student, startDate, endDate) => {
  const stats = {
    present: 0,
    absent: 0,
    tardy: 0,
    total: 0
  };

  Object.entries(student.attendance || {}).forEach(([dateStr, record]) => {
    const date = new Date(dateStr);
    if (date >= startDate && date <= endDate) {
      stats.total++;
      if (record.status === STATUS_TYPES.ATTENDANCE.PRESENT.label) stats.present++;
      if (record.status === STATUS_TYPES.ATTENDANCE.ABSENT.label) stats.absent++;
      if (record.status === STATUS_TYPES.ATTENDANCE.TARDY.label) stats.tardy++;
    }
  });

  return stats;
};

const calculateStandardsMastery = (student, startDate, endDate) => {
  // Implementation will depend on how standards tracking is stored
  return [];
};

const calculateAssessmentProgress = (student, startDate, endDate) => {
  // Implementation will depend on how assessment results are stored
  return [];
};

// ============= PARENT COMMUNICATION ===============
const TEMPLATE_TYPES = {
  PROGRESS_UPDATE: 'progress_update',
  BEHAVIOR_NOTIFICATION: 'behavior_notification',
  ABSENCE_FOLLOW_UP: 'absence_follow_up',
  ASSIGNMENT_REMINDER: 'assignment_reminder',
  CUSTOM: 'custom'
};

const addCommunicationTemplate = React.useCallback((templateData) => {
  try {
    const newTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: TEMPLATE_TYPES[templateData.type] || TEMPLATE_TYPES.CUSTOM,
      title: sanitizeInput(templateData.title),
      subject: sanitizeInput(templateData.subject),
      body: sanitizeInput(templateData.body),
      variables: templateData.variables || [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setCommunicationTemplates(prev => ({
      ...prev,
      [newTemplate.id]: newTemplate
    }));

    return newTemplate.id;
  } catch (err) {
    console.error('Template creation error:', err);
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return null;
  }
}, []);

const generateCommunication = React.useCallback((templateId, studentId, customData = {}) => {
  if (!templateId || !studentId) {
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return null;
  }

  try {
    const template = communicationTemplates[templateId];
    const student = Object.values(students).flat().find(s => s.id === studentId);
    
    if (!template || !student) {
      throw new Error('Template or student not found');
    }

    let subject = template.subject;
    let body = template.body;

    // Replace variables in template
    const variables = {
      studentName: student.name,
      guardianEmail: student.guardianEmail,
      date: new Date().toLocaleDateString(),
      ...customData
    };

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    return {
      to: student.guardianEmail,
      subject,
      body
    };
  } catch (err) {
    console.error('Communication generation error:', err);
    setError(ERROR_MESSAGES.UNKNOWN_ERROR);
    return null;
  }
}, [communicationTemplates, students]);

// ============= CROSS-UNIT PLANNING ===============
const addUnitConnection = React.useCallback((connectionData) => {
  try {
    const newConnection = {
      id: `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      units: connectionData.units,
      type: sanitizeInput(connectionData.type),
      description: sanitizeInput(connectionData.description),
      standards: connectionData.standards || [],
      resources: connectionData.resources || [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setUnitConnections(prev => ({
      ...prev,
      [newConnection.id]: newConnection
    }));

    return newConnection.id;
  } catch (err) {
    console.error('Unit connection creation error:', err);
    setError(ERROR_MESSAGES.INVALID_INPUT);
    return null;
  }
}, []);

const findRelatedUnits = React.useCallback((unitId) => {
  if (!unitId) return [];

  try {
    const connections = Object.values(unitConnections)
      .filter(conn => conn.units.includes(unitId));
    
    const relatedUnitIds = new Set(
      connections.flatMap(conn => conn.units.filter(id => id !== unitId))
    );

    return Array.from(relatedUnitIds)
      .map(id => units.find(unit => unit.id === id))
      .filter(Boolean);
  } catch (err) {
    console.error('Related units search error:', err);
    setError(ERROR_MESSAGES.UNKNOWN_ERROR);
    return [];
  }
}, [unitConnections, units]);

// Firebase Integration Preparation
const initializeFirebase = async () => {
  // This function will be implemented when ready to switch to Firebase
  // It will handle:
  // 1. Setting up Firebase Auth listeners
  // 2. Initializing Firestore collections
  // 3. Setting up real-time data synchronization
  // 4. Handling offline persistence
};

const syncDataToFirebase = async () => {
  // This function will handle data synchronization with Firebase
  // It will be called whenever local data changes
};

  // ============= STANDARDS LIBRARY UI ===============
const renderStandardsLibrary = React.useCallback(() => {
  return React.createElement('div', {
    className: 'standards-library',
    style: {
      padding: '1rem',
      backgroundColor: THEME.colors.bgPrimary,
      borderRadius: '8px'
    }
  }, [
    // Header with controls
    React.createElement('div', {
      className: 'standards-header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }
    }, [
      React.createElement('h2', {
        style: {
          fontFamily: THEME.fonts.title,
          margin: 0
        }
      }, 'Standards Library'),
      React.createElement('div', {
        className: 'standards-controls',
        style: {
          display: 'flex',
          gap: '1rem'
        }
      }, [
        React.createElement('button', {
          onClick: () => showAddStandardModal(),
          style: {
            backgroundColor: THEME.colors.accentPrimary,
            color: THEME.colors.textPrimary,
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Add Standard'),
        React.createElement('select', {
          value: selectedSubject || '',
          onChange: (e) => setSelectedSubject(e.target.value || null),
          style: {
            padding: '0.5rem',
            backgroundColor: THEME.colors.bgSecondary,
            color: THEME.colors.textPrimary,
            border: `1px solid ${THEME.colors.borderColor}`,
            borderRadius: '4px'
          }
        }, [
          React.createElement('option', { value: '' }, 'All Subjects'),
          ...Object.entries(SUBJECTS).map(([key, value]) =>
            React.createElement('option', { key, value }, key.replace('_', ' '))
          )
        ])
      ])
    ]),

    // Standards Grid
    React.createElement('div', {
      className: 'standards-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }
    }, Object.values(standards)
      .filter(standard => !selectedSubject || standard.subject === selectedSubject)
      .map(standard => renderStandardCard(standard)))
  ]);
}, [standards, selectedSubject, showAddStandardModal]);

const renderStandardCard = React.useCallback((standard) => {
  return React.createElement('div', {
    key: standard.id,
    className: 'standard-card',
    style: {
      backgroundColor: THEME.colors.bgSecondary,
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  }, [
    React.createElement('div', {
      className: 'standard-header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }
    }, [
      React.createElement('span', {
        style: {
          fontWeight: 'bold',
          color: THEME.colors.textPrimary
        }
      }, standard.code),
      React.createElement('span', {
        style: {
          color: THEME.colors.textSecondary
        }
      }, `Grade ${standard.gradeLevel}`)
    ]),
    React.createElement('p', {
      style: {
        margin: '0 0 1rem 0',
        color: THEME.colors.textPrimary
      }
    }, standard.description),
    React.createElement('div', {
      className: 'standard-footer',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, [
      React.createElement('span', {
        style: {
          color: THEME.colors.textSecondary,
          fontSize: '0.9rem'
        }
      }, standard.category),
      React.createElement('button', {
        onClick: () => showStandardDetails(standard.id),
        style: {
          backgroundColor: THEME.colors.accentSecondary,
          color: THEME.colors.textPrimary,
          padding: '0.5rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Details')
    ])
  ]);
}, [showStandardDetails]);

// ============= RESOURCE LIBRARY UI ===============
const renderResourceLibrary = React.useCallback(() => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [selectedType, setSelectedType] = React.useState(null);

  const filteredResources = Object.values(resources).filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => resource.tags.includes(tag));
    const matchesType = !selectedType || resource.type === selectedType;
    return matchesSearch && matchesTags && matchesType;
  });

  return React.createElement('div', {
    className: 'resource-library',
    style: {
      padding: '1rem',
      backgroundColor: THEME.colors.bgPrimary,
      borderRadius: '8px'
    }
  }, [
    // Header and Search
    React.createElement('div', {
      className: 'resource-header',
      style: {
        marginBottom: '2rem'
      }
    }, [
      React.createElement('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }
      }, [
        React.createElement('h2', {
          style: {
            fontFamily: THEME.fonts.title,
            margin: 0
          }
        }, 'Resource Library'),
        React.createElement('button', {
          onClick: () => showAddResourceModal(),
          style: {
            backgroundColor: THEME.colors.accentPrimary,
            color: THEME.colors.textPrimary,
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Add Resource')
      ]),
      React.createElement('input', {
        type: 'text',
        placeholder: 'Search resources...',
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        style: {
          width: '100%',
          padding: '0.75rem',
          backgroundColor: THEME.colors.bgSecondary,
          color: THEME.colors.textPrimary,
          border: `1px solid ${THEME.colors.borderColor}`,
          borderRadius: '4px',
          marginBottom: '1rem'
        }
      }),
      React.createElement('div', {
        className: 'resource-filters',
        style: {
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }
      }, [
        // Type filter
        React.createElement('select', {
          value: selectedType || '',
          onChange: (e) => setSelectedType(e.target.value || null),
          style: {
            padding: '0.5rem',
            backgroundColor: THEME.colors.bgSecondary,
            color: THEME.colors.textPrimary,
            border: `1px solid ${THEME.colors.borderColor}`,
            borderRadius: '4px'
          }
        }, [
          React.createElement('option', { value: '' }, 'All Types'),
          ...Object.entries(RESOURCE_TYPES).map(([key, value]) =>
            React.createElement('option', { key, value }, 
              key.charAt(0) + key.slice(1).toLowerCase()
            )
          )
        ]),
        // Tag filter
        React.createElement('div', {
          className: 'tag-filters',
          style: {
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }
        }, resourceTags.map(tag =>
          React.createElement('button', {
            key: tag,
            onClick: () => setSelectedTags(prev => 
              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
            ),
            style: {
              backgroundColor: selectedTags.includes(tag) ? 
                THEME.colors.accentPrimary : THEME.colors.bgSecondary,
              color: THEME.colors.textPrimary,
              padding: '0.25rem 0.5rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, tag)
        ))
      ])
    ]),

    // Resource Grid
    React.createElement('div', {
      className: 'resource-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }
    }, filteredResources.map(resource => renderResourceCard(resource)))
  ]);
}, [resources, resourceTags, showAddResourceModal]);

const renderResourceCard = React.useCallback((resource) => {
  return React.createElement('div', {
    key: resource.id,
    className: 'resource-card',
    style: {
      backgroundColor: THEME.colors.bgSecondary,
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  }, [
    React.createElement('div', {
      className: 'resource-type-badge',
      style: {
        display: 'inline-block',
        backgroundColor: THEME.colors.accentSecondary,
        color: THEME.colors.textPrimary,
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.8rem',
        marginBottom: '0.5rem'
      }
    }, resource.type),
    React.createElement('h3', {
      style: {
        margin: '0 0 0.5rem 0',
        fontFamily: THEME.fonts.title
      }
    }, resource.title),
    React.createElement('p', {
      style: {
        margin: '0 0 1rem 0',
        color: THEME.colors.textSecondary
      }
    }, resource.description),
    React.createElement('div', {
      className: 'resource-tags',
      style: {
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '1rem'
      }
    }, resource.tags.map(tag =>
      React.createElement('span', {
        key: tag,
        style: {
          backgroundColor: THEME.colors.bgPrimary,
          color: THEME.colors.textSecondary,
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.8rem'
        }
      }, tag)
    )),
    React.createElement('div', {
      className: 'resource-actions',
      style: {
        display: 'flex',
        gap: '0.5rem'
      }
    }, [
      React.createElement('button', {
        onClick: () => showResourceDetails(resource.id),
        style: {
          flex: 1,
          padding: '0.5rem',
          backgroundColor: THEME.colors.accentSecondary,
          color: THEME.colors.textPrimary,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Details'),
      resource.url && React.createElement('a', {
        href: resource.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        style: {
          flex: 1,
          padding: '0.5rem',
          backgroundColor: THEME.colors.accentPrimary,
          color: THEME.colors.textPrimary,
          textDecoration: 'none',
          textAlign: 'center',
          borderRadius: '4px'
        }
      }, 'Open')
    ])
  ]);
}, [showResourceDetails]);

// ============= ASSESSMENT TOOLS UI ===============
const renderAssessmentBuilder = React.useCallback(() => {
  const [selectedAssessment, setSelectedAssessment] = React.useState(null);

  return React.createElement('div', {
    className: 'assessment-builder',
    style: {
      padding: '1rem',
      backgroundColor: THEME.colors.bgPrimary,
      borderRadius: '8px'
    }
  }, [
    // Header
    React.createElement('div', {
      className: 'assessment-header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }
    }, [
      React.createElement('h2', {
        style: {
          fontFamily: THEME.fonts.title,
          margin: 0
        }
      }, 'Assessment Builder'),
      React.createElement('button', {
        onClick: () => showNewAssessmentModal(),
        style: {
          backgroundColor: THEME.colors.accentPrimary,
          color: THEME.colors.textPrimary,
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Create New Assessment')
    ]),

    // Assessment List and Editor
    React.createElement('div', {
      className: 'assessment-workspace',
      style: {
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '2rem'
      }
    }, [
      // Assessment List
      React.createElement('div', {
        className: 'assessment-list',
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          padding: '1rem',
          borderRadius: '8px'
        }
      }, [
        React.createElement('h3', {
          style: {
            fontFamily: THEME.fonts.title,
            marginTop: 0
          }
        }, 'My Assessments'),
        React.createElement('div', {
          className: 'assessment-items',
          style: {
            display: 'flex', flexDirection: 'column',
            gap: '0.5rem'
          }
        }, Object.values(assessments).map(assessment =>
          React.createElement('div', {
            key: assessment.id,
            onClick: () => setSelectedAssessment(assessment.id),
            style: {
              padding: '0.75rem',
              backgroundColor: selectedAssessment === assessment.id ?
                THEME.colors.accentSecondary : THEME.colors.bgPrimary,
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, [
            React.createElement('div', {
              style: {
                fontWeight: 'bold',
                marginBottom: '0.25rem'
              }
            }, assessment.title),
            React.createElement('div', {
              style: {
                fontSize: '0.8rem',
                color: THEME.colors.textSecondary
              }
            }, `${assessment.questions.length} questions • ${assessment.totalPoints} points`)
          ])
        ))
      ]),

      // Assessment Editor
      React.createElement('div', {
        className: 'assessment-editor',
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          padding: '1rem',
          borderRadius: '8px'
        }
      }, selectedAssessment ? renderAssessmentEditor(assessments[selectedAssessment]) :
        React.createElement('div', {
          style: {
            textAlign: 'center',
            color: THEME.colors.textSecondary,
            padding: '2rem'
          }
        }, 'Select an assessment to edit or create a new one'))
    ])
  ]);
}, [assessments, selectedAssessment, showNewAssessmentModal]);

const renderAssessmentEditor = React.useCallback((assessment) => {
  return React.createElement('div', {
    className: 'assessment-editor-content'
  }, [
    // Assessment Details
    React.createElement('div', {
      className: 'assessment-details',
      style: {
        marginBottom: '2rem'
      }
    }, [
      React.createElement('input', {
        value: assessment.title,
        onChange: (e) => updateAssessment(assessment.id, { 
          title: sanitizeInput(e.target.value) 
        }),
        style: {
          width: '100%',
          padding: '0.75rem',
          backgroundColor: THEME.colors.bgPrimary,
          color: THEME.colors.textPrimary,
          border: `1px solid ${THEME.colors.borderColor}`,
          borderRadius: '4px',
          marginBottom: '1rem',
          fontSize: '1.2rem',
          fontFamily: THEME.fonts.title
        }
      }),
      React.createElement('textarea', {
        value: assessment.description,
        onChange: (e) => updateAssessment(assessment.id, { 
          description: sanitizeInput(e.target.value) 
        }),
        placeholder: 'Assessment description...',
        style: {
          width: '100%',
          padding: '0.75rem',
          backgroundColor: THEME.colors.bgPrimary,
          color: THEME.colors.textPrimary,
          border: `1px solid ${THEME.colors.borderColor}`,
          borderRadius: '4px',
          minHeight: '100px',
          resize: 'vertical'
        }
      })
    ]),

    // Questions List
    React.createElement('div', {
      className: 'questions-list',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }
    }, [
      ...assessment.questions.map((question, index) => 
        renderQuestionEditor(assessment.id, question, index)
      ),
      React.createElement('button', {
        onClick: () => showAddQuestionModal(assessment.id),
        style: {
          padding: '1rem',
          backgroundColor: THEME.colors.bgPrimary,
          color: THEME.colors.textPrimary,
          border: `2px dashed ${THEME.colors.borderColor}`,
          borderRadius: '4px',
          cursor: 'pointer',
          textAlign: 'center'
        }
      }, '+ Add Question')
    ])
  ]);
}, [updateAssessment, showAddQuestionModal]);

// ============= PROGRESS REPORTING UI ===============
const renderProgressReporting = React.useCallback(() => {
  const [selectedClass, setSelectedClass] = React.useState(null);
  const [dateRange, setDateRange] = React.useState({
    start: new Date(),
    end: new Date()
  });

  return React.createElement('div', {
    className: 'progress-reporting',
    style: {
      padding: '1rem',
      backgroundColor: THEME.colors.bgPrimary,
      borderRadius: '8px'
    }
  }, [
    // Header and Controls
    React.createElement('div', {
      className: 'report-controls',
      style: {
        marginBottom: '2rem'
      }
    }, [
      React.createElement('h2', {
        style: {
          fontFamily: THEME.fonts.title,
          marginBottom: '1rem'
        }
      }, 'Progress Reports'),
      React.createElement('div', {
        style: {
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }
      }, [
        // Class Selection
        React.createElement('select', {
          value: selectedClass || '',
          onChange: (e) => setSelectedClass(e.target.value || null),
          style: {
            padding: '0.5rem',
            backgroundColor: THEME.colors.bgSecondary,
            color: THEME.colors.textPrimary,
            border: `1px solid ${THEME.colors.borderColor}`,
            borderRadius: '4px'
          }
        }, [
          React.createElement('option', { value: '' }, 'Select Class'),
          ...classes.map(cls =>
            React.createElement('option', { key: cls.id, value: cls.id }, 
              cls.name
            )
          )
        ]),
        // Date Range Inputs
        React.createElement('input', {
          type: 'date',
          value: dateRange.start.toISOString().split('T')[0],
          onChange: (e) => setDateRange(prev => ({
            ...prev,
            start: new Date(e.target.value)
          })),
          style: {
            padding: '0.5rem',
            backgroundColor: THEME.colors.bgSecondary,
            color: THEME.colors.textPrimary,
            border: `1px solid ${THEME.colors.borderColor}`,
            borderRadius: '4px'
          }
        }),
        React.createElement('input', {
          type: 'date',
          value: dateRange.end.toISOString().split('T')[0],
          onChange: (e) => setDateRange(prev => ({
            ...prev,
            end: new Date(e.target.value)
          })),
          style: {
            padding: '0.5rem',
            backgroundColor: THEME.colors.bgSecondary,
            color: THEME.colors.textPrimary,
            border: `1px solid ${THEME.colors.borderColor}`,
            borderRadius: '4px'
          }
        }),
        // Generate Report Button
        React.createElement('button', {
          onClick: () => {
            if (selectedClass) {
              const report = generateProgressReport(
                selectedClass, 
                dateRange.start, 
                dateRange.end
              );
              showProgressReport(report);
            }
          },
          disabled: !selectedClass,
          style: {
            backgroundColor: selectedClass ? 
              THEME.colors.accentPrimary : THEME.colors.bgSecondary,
            color: THEME.colors.textPrimary,
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedClass ? 'pointer' : 'not-allowed'
          }
        }, 'Generate Report')
      ])
    ]),

    // Report Preview Area
    selectedClass && React.createElement('div', {
      className: 'report-preview',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '1rem',
        borderRadius: '8px'
      }
    }, renderReportPreview(selectedClass, dateRange))
  ]);
}, [classes, generateProgressReport, showProgressReport]);

// ============= PARENT COMMUNICATION UI ===============
const renderCommunicationCenter = React.useCallback(() => {
  const [selectedTemplate, setSelectedTemplate] = React.useState(null);
  const [selectedStudents, setSelectedStudents] = React.useState([]);

  return React.createElement('div', {
    className: 'communication-center',
    style: {
      padding: '1rem',
      backgroundColor: THEME.colors.bgPrimary,
      borderRadius: '8px'
    }
  }, [
    // Header
    React.createElement('div', {
      className: 'communication-header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }
    }, [
      React.createElement('h2', {
        style: {
          fontFamily: THEME.fonts.title,
          margin: 0
        }
      }, 'Communication Center'),
      React.createElement('button', {
        onClick: () => showNewTemplateModal(),
        style: {
          backgroundColor: THEME.colors.accentPrimary,
          color: THEME.colors.textPrimary,
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Create Template')
    ]),

    // Communication Workspace
    React.createElement('div', {
      className: 'communication-workspace',
      style: {
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '2rem'
      }
    }, [
      // Template List
      React.createElement('div', {
        className: 'template-list',
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          padding: '1rem',
          borderRadius: '8px'
        }
      }, [
        React.createElement('h3', {
          style: {
            fontFamily: THEME.fonts.title,
            marginTop: 0
          }
        }, 'Templates'),
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }
        }, Object.values(communicationTemplates).map(template =>
          React.createElement('div', {
            key: template.id,
            onClick: () => setSelectedTemplate(template.id),
            style: {
              padding: '0.75rem',
              backgroundColor: selectedTemplate === template.id ?
                THEME.colors.accentSecondary : THEME.colors.bgPrimary,
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, [
            React.createElement('div', {
              style: {
                fontWeight: 'bold',
                marginBottom: '0.25rem'
              }
            }, template.title),
            React.createElement('div', {
              style: {
                fontSize: '0.8rem',
                color: THEME.colors.textSecondary
              }
            }, template.type)
          ])
        ))
      ]),

      // Message Composer
      React.createElement('div', {
        className: 'message-composer',
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          padding: '1rem',
          borderRadius: '8px'
        }
      }, selectedTemplate ? 
        renderMessageComposer(selectedTemplate, selectedStudents) :
        React.createElement('div', {
          style: {
            textAlign: 'center',
            color: THEME.colors.textSecondary,
            padding: '2rem'
          }
        }, 'Select a template to begin composing'))
    ])
  ]);
}, [communicationTemplates, selectedTemplate, showNewTemplateModal]);

const renderMessageComposer = React.useCallback((templateId, selectedStudents) => {
  const template = communicationTemplates[templateId];
  if (!template) return null;

  return React.createElement('div', {
    className: 'composer-content'
  }, [
    // Template Preview
    React.createElement('div', {
      className: 'template-preview',
      style: {
        marginBottom: '2rem'
      }
    }, [
      React.createElement('h3', {
        style: {
          fontFamily: THEME.fonts.title,
          marginBottom: '1rem'
        }
      }, 'Template Preview'),
      React.createElement('div', {
        style: {
          backgroundColor: THEME.colors.bgPrimary,
          padding: '1rem',
          borderRadius: '4px'
        }
      }, [
        React.createElement('div', {
          style: {
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }
        }, `Subject: ${template.subject}`),
        React.createElement('div', {
          style: {
            whiteSpace: 'pre-wrap'
          }
        }, template.body)
      ])
    ]),

    // Student Selection
    React.createElement('div', {
      className: 'student-selection',
      style: {
        marginBottom: '2rem'
      }
    }, [
      React.createElement('h3', {
        style: {
          fontFamily: THEME.fonts.title,
          marginBottom: '1rem'
        }
      }, 'Select Recipients'),
      React.createElement('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.5rem'
        }
      }, Object.entries(students).flatMap(([classId, classStudents]) =>
        classStudents.map(student =>
          React.createElement('label', {
            key: student.id,
            style: {
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              backgroundColor: THEME.colors.bgPrimary,
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: selectedStudents.includes(student.id),
              onChange: (e) => {
                if (e.target.checked) {
                  setSelectedStudents(prev => [...prev, student.id]);
                } else {
                  setSelectedStudents(prev => 
                    prev.filter(id => id !== student.id)
                  );
                }
              },
              style: {
                marginRight: '0.5rem'
              }
            }),
            React.createElement('span', null, student.name)
          ])
        )
      ))
    ]),

    // Send Button
    React.createElement('button', {
      onClick: () => {
        selectedStudents.forEach(studentId => {
          const communication = generateCommunication(templateId, studentId);
          if (communication) {
            sendCommunication(communication);
          }

                                 });
      },
      disabled: selectedStudents.length === 0,
      style: {
        backgroundColor: selectedStudents.length > 0 ? 
          THEME.colors.accentPrimary : THEME.colors.bgSecondary,
        color: THEME.colors.textPrimary,
        padding: '0.75rem',
        width: '100%',
        border: 'none',
        borderRadius: '4px',
        cursor: selectedStudents.length > 0 ? 'pointer' : 'not-allowed'
      }
    }, `Send to ${selectedStudents.length} recipient${selectedStudents.length === 1 ? '' : 's'}`)
  ]);
}, [communicationTemplates, students, generateCommunication, sendCommunication]);

// ============= MODAL COMPONENTS ===============
const renderModal = React.useCallback((content, onClose) => {
  return React.createElement('div', {
    className: 'modal-overlay',
    onClick: onClose,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }
  }, React.createElement('div', {
    className: 'modal-content',
    onClick: e => e.stopPropagation(),
    style: {
      backgroundColor: THEME.colors.bgSecondary,
      padding: '2rem',
      borderRadius: '8px',
      maxWidth: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative'
    }
  }, [
    React.createElement('button', {
      onClick: onClose,
      style: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        backgroundColor: 'transparent',
        border: 'none',
        color: THEME.colors.textSecondary,
        fontSize: '1.5rem',
        cursor: 'pointer'
      }
    }, '×'),
    content
  ]));
}, []);

// ============= MAIN APP RENDERING ===============
const renderMainContent = React.useCallback(() => {
  switch (view) {
    case 'calendar':
      return calendarView === 'month' ? 
        renderCalendarGrid() : renderWeekView();
    case 'units':
      return renderUnitPlanner();
    case 'standards':
      return renderStandardsLibrary();
    case 'resources':
      return renderResourceLibrary();
    case 'assessments':
      return renderAssessmentBuilder();
    case 'progress':
      return renderProgressReporting();
    case 'communication':
      return renderCommunicationCenter();
    default:
      return null;
  }
}, [view, calendarView, renderCalendarGrid, renderWeekView, renderUnitPlanner,
    renderStandardsLibrary, renderResourceLibrary, renderAssessmentBuilder,
    renderProgressReporting, renderCommunicationCenter]);

// Updated navigation to include all features
const renderNavigation = React.useCallback(() => {
  const navItems = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'units', label: 'Units' },
    { id: 'standards', label: 'Standards' },
    { id: 'resources', label: 'Resources' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'progress', label: 'Progress' },
    { id: 'communication', label: 'Communication' }
  ];

  return React.createElement('nav', {
    className: 'main-navigation',
    style: {
      backgroundColor: THEME.colors.bgSecondary,
      padding: '1rem',
      borderBottom: `1px solid ${THEME.colors.borderColor}`
    }
  }, [
    React.createElement('div', {
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
    ))
  ]);
}, [view]);

// Final return statement for the TeacherPlanner component
return React.createElement('div', {
  className: 'teacher-planner',
  style: {
    minHeight: '100vh',
    backgroundColor: THEME.colors.bgPrimary,
    color: THEME.colors.textPrimary
  }
}, [
  renderHeader(),
  renderNavigation(),
  React.createElement('main', {
    style: {
      padding: '2rem'
    }
  }, [
    renderMainContent(),
    error && React.createElement(ErrorMessage),
    loading && React.createElement(LoadingSpinner)
  ])
]);
};

// Firebase configuration placeholder
const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  CALENDAR: 'calendar',
  UNITS: 'units',
  CLASSES: 'classes',
  STUDENTS: 'students',
  STANDARDS: 'standards',
  RESOURCES: 'resources',
  ASSESSMENTS: 'assessments',
  TEMPLATES: 'templates',
  CONNECTIONS: 'connections'
};

// Prepare data structure for Firebase
const prepareDataForFirebase = (data, userId) => {
  const timestamp = new Date().toISOString();
  return {
    ...data,
    userId,
    createdAt: data.createdAt || timestamp,
    updatedAt: timestamp
  };
};

// Future Firebase operations (commented out for now)
/*
const firebaseOperations = {
  saveToFirestore: async (collection, data, id = null) => {
    const db = firebase.firestore();
    const userId = firebase.auth().currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const preparedData = prepareDataForFirebase(data, userId);
    
    if (id) {
      await db.collection(collection).doc(id).set(preparedData);
      return id;
    } else {
      const doc = await db.collection(collection).add(preparedData);
      return doc.id;
    }
  },

  loadFromFirestore: async (collection, query = null) => {
    const db = firebase.firestore();
    const userId = firebase.auth().currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    let ref = db.collection(collection).where('userId', '==', userId);
    if (query) {
      Object.entries(query).forEach(([field, value]) => {
        ref = ref.where(field, '==', value);
      });
    }

    const snapshot = await ref.get();
    return Object.fromEntries(
      snapshot.docs.map(doc => [doc.id, doc.data()])
    );
  }
};
*/

// Add Firestore security rules template (to be implemented later)
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Base rule for all collections
    match /{collection}/{document} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
  }
}
*/

// Add Storage security rules template (to be implemented later)
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                   request.auth.uid == userId && 
                   request.resource.size < 5 * 1024 * 1024 && // 5MB max
                   request.resource.contentType.matches('application/.*|image/.*|text/.*');
    }
  }
}
*/

// Export the component
window.TeacherPlanner = TeacherPlanner;
