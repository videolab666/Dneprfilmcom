/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Home } from './pages/Home';
import { LiveProduction } from './pages/LiveProduction';
import { VideoProduction } from './pages/VideoProduction';
import { Cases } from './pages/Cases';
import { ConstructionMedia } from './pages/ConstructionMedia';
import { PhotoProduction } from './pages/PhotoProduction';
import { MediaCenter } from './pages/MediaCenter';
import { Contacts } from './pages/Contacts';
import { About } from './pages/About';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export default function App() {
  return (
    <AuthProvider>
      <SiteContentProvider>
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />

              <Route path="live" element={<LiveProduction />} />
              <Route path="video" element={<VideoProduction />} />
              <Route path="construction" element={<ConstructionMedia />} />
              <Route path="photo" element={<PhotoProduction />} />
              <Route path="cases" element={<Cases />} />
              <Route path="media-center" element={<MediaCenter />} />
              <Route path="about" element={<About />} />
              <Route path="contacts" element={<Contacts />} />

              <Route path="admin/login" element={<AdminLogin />} />

              <Route element={<ProtectedRoute />}>
                <Route path="admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </SiteContentProvider>
    </AuthProvider>
  );
}
