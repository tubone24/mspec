// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-004
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-009
// Change: web-ui-enhancements

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard.js';
import { ChangeDetail } from '../pages/ChangeDetail.js';
import { ArtifactPreview } from '../pages/ArtifactPreview.js';
import { TestResults } from '../pages/TestResults.js';
import { SpecViewer } from '../pages/SpecViewer.js';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/changes/:id" element={<ChangeDetail />} />
        <Route path="/changes/:id/artifacts/*" element={<ArtifactPreview />} />
        <Route path="/changes/:id/test-results" element={<TestResults />} />
        <Route path="/spec-viewer" element={<SpecViewer />} />
        <Route path="/spec-viewer/:capability" element={<SpecViewer />} />
      </Routes>
    </BrowserRouter>
  );
}
