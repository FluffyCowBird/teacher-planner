const React = window.React;
const ReactDOM = window.ReactDOM;

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
  // State Management using React hooks
  const [view, setView] = React.useState('calendar');
  const [calendar, setCalendar] = React.useState({});
  const [units, setUnits] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [currentUnit, setCurrentUnit] = React.useState(null);
  const [currentClass, setCurrentClass] = React.useState(null);
  const [templates, setTemplates] = React.useState({});
  const [lessonPlans, setLessonPlans] = React.useState({});
  const [assessments, setAssessments] = React.useState({});
  const [settings, setSettings] = React.useState({
    schoolYear: {
      start: null,
      end: null
    },
    terms: [],
    defaultDayType: DAY_TYPES.ODD
  });

  // Initial Data Load
  React.useEffect(() => {
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
      }
    };
    loadData();
  }, []);

  // Auto-save data changes
  React.useEffect(() => {
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
      }
    };

    const debounceTimer = setTimeout(saveData, 1000);
    return () => clearTimeout(debounceTimer);
  }, [calendar, units, classes, templates, lessonPlans, assessments, settings]);

  // Calendar Logic
  const calculateDayType = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (calendar[dateStr]) return calendar[dateStr];
    
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

  const updateDayType = (date, type) => {
    const dateStr = date.toISOString().split('T')[0];
    setCalendar(prev => ({
      ...prev,
      [dateStr]: type
    }));
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

  // Lesson Management
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

  const renderCalendar = () => {
    const today = new Date(selectedDate);
    const month = today.getMonth();
    const year = today.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Calendar Header
    const header = React.createElement('div', { className: 'calendar-header' },
      React.createElement('button', { 
        onClick: () => setSelectedDate(new Date(year, month - 1))
      }, '←'),
      React.createElement('h2', null, 
        new Date(year, month).toLocaleDateString('default', { month: 'long', year: 'numeric' })
      ),
      React.createElement('button', {
        onClick: () => setSelectedDate(new Date(year, month + 1))
      }, '→')
    );

    // Day Names
    const dayLabels = React.createElement('div', { className: 'day-names' },
      dayNames.map(name => 
        React.createElement('div', { key: name, className: 'day-name' }, name)
      )
    );

    // Calendar Grid
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(React.createElement('div', { 
        key: `empty-${i}`, 
        className: 'calendar-day empty' 
      }));
    }

    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayType = calendar[dateStr] || calculateDayType(date);
      const isSelected = dateStr === selectedDate.toISOString().split('T')[0];
      
      days.push(
        React.createElement('div', {
          key: dateStr,
          className: `calendar-day ${isSelected ? 'selected' : ''} ${dayType}`,
          onClick: () => setSelectedDate(new Date(date))
        },
          React.createElement('div', { className: 'date-number' }, date.getDate()),
          React.createElement('div', { className: 'day-type' }, dayType)
        )
      );
    }

    return React.createElement('div', { className: 'calendar-container' },
      header,
      React.createElement('div', { className: 'calendar-grid' },
        dayLabels,
        React.createElement('div', { className: 'days-grid' }, days)
      )
    );
  };

  // Main Render
  return React.createElement('div', { className: 'teacher-planner' },
    React.createElement('nav', { className: 'planner-nav' },
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
    ),
    React.createElement('main', { className: 'planner-content' },
      view === 'calendar' ? renderCalendar() :
      view === 'units' ? renderUnitPlanner() :
      view === 'classes' ? renderClassManager() :
      null
    )
  );
};

// Initialize function
window.initializePlanner = function(rootId) {
  const root = ReactDOM.createRoot(document.getElementById(rootId));
  root.render(React.createElement(TeacherPlanner));
};
