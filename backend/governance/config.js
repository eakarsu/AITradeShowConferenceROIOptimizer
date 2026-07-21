module.exports={
  caseType:'approved_event_roi_reconciliation',initialState:'event_registered',
  states:['event_registered','budget_locked','systems_reconciled','lead_intake','attribution_calculated','outcome_evaluated','owner_review','roi_approved','followup_queued','followup_recorded','provider_failed','corrected','closed'],
  createRoles:['event_owner','marketing_manager'],assessmentRoles:['event_analyst','finance_reviewer','privacy_reviewer'],auditRoles:['marketing_manager','finance_reviewer','auditor'],connectorRoles:['integration_operator','marketing_manager'],
  evidenceKinds:['event_plan','budget_version','crm_snapshot','badge_scan_manifest','expense_reconciliation','consent_record','lead_manifest','attribution_model','roi_calculation','latency_report','outcome_report','owner_review','approval_record','followup_receipt','provider_failure','correction_record','webhook_receipt'],
  requiredSignals:['eventVersion','budgetVersion','crmVersion','badgeVersion','attributionVersion','policyVersion','rightsStatus','consentStatus','reconciliationStatus','leadDedupStatus','attributionAccuracy','roiVariance','p95LatencyMs','outcomeCompleteness'],
  professionalBoundary:'ROI results are decision-support estimates. Human event, finance, privacy, and marketing owners approve attribution and follow-up; assessment cannot write CRM, send campaigns, scan badges, or commit spend.',
  connectors:[{name:'crm',purpose:'authoritative account, lead, and opportunity versions'},{name:'badge_scanner',purpose:'consented attendance receipt manifests'},{name:'finance',purpose:'budget, expense, and revenue reconciliation'},{name:'marketing_automation',purpose:'approved follow-up delivery receipts'},{name:'survey',purpose:'consented outcome responses'},{name:'identity_consent',purpose:'identity, consent, and deletion receipts'},{name:'webhook',purpose:'signed replayable event receipts'}],
  transitions:[
    {from:'event_registered',action:'lock_budget',to:'budget_locked',roles:['event_owner','finance_reviewer'],requiresEvidence:true,dualControl:true},
    {from:'budget_locked',action:'reconcile_systems',to:'systems_reconciled',roles:['integration_operator','finance_reviewer'],requiresEvidence:true},
    {from:'systems_reconciled',action:'record_lead_intake',to:'lead_intake',roles:['event_analyst','privacy_reviewer'],requiresEvidence:true},
    {from:'lead_intake',action:'calculate_attribution',to:'attribution_calculated',roles:['event_analyst'],requiresEvidence:true},
    {from:'attribution_calculated',action:'evaluate_outcome',to:'outcome_evaluated',roles:['finance_reviewer','event_analyst'],requiresEvidence:true,dualControl:true},
    {from:'outcome_evaluated',action:'submit_owner_review',to:'owner_review',roles:['event_owner','privacy_reviewer'],requiresEvidence:true,dualControl:true},
    {from:'owner_review',action:'approve_roi',to:'roi_approved',roles:['marketing_manager','finance_reviewer'],requiresEvidence:true,dualControl:true},
    {from:'roi_approved',action:'queue_followup',to:'followup_queued',roles:['marketing_manager'],requiresEvidence:true,dualControl:true},
    {from:'followup_queued',action:'record_followup',to:'followup_recorded',roles:['integration_operator'],requiresEvidence:true},
    {from:'followup_queued',action:'record_provider_failure',to:'provider_failed',roles:['integration_operator'],requiresEvidence:true},
    {from:'provider_failed',action:'record_correction',to:'corrected',roles:['event_owner','integration_operator'],requiresEvidence:true},
    {from:'followup_recorded',action:'close_event',to:'closed',roles:['marketing_manager','auditor'],requiresEvidence:true},
    {from:'corrected',action:'close_event',to:'closed',roles:['marketing_manager','auditor'],requiresEvidence:true}
  ],
  acceptedFixture:{eventVersion:'e1',budgetVersion:'b1',crmVersion:'c1',badgeVersion:'bd1',attributionVersion:'a1',policyVersion:'p1',rightsStatus:'verified',consentStatus:'verified',reconciliationStatus:'balanced',leadDedupStatus:'passed',attributionAccuracy:0.93,roiVariance:0.04,p95LatencyMs:800,outcomeCompleteness:0.96},
  rejectedFixture:{eventVersion:'e1',budgetVersion:'b1',crmVersion:'c1',badgeVersion:'bd1',attributionVersion:'a1',policyVersion:'p1',rightsStatus:'verified',consentStatus:'verified',reconciliationStatus:'unbalanced',leadDedupStatus:'passed',attributionAccuracy:0.93,roiVariance:0.04,p95LatencyMs:800,outcomeCompleteness:0.96},
  readyDisposition:'event_finance_privacy_review_required',holdDisposition:'reconciliation_consent_attribution_or_outcome_hold',decisionField:'crmWriteCommand',
  assess:x=>{const accuracy=Number(x.attributionAccuracy),variance=Number(x.roiVariance),latency=Number(x.p95LatencyMs),completeness=Number(x.outcomeCompleteness);const ready=x.rightsStatus==='verified'&&x.consentStatus==='verified'&&x.reconciliationStatus==='balanced'&&x.leadDedupStatus==='passed'&&accuracy>=0.9&&variance<=0.05&&latency<=1200&&completeness>=0.95;return{disposition:ready?'event_finance_privacy_review_required':'reconciliation_consent_attribution_or_outcome_hold',crmWriteCommand:null,campaignCommand:null,metrics:{accuracy,variance,latency,completeness},versions:{event:x.eventVersion,budget:x.budgetVersion,crm:x.crmVersion,badge:x.badgeVersion,attribution:x.attributionVersion}};}
};
