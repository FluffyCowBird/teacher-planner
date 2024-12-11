'use strict';

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check for required dependencies
  if (!window.React || !window.ReactDOM) {
    console.error('React and ReactDOM must be loaded before TeacherPlanner.js');
    return;
  }

  const React = window.React;
  const ReactDOM = window.ReactDOM;

  // Constants remain the same...
  // [Previous constants code remains unchanged]

  // Add a helper function for creating modal content
  const createModalRoot = () => {
    const modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);
    return modalRoot;
  };

  // Update the day type selector to use createRoot
  const showDayTypeSelector = (date, currentType, onSelect) => {
    const modalRoot = createModalRoot();
    const root = ReactDOM.createRoot(modalRoot);

    const handleSelect = (newType) => {
      onSelect(newType);
      root.unmount();
      modalRoot.remove();
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest('.day-type-selector')) {
        root.unmount();
        modalRoot.remove();
        document.removeEventListener('click', handleClickOutside);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    root.render(React.createElement('div', {
      className: 'day-type-selector',
      style: {
        position: 'fixed',
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
        key: 'title',
        style: {
          margin: '0 0 1rem 0',
          fontFamily: THEME.fonts.title,
          color: THEME.colors.textPrimary
        }
      }, 'Select Day Type'),
      ...Object.entries(DAY_TYPES).map(([key, value]) =>
        React.createElement('button', {
          key,
          onClick: () => handleSelect(value),
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
    ]));
  };

  const TeacherPlanner = () => {
    // Previous state declarations remain the same...
    
    // Update handleDayTypeChange to use the new selector
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

    // Updated renderWeekView function
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
          ...PERIODS.map(period => 
            React.createElement('div', {
              key: `period-${period}`,
              onClick: () => {
                showDayTypeSelector(date, dayData.type, (newType) => 
                  handleDayTypeChange(date, newType)
                );
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

    // Update renderMain to include week view
    const renderMain = () => {
      if (loading) {
        return React.createElement('div', {
          key: 'loading',
          style: {
            display: 'flex',
            justifyContent: 'center',
            padding: '2rem'
          }
        }, 'Loading...');
      }

      return React.createElement('div', {
        key: 'calendar-container',
        style: {
          backgroundColor: THEME.colors.bgSecondary,
          padding: '20px',
          borderRadius: '8px'
        }
      }, [
        React.createElement('div', {
          key: 'controls',
          children: renderCalendarControls()
        }),
        React.createElement('div', {
          key: 'view',
          children: calendarView === 'month' ? renderCalendarGrid() : renderWeekView()
        })
      ]);
    };

    // Update main render to include keys
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
      React.createElement('div', {
        key: 'main-content',
        children: renderMain()
      })
    ]);
  };

  // Export the component
  window.TeacherPlanner = TeacherPlanner;
});
