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

// getMonday function
function getMonday(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

// addDays function 
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const TeacherPlanner = () => {
  // ============= STATE MANAGEMENT ===============
  const [view, setView] = React.useState('calendar');
  const [calendarView, setCalendarView] = React.useState('month');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [calendar, setCalendar] = React.useState({});
  const [units, setUnits] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [students, setStudents] = React.useState({});
  const [currentUnit, setCurrentUnit] = React.useState(null);
  const [lessonTemplates, setLessonTemplates] = React.useState([]);
  const [filters, setFilters] = React.useState({
    gradeLevel: null,
    dayType: null,
    period: null
  });

  // ============= LIFECYCLE HOOKS ===============
  
  // Load data from local storage on mount
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

  // Save data to local storage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('teacherPlannerData', JSON.stringify({
      calendar,
      units,
      classes,
      students,
      lessonTemplates
    }));
  }, [calendar, units, classes, students, lessonTemplates]);

  // Initialize calendar sequence on mount
  React.useEffect(() => {
    const today = new Date();
    initializeCalendarSequence(today, DAY_TYPES.ODD);
  }, []);
  
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
  
  // showDayDetails function
  const showDayDetails = (dateStr) => {
    console.log(`Showing details for ${dateStr}`);
    // TODO: Implement day details view
  };
  
  // ============= CLASS MANAGEMENT ===============
  const addClass = (classData) => {
    try {
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
    } catch (err) {
      console.error('Error adding class:', err);
    }
  };
  
  const addStudent = (classId, studentData) => {
    try {
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
    } catch (err) {
      console.error('Error adding student:', err);
    }
  };

  const importStudents = async (file, classId) => {
    try {
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
    } catch (err) {
      console.error('Error importing students:', err);
      // Handle the error, show user feedback
    }
  };

  // updateClass function
  const updateClass = (classId, updates) => {
    setClasses(prevClasses => prevClasses.map(cls =>
      cls.id === classId ? { ...cls, ...updates } : cls
    ));
  };

  // ============= UNIT MANAGEMENT ===============
  const addUnit = (unitData) => {
    try {
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
    } catch (err) {
      console.error('Error adding unit:', err);
    }
  };
  
  const addLessonTemplate = (templateData) => {
    try {
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
    } catch (err) {
      console.error('Error adding lesson template:', err);
    }
  };

  // updateUnit function
  const updateUnit = (unitId, updates) => {
    setUnits(prevUnits => prevUnits.map(unit => 
      unit.id === unitId ? { ...unit, ...updates } : unit  
    ));
  };
   
  // ============= RENDER FUNCTIONS ===============
  const renderWeekView = () => {
    const monday = getMonday(selectedDate);
    
    return (
      <div className="week-view">
        <div className="week-header">
          {WEEKDAYS.map(day => <div key={day} className="day-header">{day}</div>)}
        </div>
        <div className="week-grid">
          {PERIODS.map(period => 
            <div key={period} className="period-row">
              {WEEKDAYS.map(day => {
                const date = addDays(monday, WEEKDAYS.indexOf(day));
                const dayType = calendar[date.toISOString().split('T')[0]]?.type;
                const classesForPeriod = classes
                  .filter(c => c.period === period && c.dayType === dayType)
                  .sort((a, b) => a.room.localeCompare(b.room));
                
                return (
                  <div key={day} className={`period-cell ${dayType || ''}`}>
                    {classesForPeriod.map(cls => 
                      <div key={cls.id} className="class-block">
                        {cls.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const header = (
      <div className="month-header">
        <button 
          onClick={() => setSelectedDate(new Date(year, month - 1))}
        >
          ←
        </button>
        <h2>
          {selectedDate.toLocaleString('default', { month: 'long' })} {year}
        </h2>
        <button
          onClick={() => setSelectedDate(new Date(year, month + 1))}
        >
          →
        </button>
        <button
          onClick={() => setCalendarView(calendarView === 'month' ? 'week' : 'month')}
          className="view-toggle"
        >
          {calendarView === 'month' ? 'Switch to Week' : 'Switch to Month'}
        </button>
      </div>
    );

    WEEKDAYS.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="calendar-header">
          {day}
        </div>
      );
    });

        let startDayIndex = firstDay.getDay();
    if (startDayIndex === 0) startDayIndex = 7;  // Sunday becomes 7 
    startDayIndex--;  // Adjust for Monday start
    for (let i = 0; i < startDayIndex; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day empty"></div>
      );
    }

    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      if (date.getDay() === 0 || date.getDay() === 6) continue;  // Skip weekends
      
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendar[dateStr] || { type: 'odd', state: 'school' };
      const classesForDay = classes.filter(c => c.dayType === dayData.type);
      
      days.push(
        <div
          key={dateStr}
          className={`calendar-day ${dayData.type} ${dayData.state}`}
          onClick={() => {
            setSelectedDate(new Date(date));
            showDayDetails(dateStr);  
          }}
        >
          <div className="date-number">{date.getDate()}</div>
          <div className="day-type">{dayData.type}</div>
          <div className="day-classes">
            {classesForDay.map(cls => 
              <div key={cls.id} className="day-class-item">
                P{cls.period}: {cls.name}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-container">
        {header}
        <div className="calendar-grid">{days}</div>
      </div>
    );
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

    return (
      <div className="units-view">
        <div className="units-controls">
          <button onClick={() => addUnit({ gradeLevel: filters.gradeLevel })}>
            Add Unit
          </button>
          <select
            value={filters.gradeLevel || ''}
            onChange={(e) => setFilters({ ...filters, gradeLevel: e.target.value || null })}
          >
            <option value="">All Grades</option>
            {GRADE_LEVELS.map(grade => 
              <option key={grade} value={grade}>Grade {grade}</option>
            )}
          </select>
        </div>
        {Object.entries(groupedUnits).map(([grade, gradeUnits]) => (
          <div key={grade} className="grade-units">
            <h3>Grade {grade}</h3>
            <div className="units-grid">
              {gradeUnits.map(unit => (
                <div key={unit.id} className="unit-card">
                  <input
                    value={unit.title}
                    onChange={(e) => updateUnit(unit.id, { title: e.target.value })}
                    className="unit-title"
                  />
                  <div className="unit-dates">
                    <input
                      type="date"
                      value={unit.startDate}
                      onChange={(e) => updateUnit(unit.id, { startDate: e.target.value })}
                    />
                    <input
                      type="date"
                      value={unit.endDate}
                      onChange={(e) => updateUnit(unit.id, { endDate: e.target.value })}
                    />
                  </div>
                  <textarea
                    value={unit.description}
                    onChange={(e) => updateUnit(unit.id, { description: e.target.value })} 
                    placeholder="Unit description..."
                  ></textarea>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderClassesView = () => {
    const groupedClasses = {
      odd: classes.filter(c => c.dayType === 'odd'),
      even: classes.filter(c => c.dayType === 'even')
    };

    return (
      <div className="classes-view">
        <div className="class-controls">
          <button onClick={() => addClass({})}>Add Class</button>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => importStudents(e.target.files[0])}
          />
        </div>
        <div className="classes-grid">
          <div className="day-classes">
            <h3>Odd Day Classes</h3>
            {groupedClasses.odd.map(cls => renderClassCard(cls))}
          </div>
          <div className="day-classes">
            <h3>Even Day Classes</h3>
            {groupedClasses.even.map(cls => renderClassCard(cls))}
          </div>
        </div>
      </div>
    );
  };

  const renderClassCard = (cls) => {
    const classStudents = students[cls.id] || [];
    
    return (
      <div key={cls.id} className="class-card">
        <div className="class-header">  
          <input
            value={cls.name}
            onChange={(e) => updateClass(cls.id, { name: e.target.value })}
            className="class-name"
          />
          <div className="class-meta">
            {`Period ${cls.period} • Grade ${cls.gradeLevel}${cls.room ? ` • Room ${cls.room}` : ''}`}
          </div>
        </div>
        <div className="class-students">
          {classStudents.map(student => (
            <div key={student.id} className="student-row">
              <span>{student.name}</span>
              <div className="student-status">
                {student.status.map((status, i) => 
                  <span key={i} title={status.label}>{status.icon}</span>
                )}
              </div>
            </div>
          ))}
          <button 
            onClick={() => addStudent(cls.id, {})}
            className="add-student"
          >
            Add Student
          </button>
        </div>
      </div>  
    );
  };
  
  // ============= MAIN RENDER ===============
  return (
    <div className="teacher-planner">
      <nav className="planner-nav">
        <button
          onClick={() => setView('calendar')}
          className={view === 'calendar' ? 'active' : ''}
        >
          Calendar
        </button>
        <button
          onClick={() => setView('units')}
          className={view === 'units' ? 'active' : ''}
        >
          Units
        </button>
        <button
          onClick={() => setView('classes')}
          className={view === 'classes' ? 'active' : ''}
        >
          Classes
        </button>
      </nav>
      <main className="planner-content">
        {view === 'calendar' ? (
          calendarView === 'week' ? renderWeekView() : renderMonthView()
        ) : view === 'units' ? (
          renderUnitsView()  
        ) : (
          renderClassesView()
        )}
      </main>
      <style>{`
       .teacher-planner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: trebuchet, sans-serif;
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
    `}</style>
    </div>
  );
};

// ============= INITIALIZATION ===============  
window.initializePlanner = function(rootId) {
  const root = ReactDOM.createRoot(document.getElementById(rootId));
  root.render(<TeacherPlanner />);
};
