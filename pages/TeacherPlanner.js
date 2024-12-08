import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0';

const TeacherPlanner = () => {
  const [students, setStudents] = useState([]);
  const [className, setClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  useEffect(() => {
    const savedStudents = localStorage.getItem('plannerStudents');
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('plannerStudents', JSON.stringify(students));
  }, [students]);

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (newStudentName.trim()) {
      setStudents([...students, { 
        id: Date.now(), 
        name: newStudentName,
        present: false,
        notes: ''
      }]);
      setNewStudentName('');
    }
  };

  const toggleAttendance = (studentId) => {
    setStudents(students.map(student => 
      student.id === studentId 
        ? {...student, present: !student.present}
        : student
    ));
  };

  const updateNotes = (studentId, notes) => {
    setStudents(students.map(student =>
      student.id === studentId
        ? {...student, notes: notes}
        : student
    ));
  };

  const removeStudent = (studentId) => {
    setStudents(students.filter(student => student.id !== studentId));
  };

  return React.createElement('div', { style: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  }},
    React.createElement('div', { style: {
      marginBottom: '20px',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '5px'
    }},
      React.createElement('form', { onSubmit: handleAddStudent },
        React.createElement('input', {
          type: 'text',
          value: newStudentName,
          onChange: (e) => setNewStudentName(e.target.value),
          placeholder: 'Enter student name',
          style: {
            padding: '8px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }
        }),
        React.createElement('button', {
          type: 'submit',
          style: {
            padding: '8px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Add Student')
      )
    ),
    React.createElement('div', null,
      students.map(student => 
        React.createElement('div', {
          key: student.id,
          style: {
            marginBottom: '10px',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }
        },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center' } },
            React.createElement('input', {
              type: 'checkbox',
              checked: student.present,
              onChange: () => toggleAttendance(student.id),
              style: { marginRight: '10px' }
            }),
            React.createElement('span', {
              style: {
                textDecoration: student.present ? 'none' : 'none',
                marginRight: '15px'
              }
            }, student.name)
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center' } },
            React.createElement('input', {
              type: 'text',
              value: student.notes,
              onChange: (e) => updateNotes(student.id, e.target.value),
              placeholder: 'Add notes',
              style: {
                marginRight: '10px',
                padding: '5px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }
            }),
            React.createElement('button', {
              onClick: () => removeStudent(student.id),
              style: {
                padding: '5px 10px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            }, 'Remove')
          )
        )
      )
    )
  );
};

// Initialize function that will be called after login
window.initializePlanner = function(rootId) {
  const root = ReactDOM.createRoot(document.getElementById(rootId));
  root.render(React.createElement(TeacherPlanner));
};
