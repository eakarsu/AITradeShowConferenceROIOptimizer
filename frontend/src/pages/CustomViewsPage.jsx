import React from 'react';
import LeadConversionFunnel from '../components/LeadConversionFunnel';
import EventRoiHeatmap from '../components/EventRoiHeatmap';
import ShowRecapPdf from '../components/ShowRecapPdf';
import EvaluationRulesEditor from '../components/EvaluationRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <div>
          <h2>Event Views</h2>
          <div className="page-header-sub">Custom analytics, recaps, and scoring rules for trade-show ROI.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <LeadConversionFunnel />
        <EventRoiHeatmap />
        <ShowRecapPdf />
        <EvaluationRulesEditor />
      </div>
    </div>
  );
}
