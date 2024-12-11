// Ensure React and ReactDOM are available
const React = window.React;
const ReactDOM = window.ReactDOM;

// ============= CONSTANTS =============
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
  fonts: {
    title: '"Abril Fatface", serif',
    body: '"Trebuchet MS", sans-serif'
  },
  colors: {
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

// ============= UTILITY FUNCTIONS =============
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

// ============= MAIN COMPONENT =============
const TeacherPlanner = () => {
  // ===== State =====
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

  // ===== Calendar Initialization =====
  const initializeCalendarSequence = React.useCallback(() => {
    try {
      const newCalendar = {};
      const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
      const currentDate = new Date(yearStart);
      currentDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate.getFullYear(), 11, 31);
      let schoolDayCount = 0;

      while (currentDate <= endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          schoolDayCount++;
          const dateStr = currentDate.toISOString().split('T')[0];
          newCalendar[dateStr] = {
            type: schoolDayCount % 2 === 1 ? DAY_TYPES.ODD : DAY_TYPES.EVEN,
            state: 'school',
            notes: '',
            lastModified: new Date().toISOString()
          };
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
  }, [selectedDate]);

  React.useEffect(() => {
    if (Object.keys(calendar).length === 0) {
      initializeCalendarSequence();
    }
  }, [calendar, initializeCalendarSequence]);

  // ===== Event Handlers =====
  const handleDateChange = (newDate) => {
    setSelectedDate(new Date(newDate));
  };

  const handleDayTypeChange = (date, newType) => {
    if (!Object.values(DAY_TYPES).includes(newType.toLowerCase())) {
      setError('Invalid day type selected');
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    setCalendar(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || {}),
        type: newType.toLowerCase(),
        lastModified: new Date().toISOString()
      }
    }));
    setError(null);
  };

  // ===== Render Functions =====
  const renderCalendarControls = () => {
        return React.createElement('div', {
      className: 'month-view',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '5px',
        backgroundColor: THEME.colors.bgPrimary,
        padding: '10px',
        borderRadius: '8px',
        position: 'relative'
      }
    }, days);
  };

  const renderWeekView = () => {
    const monday = getMonday(selectedDate);
    const days = [];

    // Period Labels Column
    days.push(React.createElement('div', {
      key: 'period-labels',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '10px',
        borderRight: `1px solid ${THEME.colors.borderColor}`
      }
    }, [
      React.createElement('div', {
        key: 'empty-header',
        style: {
          height: '50px',
          borderBottom: `1px solid ${THEME.colors.borderColor}`
        }
      }),
      ...PERIODS.map(period => 
        React.createElement('div', {
          key: `period-${period}`,
          style: {
            padding: '10px',
            textAlign: 'center',
            minHeight: '80px',
            borderBottom: `1px solid ${THEME.colors.borderColor}`,
            fontFamily: THEME.fonts.body
          }
        }, `Period ${period}`)
      )
    ]));

    // Day columns
    for (let i = 0; i < 5; i++) {
      const date = addDays(monday, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendar[dateStr] || {
        type: DAY_TYPES.ODD,
        state: 'school',
        notes: ''
      };

      const isToday = date.toDateString() === new Date().toDateString();

      days.push(React.createElement('div', {
        key: `day-${i}`,
        style: {
          backgroundColor: THEME.colors.bgSecondary
        }
      }, [
        // Day Header
        React.createElement('div', {
          key: `header-${i}`,
          style: {
            padding: '10px',
            textAlign: 'center',
            borderBottom: `1px solid ${THEME.colors.borderColor}`,
            backgroundColor: getDayTypeColor(dayData.type),
            fontFamily: THEME.fonts.title,
            height: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }
        }, [
          React.createElement('div', {
            key: 'weekday',
            style: {
              fontWeight: 'bold'
            }
          }, WEEKDAYS[i]),
          React.createElement('div', {
            key: 'date',
            style: {
              fontSize: '0.8em',
              color: THEME.colors.textSecondary
            }
          }, date.getDate())
        ]),
        // Periods
        ...PERIODS.map(period => 
          React.createElement('div', {
            key: `period-${period}`,
            onClick: () => {
              const existingSelector = document.querySelector('.day-type-selector');
              if (existingSelector) existingSelector.remove();
              
              const selectorContainer = document.createElement('div');
              document.body.appendChild(selectorContainer);
              ReactDOM.render(renderDayTypeSelector(date, dayData.type), selectorContainer);

              // Click outside to close
              const handleClickOutside = (event) => {
                if (!event.target.closest('.day-type-selector')) {
                  selectorContainer.remove();
                  document.removeEventListener('click', handleClickOutside);
                }
              };
              setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
              }, 0);
            },
            style: {
              backgroundColor: getDayTypeColor(dayData.type),
              padding: '10px',
              minHeight: '80px',
              borderBottom: `1px solid ${THEME.colors.borderColor}`,
              cursor: 'pointer',
              opacity: isToday ? 1 : 0.9
            }
          })
        )
      ]));
    }

    return React.createElement('div', {
      className: 'week-view',
      style: {
        display: 'grid',
        gridTemplateColumns: '100px repeat(5, 1fr)',
        gap: '2px',
        backgroundColor: THEME.colors.bgPrimary,
        padding: '10px',
        borderRadius: '8px'
      }
    }, days);
  };

  const renderError = () => {
    if (!error) return null;

    return React.createElement('div', {
      className: 'error-message',
      style: {
        backgroundColor: THEME.colors.error,
        color: THEME.colors.textPrimary,
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontFamily: THEME.fonts.body
      }
    }, error);
  };

  const renderLoading = () => {
    if (!loading) return null;

    return React.createElement('div', {
      className: 'loading-indicator',
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: THEME.fonts.body
      }
    }, 'Loading...');
  };

  const renderCalendarContainer = () => {
    if (loading) return renderLoading();
    if (error) return renderError();

    return React.createElement('div', {
      className: 'calendar-container',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '20px',
        borderRadius: '8px'
      }
    }, [
      renderCalendarControls(),
      calendarView === 'month' ? renderCalendarGrid() : renderWeekView()
    ]);
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
    React.createElement('h1', {
      key: 'header',
      style: {
        fontFamily: THEME.fonts.title,
        marginBottom: '20px',
        color: THEME.colors.textPrimary
      }
    }, 'Teacher Planner'),
    renderCalendarContainer()
  ]);
};

