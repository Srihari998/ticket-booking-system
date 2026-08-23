import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { BookingSuccessPage } from './pages/BookingSuccessPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { WaitlistPage } from './pages/WaitlistPage';
import { WaitlistOfferPage } from './pages/WaitlistOfferPage';
import { OrganiserDashboardPage } from './pages/OrganiserDashboardPage';
import { AdminVenuesPage } from './pages/AdminVenuesPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Navigate to="/events" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />

                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ORGANISER', 'ADMIN']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking-success/:id"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ORGANISER', 'ADMIN']}>
                      <BookingSuccessPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ORGANISER', 'ADMIN']}>
                      <MyBookingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/waitlist"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ORGANISER', 'ADMIN']}>
                      <WaitlistPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/waitlist-offer/:token" element={<WaitlistOfferPage />} />

                <Route
                  path="/organiser"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANISER', 'ADMIN']}>
                      <OrganiserDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/venues"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminVenuesPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/events" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
