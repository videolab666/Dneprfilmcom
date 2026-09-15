/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { Layout } from './components/layout/Layout';
import { PageBuilderSurface } from './components/page-builder/PageBuilderSlot';

const ProtectedRoute = lazy(() => import('./components/ProtectedRoute').then((module) => ({ default: module.ProtectedRoute })));
const PortfolioDetailEnhancer = lazy(() => import('./components/portfolio/PortfolioDetailEnhancer').then((module) => ({ default: module.PortfolioDetailEnhancer })));
const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const LiveProduction = lazy(() => import('./pages/LiveProduction').then((module) => ({ default: module.LiveProduction })));
const VideoProduction = lazy(() => import('./pages/VideoProduction').then((module) => ({ default: module.VideoProduction })));
const Videos = lazy(() => import('./pages/Videos').then((module) => ({ default: module.Videos })));
const VideoDetail = lazy(() => import('./pages/VideoDetail').then((module) => ({ default: module.VideoDetail })));
const Cases = lazy(() => import('./pages/Cases').then((module) => ({ default: module.Cases })));
const CaseDetail = lazy(() => import('./pages/CaseDetail').then((module) => ({ default: module.CaseDetail })));
const Galleries = lazy(() => import('./pages/Galleries').then((module) => ({ default: module.Galleries })));
const GalleryDetail = lazy(() => import('./pages/GalleryDetail').then((module) => ({ default: module.GalleryDetail })));
const ConstructionMedia = lazy(() => import('./pages/ConstructionMedia').then((module) => ({ default: module.ConstructionMedia })));
const PhotoProduction = lazy(() => import('./pages/PhotoProduction').then((module) => ({ default: module.PhotoProduction })));
const MediaCenter = lazy(() => import('./pages/MediaCenter').then((module) => ({ default: module.MediaCenter })));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail').then((module) => ({ default: module.ArticleDetail })));
const Contacts = lazy(() => import('./pages/Contacts').then((module) => ({ default: module.Contacts })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then((module) => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-b-indigo-600" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteContentProvider>
        <BrowserRouter basename={routerBasename}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<PageBuilderSurface page="home"><Home /></PageBuilderSurface>} />

                <Route path="live" element={<PageBuilderSurface page="live"><LiveProduction /></PageBuilderSurface>} />
                <Route path="video" element={<PageBuilderSurface page="video"><VideoProduction /></PageBuilderSurface>} />
                <Route path="videos" element={<Videos />} />
                <Route path="videos/:slug" element={<PortfolioDetailEnhancer type="video"><VideoDetail /></PortfolioDetailEnhancer>} />
                <Route path="construction" element={<PageBuilderSurface page="construction"><ConstructionMedia /></PageBuilderSurface>} />
                <Route path="photo" element={<PageBuilderSurface page="photo"><PhotoProduction /></PageBuilderSurface>} />
                <Route path="cases" element={<Cases />} />
                <Route path="cases/:slug" element={<PortfolioDetailEnhancer type="case"><CaseDetail /></PortfolioDetailEnhancer>} />
                <Route path="galleries" element={<Galleries />} />
                <Route path="galleries/:slug" element={<PortfolioDetailEnhancer type="gallery"><GalleryDetail /></PortfolioDetailEnhancer>} />
                <Route path="media-center" element={<MediaCenter />} />
                <Route path="media-center/:slug" element={<ArticleDetail />} />
                <Route path="about" element={<PageBuilderSurface page="about"><About /></PageBuilderSurface>} />
                <Route path="contacts" element={<PageBuilderSurface page="contacts"><Contacts /></PageBuilderSurface>} />

                <Route path="admin/login" element={<AdminLogin />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="admin" element={<AdminDashboard />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SiteContentProvider>
    </AuthProvider>
  );
}