// Export the component
if (typeof window !== 'undefined' && window.React && window.ReactDOM) {
  window.TeacherPlanner = TeacherPlanner;
} else {
  console.error('React and ReactDOM must be loaded before TeacherPlanner.js');
}', {
      className: 'month-view',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '5px',
        backgroundColor: THEME.colors.bgPrimary,
        padding: '10px',
        borderRadius: '8px'
      }
    }, days);
  };

  const renderWeekView = () => {
    const monday = getMonday(selectedDate);
    const days = [];

    // Period Labels Column
    days.push(React.createElement('div', {
      key: 'period-labels',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '10px',
        borderRight: `1px solid ${THEME.colors.borderColor}`
      }
    }, [
      React.createElement('div', {
        key: 'empty-header',
        style: {
          height: '50px',
          borderBottom: `1px solid ${THEME.colors.borderColor}`
        }
      }),
      ...PERIODS.map(period => 
        React.createElement('div', {
          key: `period-${period}`,
          style: {
            padding: '10px',
            textAlign: 'center',
            minHeight: '80px',
            borderBottom: `1px solid ${THEME.colors.borderColor}`,
            fontFamily: THEME.fonts.body
          }
        }, `Period ${period}`)
      )
    ]));

    // Day columns
    for (let i = 0; i < 5; i++) {
      const date = addDays(monday, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendar[dateStr] || {
        type: DAY_TYPES.ODD,
        state: 'school',
        notes: ''
      };

      const isToday = date.toDateString() === new Date().toDateString();

      days.push(React.createElement('div', {
        key: `day-${i}`,
        style: {
          backgroundColor: THEME.colors.bgSecondary
        }
      }, [
        // Day Header
        React.createElement('div', {
          key: `header-${i}`,
          style: {
            padding: '10px',
            textAlign: 'center',
            borderBottom: `1px solid ${THEME.colors.borderColor}`,
            backgroundColor: getDayTypeColor(dayData.type),
            fontFamily: THEME.fonts.title,
            height: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }
        }, [
          React.createElement('div', {
            key: 'weekday',
            style: {
              fontWeight: 'bold'
            }
          }, WEEKDAYS[i]),
          React.createElement('div', {
            key: 'date',
            style: {
              fontSize: '0.8em',
              color: THEME.colors.textSecondary
            }
          }, date.getDate())
        ]),
        // Periods
        ...PERIODS.map(period => 
          React.createElement('div', {
            key: `period-${period}`,
            onClick: () => {
              const existingSelector = document.querySelector('.day-type-selector');
              if (existingSelector) existingSelector.remove();
              
              const selectorContainer = document.createElement('div');
              document.body.appendChild(selectorContainer);
              ReactDOM.render(renderDayTypeSelector(date, dayData.type), selectorContainer);
            },
            style: {
              backgroundColor: getDayTypeColor(dayData.type),
              padding: '10px',
              minHeight: '80px',
              borderBottom: `1px solid ${THEME.colors.borderColor}`,
              cursor: 'pointer',
              opacity: isToday ? 1 : 0.9,
              position: 'relative'
            }
          })
        )
      ]));
    }

    return React.createElement('div', {
      className: 'week-view',
      style: {
        display: 'grid',
        gridTemplateColumns: '100px repeat(5, 1fr)',
        gap: '2px',
        backgroundColor: THEME.colors.bgPrimary,
        padding: '10px',
        borderRadius: '8px'
      }
    }, days);
  };

  const renderError = () => {
    if (!error) return null;

    return React.createElement('div', {
      className: 'error-message',
      style: {
        backgroundColor: THEME.colors.error,
        color: THEME.colors.textPrimary,
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontFamily: THEME.fonts.body
      }
    }, error);
  };

  const renderLoading = () => {
    if (!loading) return null;

    return React.createElement('div', {
      className: 'loading-indicator',
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: THEME.fonts.body
      }
    }, 'Loading...');
  };

  const renderNavigation = () => {
    const navItems = [
      { id: 'calendar', label: 'Calendar' }
    ];

    return React.createElement('nav', {
      className: 'main-navigation',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '1rem',
        marginBottom: '20px'
      }
    }, React.createElement('div', {
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
          cursor: 'pointer',
          fontFamily: THEME.fonts.body
        }
      }, item.label)
    )));
  };

  const renderCalendarContainer = () => {
    if (loading) return renderLoading();
    if (error) return renderError();

    return React.createElement('div', {
      className: 'calendar-container',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '20px',
        borderRadius: '8px'
      }
    }, [
      renderCalendarControls(),
      calendarView === 'month' ? renderCalendarGrid() : renderWeekView()
    ]);
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
    React.createElement('h1', {
      key: 'header',
      style: {
        fontFamily: THEME.fonts.title,
        marginBottom: '20px',
        color: THEME.colors.textPrimary
      }
    }, 'Teacher Planner'),
    renderNavigation(),
    React.createElement('main', {
      key: 'main',
      style: {
        flex: 1
      }
    }, renderCalendarContainer())
  ]);
};

