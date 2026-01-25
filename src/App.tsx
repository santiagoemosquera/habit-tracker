import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HabitProvider } from './context/HabitContext';
import { TimerProvider } from './context/TimerContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/AppLayout';
import TodayView from './pages/TodayView';
import TimerView from './pages/TimerView';
import Dashboard from './components/Dashboard';
import HabitDetailView from './pages/HabitDetailView';

function App() {
    return (
        <ThemeProvider>
            <HabitProvider>
                <TimerProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<AppLayout />}>
                                <Route index element={<Navigate to="/habits" replace />} />
                                {/* <Route path="today" element={<TodayView />} /> User requested to hide Today view but keep code */}
                                <Route path="habits" element={<Dashboard />} />
                                <Route path="habits/:id" element={<HabitDetailView />} />
                                <Route path="timer" element={<TimerView />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </TimerProvider>
            </HabitProvider>
        </ThemeProvider>
    );
}

export default App;
