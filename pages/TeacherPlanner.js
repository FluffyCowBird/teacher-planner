import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0';

const DAY_TYPES = {
 ODD: 'odd',
 EVEN: 'even',
 WORKSHOP: 'workshop',
 ASSEMBLY: 'assembly',
 SNOW: 'snow',
 HOLIDAY: 'holiday'
};

const GRADE_LEVELS = [6, 7, 8];

const TeacherPlanner = () => {
 const [view, setView] = useState('calendar');
 const [calendar, setCalendar] = useState({});
 const [units, setUnits] = useState([]);
 const [classes, setClasses] = useState([]);
 const [selectedDate, setSelectedDate] = useState(new Date());
 const [currentUnit, setCurrentUnit] = useState(null);
 const [templates, setTemplates] = useState({});
 const [students, setStudents] = useState([]);

 // Load saved data
 useEffect(() => {
   const savedData = localStorage.getItem('teacherPlannerData');
   if (savedData) {
     const parsed = JSON.parse(savedData);
     setCalendar(parsed.calendar || {});
     setUnits(parsed.units || []);
     setClasses(parsed.classes || []);
     setTemplates(parsed.templates || {});
     setStudents(parsed.students || []);
   }
 }, []);

 // Save data
 useEffect(() => {
   localStorage.setItem('teacherPlannerData', JSON.stringify({
     calendar,
     units,
     classes,
     templates,
     students
   }));
 }, [calendar, units, classes, templates, students]);

 const calculateDayType = (date) => {
   const dateStr = date.toISOString().split('T')[0];
   if (calendar[dateStr]) return calendar[dateStr];

   // Find the most recent known day type before this date
   const knownDates = Object.keys(calendar).sort();
   let lastKnownType = null;
   let skipCount = 0;

   for (const knownDate of knownDates) {
     if (knownDate >= dateStr) break;
     
     const type = calendar[knownDate];
     if (type === DAY_TYPES.ODD || type === DAY_TYPES.EVEN) {
       lastKnownType = type;
     } else {
       skipCount++;
     }
   }

   if (!lastKnownType) return DAY_TYPES.ODD; // Default start

   // Calculate new type accounting for skipped days
   const daysAfterLast = Math.floor((date - new Date(knownDates[knownDates.length-1])) / (1000 * 60 * 60 * 24));
   const effectiveDays = daysAfterLast - skipCount;
   
   return effectiveDays % 2 === 0 ? lastKnownType : 
     (lastKnownType === DAY_TYPES.ODD ? DAY_TYPES.EVEN : DAY_TYPES.ODD);
 };

 const updateCalendarDay = (date, type) => {
   const dateStr = date.toISOString().split('T')[0];
   setCalendar(prev => ({
     ...prev,
     [dateStr]: type
   }));
 };

 const addUnit = (unit) => {
   setUnits(prev => [...prev, {
     id: Date.now(),
     title: unit.title,
     description: unit.description,
     gradeLevel: unit.gradeLevel,
     lessons: [],
     standards: unit.standards || [],
     assessments: [],
     startDate: unit.startDate,
     endDate: unit.endDate
   }]);
 };

 const addLesson = (unitId, lesson) => {
   setUnits(prev => prev.map(unit => {
     if (unit.id === unitId) {
       return {
         ...unit,
         lessons: [...unit.lessons, {
           id: Date.now(),
           title: lesson.title,
           description: lesson.description,
           objectives: lesson.objectives,
           materials: lesson.materials,
           procedure: lesson.procedure,
           assessment: lesson.assessment,
           homework: lesson.homework,
           date: lesson.date,
           dayType: lesson.dayType
         }]
       };
     }
     return unit;
   }));
 };

 const addClass = (classData) => {
   setClasses(prev => [...prev, {
     id: Date.now(),
     name: classData.name,
     gradeLevel: classData.gradeLevel,
     period: classData.period,
     dayType: classData.dayType,
     students: []
   }]);
 };

 const addStudent = (classId, studentData) => {
   setClasses(prev => prev.map(cls => {
     if (cls.id === classId) {
       return {
         ...cls,
         students: [...cls.students, {
           id: Date.now(),
           name: studentData.name,
           grades: {},
           attendance: {},
           notes: "",
           status: []
         }]
       };
     }
     return cls;
   }));
 };

 const updateStudentAttendance = (classId, studentId, date, status) => {
   setClasses(prev => prev.map(cls => {
     if (cls.id === classId) {
       return {
         ...cls,
         students: cls.students.map(student => {
           if (student.id === studentId) {
             return {
               ...student,
               attendance: {
                 ...student.attendance,
                 [date]: status
               }
             };
           }
           return student;
         })
       };
     }
     return cls;
   }));
 };

 const addTemplate = (template) => {
   setTemplates(prev => ({
     ...prev,
     [template.gradeLevel]: {
       ...prev[template.gradeLevel],
       [template.title]: template
     }
   }));
 };

 const renderCalendar = () => {
   const today = new Date();
   const month = today.getMonth();
   const year = today.getFullYear();
   const firstDay = new Date(year, month, 1);
   const lastDay = new Date(year, month + 1, 0);
   const days = [];

   for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
     const dateStr = date.toISOString().split('T')[0];
     const dayType = calendar[dateStr] || calculateDayType(date);
     
     days.push(
       <div key={dateStr} className="calendar-day" onClick={() => setSelectedDate(new Date(date))}>
         <div>{date.getDate()}</div>
         <div>{dayType}</div>
       </div>
     );
   }

   return (
     <div className="calendar-grid">
       {days}
     </div>
   );
 };

 const renderUnitPlanner = () => {
   return (
     <div className="unit-planner">
       <h2>Unit Planning</h2>
       {currentUnit ? (
         <div className="unit-editor">
           <input 
             value={currentUnit.title}
             onChange={e => setCurrentUnit({...currentUnit, title: e.target.value})}
             placeholder="Unit Title"
           />
           <textarea
             value={currentUnit.description}
             onChange={e => setCurrentUnit({...currentUnit, description: e.target.value})}
             placeholder="Unit Description"
           />
           <div className="lessons-list">
             {currentUnit.lessons.map(lesson => (
               <div key={lesson.id} className="lesson-item">
                 {lesson.title}
               </div>
             ))}
             <button onClick={() => addLesson(currentUnit.id, {
               title: "New Lesson",
               description: "",
               objectives: [],
               materials: [],
               procedure: [],
               assessment: "",
               homework: ""
             })}>Add Lesson</button>
           </div>
         </div>
       ) : (
         <div className="units-list">
           {units.map(unit => (
             <div key={unit.id} onClick={() => setCurrentUnit(unit)}>
               {unit.title}
             </div>
           ))}
           <button onClick={() => setCurrentUnit({
             title: "New Unit",
             description: "",
             lessons: [],
             standards: []
           })}>Create New Unit</button>
         </div>
       )}
     </div>
   );
 };

 const renderClassManager = () => {
   return (
     <div className="class-manager">
       <h2>Class Management</h2>
       <div className="classes-list">
         {classes.map(cls => (
           <div key={cls.id} className="class-item">
             <h3>{cls.name}</h3>
             <div className="students-list">
               {cls.students.map(student => (
                 <div key={student.id} className="student-item">
                   {student.name}
                   <input
                     type="text"
                     value={student.notes}
                     onChange={e => updateStudentNotes(cls.id, student.id, e.target.value)}
                     placeholder="Add notes"
                   />
                 </div>
               ))}
               <button onClick={() => addStudent(cls.id, {name: ""})}>
                 Add Student
               </button>
             </div>
           </div>
         ))}
         <button onClick={() => addClass({
           name: "New Class",
           gradeLevel: 6,
           period: 1,
           dayType: DAY_TYPES.ODD
         })}>Add Class</button>
       </div>
     </div>
   );
 };

 return (
   <div className="teacher-planner">
     <nav className="planner-nav">
       <button onClick={() => setView('calendar')}>Calendar</button>
       <button onClick={() => setView('units')}>Units</button>
       <button onClick={() => setView('classes')}>Classes</button>
     </nav>
     
     <main className="planner-content">
       {view === 'calendar' && renderCalendar()}
       {view === 'units' && renderUnitPlanner()}
       {view === 'classes' && renderClassManager()}
     </main>

     <style jsx>{`
       .teacher-planner {
         max-width: 1200px;
         margin: 0 auto;
         padding: 20px;
       }

       .planner-nav {
         margin-bottom: 20px;
         padding: 10px;
         background: #f5f5f5;
       }

       .calendar-grid {
         display: grid;
         grid-template-columns: repeat(7, 1fr);
         gap: 10px;
       }

       .calendar-day {
         padding: 10px;
         border: 1px solid #ddd;
         cursor: pointer;
       }

       .unit-planner,
       .class-manager {
         padding: 20px;
       }

       .class-item,
       .unit-editor {
         margin-bottom: 20px;
         padding: 15px;
         border: 1px solid #ddd;
         border-radius: 4px;
       }

       button {
         padding: 8px 16px;
         margin: 5px;
         background: #007bff;
         color: white;
         border: none;
         border-radius: 4px;
         cursor: pointer;
       }

       button:hover {
         background: #0056b3;
       }

       input,
       textarea {
         width: 100%;
         padding: 8px;
         margin-bottom: 10px;
         border: 1px solid #ddd;
         border-radius: 4px;
       }
     `}</style>
   </div>
 );
};

window.initializePlanner = function(rootId) {
 const root = ReactDOM.createRoot(document.getElementById(rootId));
 root.render(React.createElement(TeacherPlanner));
};
