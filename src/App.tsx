import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HabitProvider } from './context/HabitContext';
import { TimerProvider } from './context/TimerContext';
import { ThemeProvider } from './context/ThemeContext';
import { GameProvider } from './context/GameContext';
import AppLayout from './components/AppLayout';
import TodayView from './pages/TodayView';
import TimerView from './pages/TimerView';
import Dashboard from './components/Dashboard';
import HabitDetailView from './pages/HabitDetailView';
import QuestsView from './pages/QuestsView';
import ShopView from './pages/ShopView';
import CharacterView from './pages/CharacterView';

function App() {
    return (
        <ThemeProvider>
            <GameProvider>
                <HabitProvider>
                    <TimerProvider>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/" element={<AppLayout />}>
                                    <Route index element={<Navigate to="/habits" replace />} />
                                    {/* <Route path="today" element={<TodayView />} /> User requested to hide Today view but keep code */}
                                    <Route path="habits" element={<Dashboard />} />
                                    <Route path="habits/:id" element={<HabitDetailView />} />
                                    <Route path="misiones" element={<QuestsView />} />
                                    <Route path="tienda" element={<ShopView />} />
                                    <Route path="personaje" element={<CharacterView />} />
                                    {/* Timer is no longer in the nav but the route is kept */}
                                    <Route path="timer" element={<TimerView />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </TimerProvider>
                </HabitProvider>
            </GameProvider>
        </ThemeProvider>
    );
}

export default App;
