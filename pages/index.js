import React from 'react';
import dynamic from 'next/dynamic';

// Disable server-side rendering for the planner component
const TeacherPlanner = dynamic(() => import('../components/TeacherPlanner.jsx'), {
  ssr: false
});

export default function Home() {
  return <TeacherPlanner />;
}
