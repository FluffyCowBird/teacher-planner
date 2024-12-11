'use strict';

(() => {
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

  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
  const GRADE_LEVELS = [6, 7, 8];

  // Utility Functions
  const validateDate = (date) => {
    return date instanceof Date && !isNaN(date) && date > new Date(1900, 0, 1);
  };

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>{}]/g, '');
  };

  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
const ClassForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    period: 1,
    gradeLevel: GRADE_LEVELS[0],
    room: '',
    dayType: DAY_TYPES.ODD
  });

  return React.createElement('form', {
    onSubmit: (e) => {
      e.preventDefault();
      onSubmit(formData);
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      padding: '20px',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '8px'
    }
  }, [
    // Class Name
    React.createElement('div', {
      key: 'name-group',
      className: 'form-group'
    }, [
      React.createElement('label', { 
        key: 'name-label',
        htmlFor: 'className'
      }, 'Class Name'),
      React.createElement('input', {
        key: 'name-input',
        id: 'className',
        type: 'text',
        value: formData.name,
        onChange: (e) => setFormData(prev => ({
          ...prev,
          name: e.target.value
        })),
        required: true,
        style: {
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)'
        }
      })
    ]),

    // Period
    React.createElement('div', {
      key: 'period-group',
      className: 'form-group'
    }, [
      React.createElement('label', {
        key: 'period-label',
        htmlFor: 'period'
      }, 'Period'),
      React.createElement('select', {
        key: 'period-select',
        id: 'period',
        value: formData.period,
        onChange: (e) => setFormData(prev => ({
          ...prev,
          period: parseInt(e.target.value)
        })),
        style: {
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)'
        }
      }, PERIODS.map(period => 
        React.createElement('option', {
          key: period,
          value: period
        }, `Period ${period}`)
      ))
    ]),

    // Grade Level
    React.createElement('div', {
      key: 'grade-group',
      className: 'form-group'
    }, [
      React.createElement('label', {
        key: 'grade-label',
        htmlFor: 'gradeLevel'
      }, 'Grade Level'),
      React.createElement('select', {
        key: 'grade-select',
        id: 'gradeLevel',
        value: formData.gradeLevel,
        onChange: (e) => setFormData(prev => ({
          ...prev,
          gradeLevel: parseInt(e.target.value)
        })),
        style: {
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)'
        }
      }, GRADE_LEVELS.map(grade => 
        React.createElement('option', {
          key: grade,
          value: grade
        }, `Grade ${grade}`)
      ))
    ]),

    // Room
    React.createElement('div', {
      key: 'room-group',
      className: 'form-group'
    }, [
      React.createElement('label', {
        key: 'room-label',
        htmlFor: 'room'
      }, 'Room'),
      React.createElement('input', {
        key: 'room-input',
        id: 'room',
        type: 'text',
        value: formData.room,
        onChange: (e) => setFormData(prev => ({
          ...prev,
          room: e.target.value
        })),
        style: {
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)'
        }
      })
    ]),

    // Day Type
    React.createElement('div', {
      key: 'day-type-group',
      className: 'form-group'
    }, [
      React.createElement('label', {
        key: 'day-type-label',
        htmlFor: 'dayType'
      }, 'Day Type'),
      React.createElement('select', {
        key: 'day-type-select',
        id: 'dayType',
        value: formData.dayType,
        onChange: (e) => setFormData(prev => ({
          ...prev,
          dayType: e.target.value
        })),
        style: {
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)'
        }
      }, Object.entries(DAY_TYPES).map(([key, value]) => 
        React.createElement('option', {
          key,
          value
        }, key)
      ))
    ]),

    // Form Buttons
    React.createElement('div', {
      key: 'button-group',
      style: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
        marginTop: '10px'
      }
    }, [
      React.createElement('button', {
        key: 'cancel',
        type: 'button',
        onClick: onCancel,
        style: {
          padding: '8px 16px',
          backgroundColor: 'var(--bg-primary)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Cancel'),
      React.createElement('button', {
        key: 'submit',
        type: 'submit',
        style: {
          padding: '8px 16px',
          backgroundColor: 'var(--accent-primary)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Add Class')
    ])
  ]);
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
    const [classes, setClasses] = React.useState([]);
    const [students, setStudents] = React.useState({});
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    // Class Management
    const addClass = React.useCallback((classData) => {
      const newClass = {
        id: `class_${Date.now()}`,
        name: sanitizeInput(classData.name || 'New Class'),
        period: classData.period || 1,
        gradeLevel: classData.gradeLevel || GRADE_LEVELS[0],
        room: sanitizeInput(classData.room || ''),
        dayType: classData.dayType || DAY_TYPES.ODD,
        createdAt: new Date().toISOString()
      };

      setClasses(prev => [...prev, newClass]);
      setStudents(prev => ({
        ...prev,
        [newClass.id]: []
      }));

      return newClass.id;
    }, []);

    // Student Management
    const addStudent = React.useCallback((classId, studentData) => {
      const newStudent = {
        id: `student_${Date.now()}`,
        name: sanitizeInput(studentData.name || 'New Student'),
        email: sanitizeInput(studentData.email || ''),
        guardianEmail: sanitizeInput(studentData.guardianEmail || ''),
        status: [],
        attendance: {},
        createdAt: new Date().toISOString()
      };

      setStudents(prev => ({
        ...prev,
        [classId]: [...(prev[classId] || []), newStudent]
      }));

      return newStudent.id;
    }, []);

    // Initialize calendar
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
        let isOdd = true;
        
        while (currentDate <= endDate) {
          if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            const dateStr = currentDate.toISOString().split('T')[0];
            newCalendar[dateStr] = {
              type: isOdd ? DAY_TYPES.ODD : DAY_TYPES.EVEN,
              state: 'school',
              notes: '',
              lastModified: new Date().toISOString()
            };
            isOdd = !isOdd;
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

    // Day type selector modal
    const showDayTypeSelector = (date) => {
  // Remove any existing modal
  const existingModal = document.getElementById('modal-root');
  if (existingModal) {
    const root = ReactDOM.createRoot(existingModal);
    root.unmount();
    existingModal.remove();
  }

  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root';
  document.body.appendChild(modalRoot);

  const dateStr = date.toISOString().split('T')[0];
  const currentType = calendar[dateStr]?.type || DAY_TYPES.ODD;

  const handleDayTypeChange = (newType) => {
    const dateStr = date.toISOString().split('T')[0];
    setCalendar(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || {}),
        type: newType,
        lastModified: new Date().toISOString()
      }
    }));
    const root = ReactDOM.createRoot(modalRoot);
    root.unmount();
    modalRoot.remove();
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest('.day-type-selector')) {
      const root = ReactDOM.createRoot(modalRoot);
      root.unmount();
      modalRoot.remove();
      document.removeEventListener('click', handleClickOutside);
    }
  };

  const root = ReactDOM.createRoot(modalRoot);
  root.render(React.createElement('div', {
    className: 'day-type-selector modal-overlay',
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }
  }, React.createElement('div', {
    className: 'modal-content',
    style: {
      backgroundColor: 'var(--bg-secondary)',
      padding: '20px',
      borderRadius: '8px',
      minWidth: '300px'
    }
  }, [
    React.createElement('h3', {
      key: 'title',
      style: { marginBottom: '15px' }
    }, 'Select Day Type'),
    ...Object.entries(DAY_TYPES).map(([key, value]) =>
      React.createElement('button', {
        key,
        onClick: () => handleDayTypeChange(value),
        style: {
          display: 'block',
          width: '100%',
          padding: '8px',
          margin: '4px 0',
          backgroundColor: value === currentType ? 
            'var(--accent-primary)' : 'var(--bg-primary)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          color: 'var(--text-primary)'
        }
      }, key)
    )
  ])));

  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 0);
};

      const selectorElement = React.createElement('div', {
        className: 'day-type-selector',
        style: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }
      }, [
        React.createElement('h3', {
          key: 'title',
          style: { marginBottom: '15px' }
        }, 'Select Day Type'),
        ...Object.entries(DAY_TYPES).map(([key, value]) =>
          React.createElement('button', {
            key,
            onClick: () => handleDayTypeChange(value),
            style: {
              display: 'block',
              width: '100%',
              padding: '8px',
              margin: '4px 0',
              backgroundColor: value === currentType ? 
                'var(--accent-primary)' : 'var(--bg-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }
          }, key)
        )
      ]);

      ReactDOM.render(selectorElement, modalRoot);
    };

    // Render Methods
    const renderCalendarControls = () => {
      return React.createElement('div', {
        className: 'calendar-controls',
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }
      }, [
        React.createElement('div', {
          key: 'nav-buttons',
          style: { display: 'flex', gap: '10px' }
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
              setSelectedDate(newDate);
            },
            style: {
              padding: '8px 16px',
              backgroundColor: 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }
          }, '← Previous'),
          React.createElement('button', {
            key: 'next',
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
              padding: '8px 16px',
              backgroundColor: 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }
          }, 'Next →')
        ]),
        React.createElement('button', {
          key: 'view-toggle',
          onClick: () => setCalendarView(prev => prev === 'month' ? 'week' : 'month'),
          style: {
            padding: '8px 16px',
            backgroundColor: 'var(--accent-primary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }
        }, `Switch to ${calendarView === 'month' ? 'Week' : 'Month'} View`)
      ]);
    };

    const renderMonthView = () => {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const days = [];
      
      // Headers
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(day => {
        days.push(React.createElement('div', {
          key: `header-${day}`,
          style: {
            padding: '10px',
            textAlign: 'center',
            fontWeight: 'bold',
            backgroundColor: 'var(--bg-secondary)'
          }
        }, day));
      });

      // Calculate start padding
      let start = firstDay.getDay();
      if (start === 0) start = 5;
      else if (start === 6) start = 5;
      else start--;

      // Empty cells
      for (let i = 0; i < start; i++) {
        days.push(React.createElement('div', {
          key: `empty-${i}`,
          style: {
            backgroundColor: 'var(--bg-secondary)',
            opacity: 0.5
          }
        }));
      }

      // Calendar days
      let currentDate = new Date(firstDay);
      while (currentDate <= lastDay) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const dayData = calendar[dateStr] || {
            type: DAY_TYPES.ODD,
            state: 'school',
            notes: ''
          };

          const classesForDay = classes.filter(c => c.dayType === dayData.type);

          days.push(React.createElement('div', {
            key: dateStr,
            onClick: () => showDayTypeSelector(new Date(currentDate)),
            style: {
              padding: '10px',
              minHeight: '100px',
              backgroundColor: dayData.type === DAY_TYPES.ODD ? 
                'var(--odd-day-bg)' : 'var(--even-day-bg)',
              cursor: 'pointer',
              position: 'relative'
            }
          }, [
            React.createElement('div', {
              key: 'date',
              style: { fontWeight: 'bold' }
            }, currentDate.getDate()),
            React.createElement('div', {
              key: 'type',
              style: { 
                fontSize: '0.8em',
                color: 'var(--text-secondary)'
              }
            }, dayData.type.toUpperCase()),
            React.createElement('div', {
              key: 'classes',
              style: {
                marginTop: '5px',
                fontSize: '0.8em'
              }
            }, classesForDay.map(cls => 
              React.createElement('div', {
                key: cls.id,
                style: {
                  padding: '2px 4px',
                  backgroundColor: 'var(--bg-secondary)',
                  marginBottom: '2px',
                  borderRadius: '2px'
                }
              }, `P${cls.period}: ${cls.name}`)
            ))
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

    const renderWeekView = () => {
      const monday = getMonday(selectedDate);
      
      return React.createElement('div', {
        className: 'week-view',
        style: {
          display: 'grid',
          gridTemplateColumns: '80px repeat(5, 1fr)',
          gap: '5px',
          backgroundColor: 'var(--bg-primary)',
          padding: '10px',
          borderRadius: '8px'
        }
      }, [
       // Periods column
        React.createElement('div', {
          key: 'periods',
          style: {
            borderRight: '1px solid var(--border-color)'
          }
        }, [
          React.createElement('div', {
            key: 'corner',
            style: {
              height: '50px',
              borderBottom: '1px solid var(--border-color)'
            }
          }),
          ...PERIODS.map(period => 
            React.createElement('div', {
              key: `period-${period}`,
              style: {
                padding: '10px',
                textAlign: 'center',
                minHeight: '80px',
                borderBottom: '1px solid var(--border-color)'
              }
            }, `Period ${period}`)
          )
        ]),

        // Day columns
        ...[0, 1, 2, 3, 4].map(dayOffset => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + dayOffset);
          const dateStr = date.toISOString().split('T')[0];
          const dayData = calendar[dateStr] || {
            type: DAY_TYPES.ODD,
            state: 'school',
            notes: ''
          };

          return React.createElement('div', {
            key: `day-${dayOffset}`,
            className: 'day-column',
            style: {
              backgroundColor: 'var(--bg-secondary)'
            }
          }, [
            // Day header
            React.createElement('div', {
              key: 'header',
              style: {
                padding: '10px',
                textAlign: 'center',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: dayData.type === DAY_TYPES.ODD ? 
                  'var(--odd-day-bg)' : 'var(--even-day-bg)',
                height: '50px'
              }
            }, [
              React.createElement('div', {
                key: 'weekday',
                style: { fontWeight: 'bold' }
              }, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][dayOffset]),
              React.createElement('div', {
                key: 'date',
                style: { fontSize: '0.8em' }
              }, date.getDate())
            ]),
            
            // Period cells
            ...PERIODS.map(period => {
              const classesForPeriod = classes.filter(c => 
                c.period === period && c.dayType === dayData.type
              );

              return React.createElement('div', {
                key: `period-${period}`,
                onClick: () => showDayTypeSelector(date),
                style: {
                  backgroundColor: dayData.type === DAY_TYPES.ODD ? 
                    'var(--odd-day-bg)' : 'var(--even-day-bg)',
                  padding: '10px',
                  minHeight: '80px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }
              }, classesForPeriod.map(cls => 
                React.createElement('div', {
                  key: cls.id,
                  className: 'class-block',
                  style: {
                    padding: '4px',
                    marginBottom: '4px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }
                }, cls.name)
              ));
            })
          ]);
        })
      ]);
    };

    const renderCalendar = () => {
      return React.createElement('div', {
        className: 'calendar-view'
      }, [
        React.createElement('h2', {
          key: 'title',
          style: { marginBottom: '20px' }
        }, selectedDate.toLocaleString('default', { 
          month: 'long', 
          year: 'numeric' 
        })),
        renderCalendarControls(),
        calendarView === 'month' ? renderMonthView() : renderWeekView()
      ]);
    };

    const renderClassManager = () => {
  const [showForm, setShowForm] = React.useState(false);

  const handleAddClass = (classData) => {
    addClass(classData);
    setShowForm(false);
  };

  return React.createElement('div', {
    className: 'class-manager',
    style: { padding: '20px' }
  }, [
    React.createElement('h2', {
      key: 'title',
      style: { marginBottom: '20px' }
    }, 'Class Management'),
    
    !showForm && React.createElement('button', {
      key: 'add-button',
      onClick: () => setShowForm(true),
      style: {
        padding: '8px 16px',
        backgroundColor: 'var(--accent-primary)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginBottom: '20px'
      }
    }, 'Add New Class'),

    showForm && React.createElement(ClassForm, {
      key: 'class-form',
      onSubmit: handleAddClass,
      onCancel: () => setShowForm(false)
    }),

    React.createElement('div', {
      key: 'class-list',
      style: {
        display: 'grid',
        gap: '10px'
      }
    }, classes.map(cls => 
      React.createElement('div', {
        key: cls.id,
        className: 'class-card',
        style: {
          padding: '15px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '4px'
        }
      }, [
        React.createElement('h3', {
          key: 'name'
        }, cls.name),
        React.createElement('div', {
          key: 'details'
        }, [
          React.createElement('p', {
            key: 'period'
          }, `Period ${cls.period}`),
          React.createElement('p', {
            key: 'grade'
          }, `Grade ${cls.gradeLevel}`),
          React.createElement('p', {
            key: 'room'
          }, `Room ${cls.room}`),
          React.createElement('p', {
            key: 'day-type'
          }, `${cls.dayType} days`)
        ])
      ])
    ))
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
      }, [
        ['calendar', 'classes', 'students', 'units'].map(viewName => 
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
        )
      ]),

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
      }, 
        view === 'calendar' ? renderCalendar() :
        view === 'classes' ? renderClassManager() :
        null
      )
    ]);
  };

  // Export the component
  if (typeof window !== 'undefined') {
    window.TeacherPlanner = TeacherPlanner;
  }
})();
