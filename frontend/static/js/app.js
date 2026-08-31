// Global Bilingual Dictionary & State Manager
const I18N_DICTIONARY = {
    en: {
        nav_dashboard: "Dashboard",
        nav_onboard: "Onboard Worker",
        nav_scan: "Dosimeter Scan",
        nav_supervisor: "Supervisor Portal",
        nav_screener: "Olfactory Screener",
        nav_lung_risk: "Lung Risk",

        hero_pill: "Passive Colorimetric Dosimeter + Zero-LLM Kinetic AI",
        hero_title_1: "Intelligent H₂S Exposure Advisory",
        hero_title_2: "रक्षक (Rakshak) Refinery Safety Hub",
        hero_desc: "Real-time kinetic weather-compensated Time-Weighted Average (TWA) calculation, OISD statutory tiering, and empathetic bilingual guidance for refinery operators and shift supervisors.",
        btn_scan_badge: "Scan Dosimeter Badge",
        btn_onboard_worker: "Register Worker",
        btn_supervisor_view: "Supervisor Command Center",

        stat_statutory_tier1: "Tier 1 (Normal) Limit",
        stat_statutory_tier2: "Tier 2 (Caution) Limit",
        stat_statutory_tier3: "Tier 3 (Critical) Limit",
        stat_plant_status: "Plant Units Monitored",

        card1_title: "Bilingual Worker Onboarding",
        card1_desc: "Stateful multi-turn intake collecting clinical baselines, FEV1/FVC ratios, smoking pack-years, and PPE fit-test logs in English and हिन्दी.",
        card2_title: "Deterministic Dosimetry Engine",
        card2_desc: "Zero-LLM Arrhenius temperature & moisture kinetic scaling (k(T, RH)), TWA calculation, and hard Tier 3 OHC override safety locks.",
        card3_title: "Leak Heatmap & 1-Click PDF",
        card3_desc: "Fugitive leak triangulation across plant units and instantaneous auto-generation of official OISD Form-A compliance reports.",
        card_btn_open: "Open Intake Flow",
        card_btn_simulate: "Simulate Badge Scan",
        card_btn_portal: "Open Supervisor Portal",

        onboard_title: "Worker Occupational Intake",
        onboard_subtitle: "Conversational baseline clinical and occupational profile registration",
        btn_restart_chat: "New Session / रीसेट करें",
        profile_preview_title: "Live Profile Preview",

        scan_title: "Passive Dosimeter Badge Scan & Analysis",
        scan_subtitle: "Zero-LLM Kinetic Dosimetry Math + Statutory Classification + AI Advisory",

        sup_title: "Shift Supervisor Command Portal",
        sup_subtitle: "Fugitive Emission Triangulation, Plant-Wide Ledgers & OISD Compliance",

        screener_title: "Neuro-Olfactory & Reflex Fatigue Screener",
        screener_subtitle: "Shift-end screening for olfactory nerve paralysis (≥ 5 ppm H₂S) and CNS latency",

        lung_title: "Chronic Occupational Lung-Risk Model",
        lung_subtitle: "Multi-parameter heuristic scoring (90-Day Rolling Load + Smoking + Spirometry FEV1/FVC + Age)"
    },
    hi: {
        nav_dashboard: "डैशबोर्ड",
        nav_onboard: "कर्मी पंजीकरण",
        nav_scan: "डोसीमीटर स्कैन",
        nav_supervisor: "पर्यवेक्षक पोर्टल",
        nav_screener: "गंध थकान जांच",
        nav_lung_risk: "फेफड़े जोखिम",

        hero_pill: "पैसिव वर्णमापीय डोसीमीटर + शून्य-LLM गतिज AI",
        hero_title_1: "स्मार्ट H₂S जोखिम सलाहकार",
        hero_title_2: "रक्षक (Rakshak) रिफाइनरी सुरक्षा केंद्र",
        hero_desc: "मौसम-मुआवजा समय-भारित औसत (TWA) गणना, OISD वैधानिक श्रेणीकरण, और रिफाइनरी ऑपरेटरों व पर्यवेक्षकों के लिए द्विभाषी संवेदनशील मार्गदर्शन।",
        btn_scan_badge: "डोसीमीटर बैज स्कैन करें",
        btn_onboard_worker: "नया कर्मी जोड़ें",
        btn_supervisor_view: "पर्यवेक्षक कमांड सेंटर",

        stat_statutory_tier1: "टियर 1 (सामान्य) सीमा",
        stat_statutory_tier2: "टियर 2 (सावधानी) सीमा",
        stat_statutory_tier3: "टियर 3 (गंभीर) सीमा",
        stat_plant_status: "निगरानी की जा रही इकाइयां",

        card1_title: "द्विभाषी कर्मी ऑनबोर्डिंग",
        card1_desc: "स्वास्थ्य इतिहास, FEV1/FVC अनुपात, धूम्रपान रिकॉर्ड, और PPE फिट-टेस्ट का बहु-चरणीय सुरक्षित पंजीकरण।",
        card2_title: "गतिज एवं वैधानिक इंजन",
        card2_desc: "आर्हेनियस तापमान व आर्द्रता सुधार (k(T, RH)), TWA गणना, और टियर 3 OHC ओवरराइड सुरक्षा लॉक।",
        card3_title: "रिसाव हीटमैप और PDF",
        card3_desc: "संयंत्र इकाइयों में H2S रिसाव त्रिकोणीयकरण और आधिकारिक OISD फॉर्म-A रिपोर्ट का त्वरित निर्माण।",
        card_btn_open: "पंजीकरण शुरू करें",
        card_btn_simulate: "स्कैन सिम्युलेट करें",
        card_btn_portal: "सुपरवाइजर पोर्टल खोलें",

        onboard_title: "कर्मी व्यावसायिक स्वास्थ्य पंजीकरण",
        onboard_subtitle: "बातचीत के माध्यम से आधारभूत नैदानिक और सुरक्षा प्रोफ़ाइल निर्माण",
        btn_restart_chat: "नया सत्र / रीसेट करें",
        profile_preview_title: "लाइव प्रोफ़ाइल पूर्वावलोकन",

        scan_title: "पैसिव डोसीमीटर बैज स्कैन एवं विश्लेषण",
        scan_subtitle: "शून्य-LLM गतिज डोसीमेट्री गणित + वैधानिक वर्गीकरण + AI मार्गदर्शन",

        sup_title: "शिफ्ट पर्यवेक्षक कमांड पोर्टल",
        sup_subtitle: "गैस रिसाव त्रिकोणीयकरण, संपूर्ण संयंत्र लेजर एवं OISD अनुपालन",

        screener_title: "न्यूरो-ऑलफैक्ट्री एवं रिफ्लेक्स थकान जांच",
        screener_subtitle: "गंध संवेदनहीनता (≥ 5 ppm H₂S) और तंत्रिका प्रतिक्रिया समय की पाली-अंत जांच",

        lung_title: "दीर्घकालिक व्यावसायिक फेफड़े-जोखिम मॉडल",
        lung_subtitle: "90-दिवसीय संचयी भार + धूम्रपान + स्पायरोमेट्री FEV1/FVC + आयु का समग्र स्कोर"
    }
};

let currentLanguage = localStorage.getItem('rakshak_lang') || 'en';

function applyLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('rakshak_lang', lang);
    document.getElementById('currentLangLabel').textContent = lang === 'en' ? 'हिन्दी' : 'English';

    const dict = I18N_DICTIONARY[lang] || I18N_DICTIONARY['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });
}

function toggleLanguage() {
    const nextLang = currentLanguage === 'en' ? 'hi' : 'en';
    applyLanguage(nextLang);
}

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLanguage);
});
