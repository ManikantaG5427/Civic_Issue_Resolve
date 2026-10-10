import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Nav & Common
    app_title: 'CivicResolve / Nija-Seva',
    app_tagline: 'Proof-of-Resolution & Civic Verification Platform',
    lang_toggle: 'తెలుగు',
    emergency_disclaimer: 'For life-threatening emergencies (live wires, open manholes, cave-ins, fire), call 112 or 108 immediately. This platform is for municipal maintenance verification.',
    emergency_title: 'Emergency Guidance',

    // Reporting
    report_title: 'Report a Civic Issue',
    report_subtitle: 'Submit photographic proof with GPS location for municipal resolution & independent verification',
    issue_title_label: 'Issue Title',
    issue_desc_label: 'Detailed Description',
    category_label: 'Category',
    location_label: 'Location / Landmark',
    upload_photos: 'Upload Site Photos',
    detect_location: 'Detect Current Location',
    submitting: 'Submitting Civic Report...',
    submit_report: 'Submit Civic Report',
    recurrence_detected: 'Recurrence Signal Detected',
    recurrence_desc: 'Similar issues were resolved at this location recently. Your report will be tracked as a potential repeat defect.',

    // Statuses & Actions
    status_submitted: 'Report Submitted',
    status_under_review: 'Under Review',
    status_assigned: 'Assigned to Crew',
    status_in_progress: 'Work in Progress',
    status_work_completed: 'Work Completed (Pending Inspection)',
    status_rework_required: 'Rework Required',
    status_closed: 'Resolved & Closed',
    status_reopened: 'Disputed & Reopened',

    // Verification & Dispute
    confirm_resolution_btn: 'Looks Fixed (Confirm & Rate)',
    dispute_resolution_btn: 'Still Not Fixed (Dispute & Photo)',
    confirm_title: 'Citizen Resolution Sign-Off',
    confirm_desc: 'Please verify the repaired site before confirming closure.',
    rating_label: 'How satisfied are you with this repair?',
    feedback_placeholder: 'Optional comments on repair quality, crew conduct, etc.',
    dispute_title: 'Contest Resolution Quality',
    dispute_desc: 'If the repair is incomplete, low quality, or hazard remains, contest closure immediately.',
    dispute_reason: 'Dispute Reason',
    reason_work_not_done: 'Work Not Executed',
    reason_poor_quality: 'Poor Quality Repair',
    reason_hazard_remains: 'Hazard / Debris Remains',
    reason_wrong_location: 'Wrong Location Addressed',
    dispute_photos: 'Upload Current Site Photo as Proof',
    dispute_comments_placeholder: 'Explain why the work does not meet safety or quality standards...',
    submit_dispute: 'Submit Dispute & Reopen',
    confirm_success_btn: 'Confirm Resolution',

    // Categories
    cat_pothole: 'Roads & Potholes',
    cat_garbage: 'Garbage & Solid Waste',
    cat_drainage: 'Drainage & Sewage',
    cat_streetlight: 'Street Lighting',
    cat_water: 'Water Supply Leakage',
    cat_sanitation: 'Public Sanitation',

    // Timeline & Badges
    worker_evidence_title: 'Field Worker Proof of Resolution',
    inspector_verified_title: 'Independent Reviewer Verified',
    before_photo: 'Before (Reported)',
    after_photo: 'After (Repair Completed)',
    closure_basis_citizen: 'Citizen Confirmed',
    closure_basis_reviewer: 'Verified (No Response)',
    closure_basis_admin: 'Administrative Overrule',
  },
  te: {
    // Nav & Common
    app_title: 'సివిక్రిజాల్వ్ / నిజ-సేవ',
    app_tagline: 'పౌర సమస్యల పరిష్కార ధృవీకరణ మరియు పారదర్శక వేదిక',
    lang_toggle: 'English',
    emergency_disclaimer: 'ప్రాణాంతక అత్యవసర పరిస్థితులకు (లైవ్ వైర్లు, తెరిచిన మ్యాన్‌హోల్స్, అగ్నిప్రమాదం) వెంటనే 112 లేదా 108 కు కాల్ చేయండి. ఇది మున్సిపల్ పనుల ధృవీకరణ వేదిక.',
    emergency_title: 'అత్యవసర రక్షణ మార్గదర్శకం',

    // Reporting
    report_title: 'పౌర సమస్యను నమోదు చేయండి',
    report_subtitle: 'ఖచ్చితమైన పరిష్కారం మరియు స్వతంత్ర ధృవీకరణ కోసం ఫోటో ఆధారాలు మరియు జీపీఎస్ లొకేషన్‌తో నివేదించండి',
    issue_title_label: 'సమస్య శీర్షిక',
    issue_desc_label: 'సమగ్ర వివరణ',
    category_label: 'సమస్య విభాగం',
    location_label: 'స్థలం / మైలురాయి',
    upload_photos: 'ఫోటోలను అప్‌లోడ్ చేయండి',
    detect_location: 'ప్రస్తుత స్థానాన్ని గుర్తించండి',
    submitting: 'సమస్య నమోదు చేయబడుతోంది...',
    submit_report: 'సమస్యను సమర్పించండి',
    recurrence_detected: 'పునరావృత సమస్య గుర్తించబడింది',
    recurrence_desc: 'గతంలో ఈ ప్రదేశంలో పరిష్కరించిన సమస్య మళ్లీ వచ్చినట్లు గుర్తించబడింది. దీనిని పునరావృత సమస్యగా ట్రాక్ చేస్తాము.',

    // Statuses & Actions
    status_submitted: 'సమర్పించబడింది',
    status_under_review: 'పరిశీలనలో ఉంది',
    status_assigned: 'సిబ్బందికి కేటాయించబడింది',
    status_in_progress: 'పని జరుగుతోంది',
    status_work_completed: 'పని పూర్తయింది (ఇన్‌స్పెక్షన్ పెండింగ్)',
    status_rework_required: 'పునఃపని అవసరం (రీవర్క్)',
    status_closed: 'పరిష్కరించబడింది & ముగిసింది',
    status_reopened: 'ఫిర్యాదు చేయబడింది & పునఃప్రారంభించబడింది',

    // Verification & Dispute
    confirm_resolution_btn: 'సమస్య పరిష్కారమైంది (ధృవీకరించండి)',
    dispute_resolution_btn: 'ఇంకా పరిష్కారం కాలేదు (ఫిర్యాదు చేయండి)',
    confirm_title: 'పౌరుల పరిష్కార ధృవీకరణ',
    confirm_desc: 'సమస్య పూర్తయినట్లు ముగించే ముందు దయచేసి పని నాణ్యతను పరిశీలించండి.',
    rating_label: 'ఈ మరమ్మతు పనిపై మీ సంతృప్తి రేటింగ్ ఇవ్వండి:',
    feedback_placeholder: 'పని నాణ్యత, సిబ్బంది ప్రవర్తనపై మీ అభిప్రాయం (ఐచ్ఛికం)...',
    dispute_title: 'పరిష్కారాన్ని సవాలు చేయండి / ఫిర్యాదు చేయండి',
    dispute_desc: 'పని అసంపూర్తిగా ఉన్నా లేదా నాణ్యత లోపించినా వెంటనే ఫిర్యాదు చేసి పునఃపని కోరండి.',
    dispute_reason: 'ఫిర్యాదుకు గల కారణం',
    reason_work_not_done: 'పని అసలు చేయలేదు',
    reason_poor_quality: 'నాసిరకం మరమ్మతు పని',
    reason_hazard_remains: 'ప్రమాదం / వ్యర్థాలు అలాగే ఉన్నాయి',
    reason_wrong_location: 'తప్పు స్థలంలో పని చేశారు',
    dispute_photos: 'ప్రస్తుత స్థల ఫోటోను ఆధారంగా అప్‌లోడ్ చేయండి',
    dispute_comments_placeholder: 'పని ఎందుకు సంతృప్తికరంగా లేదో వివరించండి...',
    submit_dispute: 'ఫిర్యాదు సమర్పించి పునఃప్రారంభించండి',
    confirm_success_btn: 'పరిష్కారాన్ని ధృవీకరించండి',

    // Categories
    cat_pothole: 'రోడ్డు గుంతలు & మరమ్మతులు',
    cat_garbage: 'చెత్త & ఘన వ్యర్థాల సేకరణ',
    cat_drainage: 'డ్రైనేజీ & మురుగునీటి సమస్య',
    cat_streetlight: 'వీధి దీపాల సమస్య',
    cat_water: 'తాగునీటి లీకేజీ & సరఫరా',
    cat_sanitation: 'పారిశుద్ధ్యం & ప్రజారోగ్యం',

    // Timeline & Badges
    worker_evidence_title: 'ఫీల్డ్ వర్కర్ పరిష్కార ఆధారాలు',
    inspector_verified_title: 'స్వతంత్ర ఇన్‌స్పెక్టర్ ధృవీకరించిన నివేదిక',
    before_photo: 'ముందు (సమస్య ఉన్నప్పుడు)',
    after_photo: 'తర్వాత (మరమ్మతు చేసిన తర్వాత)',
    closure_basis_citizen: 'పౌరుడు స్వయంగా ధృవీకరించారు',
    closure_basis_reviewer: 'ఇన్‌స్పెక్టర్ ద్వారా ధృవీకరించి ముగించబడింది',
    closure_basis_admin: 'అడ్మినిస్ట్రేటివ్ ముగింపు',
  },
};

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('cirp_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('cirp_lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'te' : 'en'));
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