// Make sure React and ReactDOM are loaded before exporting
if (typeof window !== 'undefined' && window.React && window.ReactDOM) {
  window.TeacherPlanner = TeacherPlanner;
} else {
  console.error('React and ReactDOM must be loaded before TeacherPlanner.js');
}', {
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
          if (calendarView === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
          } else {
            newDate.setDate(newDate.getDate() - 7);
          }
          handleDateChange(newDate);
        },
        style: {
          padding: '8px 16px',
          backgroundColor: THEME.colors.bgSecondary,
          border: 'none',
          borderRadius: '4px',
          color: THEME.colors.textPrimary,
          cursor: 'pointer',
          fontFamily: THEME.fonts.body
        }
      }, '←'),
      React.createElement('h2', {
        key: 'current-date',
        style: {
          margin: 0,
          color: THEME.colors.textPrimary,
          fontFamily: THEME.fonts.title
        }
      }, calendarView === 'month' ? 
        selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' }) :
        `Week of ${getMonday(selectedDate).toLocaleDateString()}`),
      React.createElement('button', {
        key: 'next',
        onClick: () => {
          const newDate = new Date(selectedDate);
          if (calendarView === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
          } else {
            newDate.setDate(newDate.getDate() + 7);
          }
          handleDateChange(newDate);
        },
        style: {
          padding: '8px 16px',
          backgroundColor: THEME.colors.bgSecondary,
          border: 'none',
          borderRadius: '4px',
          color: THEME.colors.textPrimary,
          cursor: 'pointer',
          fontFamily: THEME.fonts.body
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
          cursor: 'pointer',
          fontFamily: THEME.fonts.body
        }
      }, `Switch to ${calendarView === 'month' ? 'Week' : 'Month'} View`)
    ]);
  };

  const renderDayTypeSelector = (date, currentType) => {
    return React.createElement('div', {
      className: 'day-type-selector',
      style: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: THEME.colors.bgSecondary,
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
        minWidth: '200px'
      }
    }, [
      React.createElement('h3', {
        style: {
          margin: '0 0 1rem 0',
          fontFamily: THEME.fonts.title,
          color: THEME.colors.textPrimary
        }
      }, 'Select Day Type'),
      ...Object.entries(DAY_TYPES).map(([key, value]) =>
        React.createElement('button', {
          key,
          onClick: () => {
            handleDayTypeChange(date, value);
            document.querySelector('.day-type-selector').remove();
          },
          style: {
            display: 'block',
            width: '100%',
            padding: '0.5rem',
            margin: '0.25rem 0',
            backgroundColor: value === currentType ? 
              THEME.colors.accentPrimary : THEME.colors.bgPrimary,
            color: THEME.colors.textPrimary,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: THEME.fonts.body,
            textAlign: 'left'
          }
        }, key)
      )
    ]);
  };

  const renderCalendarGrid = () => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Headers
    WEEKDAYS.forEach((day, index) => {
      days.push(React.createElement('div', {
        key: `header-${day}`,
        style: {
          padding: '10px',
          backgroundColor: THEME.colors.bgSecondary,
          textAlign: 'center',
          fontWeight: 'bold',
          color: THEME.colors.textPrimary,
          borderBottom: `1px solid ${THEME.colors.borderColor}`,
          fontFamily: THEME.fonts.title
        }
      }, day));
    });

    // Calculate correct starting position
    let startDayIndex = firstDay.getDay();
    if (startDayIndex === 0) startDayIndex = 5;  // If Sunday, move to end of previous week
    else if (startDayIndex === 6) startDayIndex = 5;  // If Saturday, move to Friday
    else startDayIndex--;  // Adjust for Monday start

    // Empty cells
    for (let i = 0; i < startDayIndex; i++) {
      days.push(React.createElement('div', {
        key: `empty-start-${i}`,
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          opacity: 0.5,
          minHeight: '100px'
        }
      }));
    }

    // Calendar days
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      if (date.getDay() !== 0 && date.getDay() !== 6) {  // Skip weekends
        const dateStr = date.toISOString().split('T')[0];
        const dayData = calendar[dateStr] || {
          type: DAY_TYPES.ODD,
          state: 'school',
          notes: ''
        };

        const isToday = date.toDateString() === new Date().toDateString();

        days.push(React.createElement('div', {
          key: `day-${dateStr}`,
          onClick: (e) => {
            // Remove any existing selector before creating a new one
            const existingSelector = document.querySelector('.day-type-selector');
            if (existingSelector) existingSelector.remove();

            // Create and append the day type selector
            const selectorContainer = document.createElement('div');
            document.body.appendChild(selectorContainer);
            ReactDOM.render(renderDayTypeSelector(date, dayData.type), selectorContainer);

            // Click outside to close
            const handleClickOutside = (event) => {
              if (!event.target.closest('.day-type-selector')) {
                selectorContainer.remove();
                document.removeEventListener('click', handleClickOutside);
              }
            };
            setTimeout(() => {
              document.addEventListener('click', handleClickOutside);
            }, 0);
          },
          style: {
            backgroundColor: getDayTypeColor(dayData.type),
            padding: '10px',
            minHeight: '100px',
            border: isToday ? 
              `2px solid ${THEME.colors.accentPrimary}` : 
              `1px solid ${THEME.colors.borderColor}`,
            color: THEME.colors.textPrimary,
            cursor: 'pointer',
            position: 'relative'
          }
        }, [
          React.createElement('div', {
            key: 'date',
            style: { 
              fontWeight: 'bold',
              fontFamily: THEME.fonts.body
            }
          }, date.getDate()),
          React.createElement('div', {
            key: 'type',
            style: { 
              fontSize: '0.8em',
              color: THEME.colors.textSecondary,
              fontFamily: THEME.fonts.body
            }
          }, dayData.type.toUpperCase())
        ]));
      }
    }

    return React.createElement('div', {
      className: 'month-view',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '5px',
        backgroundColor: THEME.colors.bgPrimary,
        padding: '10px',
        borderRadius: '8px'
      }
    }, days);
  };

  const renderNav = () => {
    return React.createElement('nav', {
      className: 'main-navigation',
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '1rem',
        marginBottom: '20px'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        gap: '1rem'
      }
    }, [
      React.createElement('button', {
        key: 'calendar',
        onClick: () => setView('calendar'),
        style: {
          backgroundColor: THEME.colors.accentPrimary,
          color: THEME.colors.textPrimary,
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: THEME.fonts.body
        }
      }, 'Calendar')
    ]));
  };

  const renderMain = () => {
    if (loading) {
      return React.createElement('div', {
        style: {
          display: 'flex',
          justifyContent: 'center',
          padding: '2rem'
        }
      }, 'Loading...');
    }

    if (error) {
      return React.createElement('div', {
        style: {
          backgroundColor: THEME.colors.error,
          color: THEME.colors.textPrimary,
          padding: '1rem',
          borderRadius: '4px',
          margin: '1rem'
        }
      }, error);
    }

    return React.createElement('div', {
      style: {
        backgroundColor: THEME.colors.bgSecondary,
        padding: '20px',
        borderRadius: '8px'
      }
    }, [
      renderCalendarControls(),
      calendarView === 'month' ? renderCalendarGrid() : renderWeekView()
    ]);
  };

  return React.createElement('div', {
    className: 'teacher-planner',
    style: {
      minHeight: '100vh',
      backgroundColor: THEME.colors.bgPrimary,
      color: THEME.colors.textPrimary,
      padding: '20px'
    }
  }, [
    React.createElement('h1', {
      key: 'header',
      style: {
        fontFamily: THEME.fonts.title,
        marginBottom: '20px',
        color: THEME.colors.textPrimary
      }
    }, 'Teacher Planner'),
    renderNav(),
    renderMain()
  ]);
};

// Export the component
if (typeof window !== 'undefined' && window.React && window.ReactDOM) {
  window.TeacherPlanner = TeacherPlanner;
} else {
  console.error('React and ReactDOM must be loaded before TeacherPlanner.js');
}
