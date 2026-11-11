'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

const LanguageContext = createContext('en')

const arabicCopy: Record<string, string> = {
  'Your library': 'مكتبتك الصحية',
  Documents: 'المستندات',
  'Original documents and confirmed explanations.': 'المستندات الأصلية والشروحات التي راجعتها.',
  'Health over time': 'صحتك مع مرور الوقت',
  'Health records': 'السجل الصحي',
  'Latest values, sources, and neutral trends.': 'أحدث القيم ومصادرها واتجاهاتها بدون تشخيص.',
  'Daily organization': 'تنظيم الرعاية اليومية',
  Care: 'الرعاية',
  'Medicines, reminders, appointments, and insurance.': 'الأدوية والتذكيرات والمواعيد والتأمين.',
  'Nearby healthcare': 'الرعاية الصحية القريبة',
  Map: 'الخريطة',
  'Portable health summary': 'ملخص صحي محمول',
  'Care Passport': 'جواز الرعاية',
  'Share essential information quickly and clearly.': 'شارك المعلومات الصحية المهمة بسرعة ووضوح.',
  'Consent and control': 'الموافقة والتحكم',
  Family: 'العائلة',
  'Share only what you choose, for only as long as you choose.':
    'شارك فقط ما تختاره وللمدة التي تحددها.',
  'Healthcare directory': 'دليل الرعاية الصحية',
  Providers: 'مقدمو الرعاية',
  'Search healthcare groups and their branches.': 'ابحث عن مجموعات الرعاية الصحية وفروعها.',
  'Profile, privacy and access': 'الملف الشخصي والخصوصية والوصول',
  Settings: 'الإعدادات',
  'Manage your details, language, notifications, accessibility, and account.':
    'أدر بياناتك ولغتك وإشعاراتك وإعدادات سهولة الوصول وحسابك.',
  'Transparent by design': 'الشفافية أساس التصميم',
  'About Hayat AI': 'عن حياة AI',
  'UAE emergency contacts': 'أرقام الطوارئ في الإمارات',
  'Emergency help': 'مساعدة الطوارئ',
  'Optimise your health': 'حسّن صحتك',
  Wellness: 'العافية',
  'Bring care, movement, nutrition, family support, and verified places into one plan.':
    'اجمع الرعاية والحركة والتغذية ودعم العائلة والأماكن الموثوقة في خطة واحدة.',
  'Step up together': 'نتقدم معاً',
  'Family challenges': 'تحديات العائلة',
  'Turn health goals into small, measurable actions that families can complete together.':
    'حوّل الأهداف الصحية إلى خطوات صغيرة قابلة للقياس تنجزها العائلة معاً.',
  'Funder target': 'هدف الممولين',
  'Fund better health outcomes': 'موّل نتائج صحية أفضل',
  'A family-centred UAE health platform that turns understanding into measurable action.':
    'منصة صحية إماراتية تتمحور حول العائلة وتحول الفهم إلى خطوات قابلة للقياس.',
}

type IconName =
  | 'home'
  | 'chat'
  | 'file'
  | 'chart'
  | 'care'
  | 'map'
  | 'passport'
  | 'family'
  | 'providers'
  | 'settings'
  | 'about'
  | 'sos'
  | 'plus'
  | 'send'
  | 'mic'
  | 'volume'
  | 'copy'
  | 'download'
  | 'check'
  | 'calendar'
  | 'pill'
  | 'shield'
  | 'search'
  | 'menu'
  | 'close'
  | 'camera'
  | 'arrow'
  | 'phone'
  | 'location'
  | 'bell'
  | 'user'
  | 'wellness'
  | 'target'

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-7h6v7" />
    </>
  ),
  chat: <path d="M4 4h16v12H8l-4 4z" />,
  file: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  care: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  map: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  passport: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M8 17h8" />
    </>
  ),
  family: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2M17 7a3 3 0 0 1 0 6M16 15a5 5 0 0 1 5 5" />
    </>
  ),
  providers: (
    <>
      <path d="M3 21h18M5 21V7h14v14M8 7V3h8v4" />
      <path d="M9 12h6M12 9v6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-2-2-3-2.5 1A7 7 0 0 0 15 6l-.5-3h-5L9 6a7 7 0 0 0-1.4 1L5 6 3 9l2 2a7 7 0 0 0 0 2l-2 2 2 3 2.6-1A7 7 0 0 0 9 18l.5 3h5l.5-3a7 7 0 0 0 1.4-1l2.6 1 2-3-2.1-2a7 7 0 0 0 .1-1Z" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  sos: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M12 7v6M12 17h.01" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  send: <path d="m3 3 18 9-18 9 4-9z" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  volume: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4zM15 9a4 4 0 0 1 0 6" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V4H4v12h4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 11l5 5 5-5M4 21h16" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  pill: (
    <>
      <path d="m10.5 5.5-5 5a4.2 4.2 0 0 0 6 6l5-5a4.2 4.2 0 0 0-6-6Z" />
      <path d="m8 8 8 8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  camera: (
    <>
      <path d="M4 7h4l2-3h4l2 3h4v13H4z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  arrow: <path d="m9 18 6-6-6-6" />,
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z" />
  ),
  location: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  wellness: (
    <>
      <path d="M12 21c5-3 8-7 8-12-5 0-8 2-8 7 0-5-3-7-8-7 0 5 3 9 8 12Z" />
      <path d="M12 21V11" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
}

function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

const menu = [
  ['home', 'Home', 'home'],
  ['chat', 'Chat', 'chat'],
  ['documents', 'Documents', 'file'],
  ['records', 'Records', 'chart'],
  ['care', 'Care', 'care'],
  ['wellness', 'Wellness', 'wellness'],
  ['challenges', 'Challenges', 'target'],
  ['map', 'Map', 'map'],
  ['passport', 'Passport', 'passport'],
  ['family', 'Family', 'family'],
  ['providers', 'Providers', 'providers'],
  ['settings', 'Settings', 'settings'],
  ['about', 'About', 'about'],
  ['impact', 'Funders', 'chart'],
] as const

const arabicNav: Record<string, string> = {
  home: 'الرئيسية',
  chat: 'محادثة حياة',
  documents: 'المستندات',
  records: 'السجل الصحي',
  care: 'الرعاية',
  wellness: 'العافية',
  challenges: 'التحديات',
  map: 'الخريطة',
  passport: 'جواز الرعاية',
  family: 'العائلة',
  providers: 'مقدمو الرعاية',
  settings: 'الإعدادات',
  about: 'عن حياة',
  impact: 'الأثر والتمويل',
}

type PatientData = {
  user?: {
    name?: string
    email?: string
    language?: string
    bloodType?: string
    allergies?: string
    emergencyContactName?: string
    emergencyContactPhone?: string
  }
  documents: any[]
  readings: any[]
  medicines: any[]
  appointments: any[]
  policies: any[]
  shares: any[]
  providers: any[]
  challenges: any[]
  participations: any[]
}

type SaveResource = (input: {
  resource: 'medicine' | 'insurance' | 'challenge'
  data: Record<string, unknown>
  operation?: 'create' | 'update' | 'delete'
  id?: string
}) => Promise<any>

const emptyData: PatientData = {
  documents: [],
  readings: [],
  medicines: [],
  appointments: [],
  policies: [],
  shares: [],
  providers: [],
  challenges: [],
  participations: [],
}

const demoData: PatientData = {
  user: {
    name: 'Amina Hassan',
    email: 'amina@example.com',
    language: 'en',
    bloodType: 'O+',
    allergies: 'Penicillin',
    emergencyContactName: 'Fatima Hassan',
    emergencyContactPhone: '+971 50 123 4567',
  },
  documents: [
    {
      id: 'demo-document-1',
      title: 'Complete blood count',
      documentType: 'Blood test',
      status: 'review',
      createdAt: '2025-05-20T09:00:00.000Z',
    },
    {
      id: 'demo-document-2',
      title: 'City Care prescription',
      documentType: 'Prescription',
      status: 'explained',
      createdAt: '2025-05-16T09:00:00.000Z',
    },
  ],
  readings: [
    { id: 'demo-reading-1', metric: 'Haemoglobin', value: 10.8, unit: 'g/dL' },
    { id: 'demo-reading-2', metric: 'Blood pressure', value: 118, unit: 'mmHg' },
    { id: 'demo-reading-3', metric: 'HbA1c', value: 6.1, unit: '%' },
  ],
  medicines: [
    {
      id: 'demo-medicine-1',
      name: 'Metformin',
      dose: '500 mg',
      time: '09:00',
      instructions: 'After breakfast',
    },
    {
      id: 'demo-medicine-2',
      name: 'Vitamin D',
      dose: '1 capsule',
      time: '19:00',
      instructions: 'With food',
    },
  ],
  appointments: [
    {
      id: 'demo-appointment-1',
      providerName: 'Dr. Leena Varghese',
      facilityName: 'Al Noor Medical Centre',
    },
  ],
  policies: [{ id: 'demo-policy-1', insurer: 'Daman', plan: 'Essential Benefits Plan' }],
  shares: [],
  providers: [
    {
      id: 'demo-wellness-1',
      name: 'DNA Health & Wellness',
      providerType: 'private',
      category: 'wellness-clinic',
      specializations: 'Preventive wellness and lifestyle services',
      wellnessServices: 'Service details and eligibility must be confirmed directly.',
      address: 'Dubai, United Arab Emirates',
      emirate: 'dubai',
      verified: false,
    },
    {
      id: 'demo-wellness-2',
      name: 'Right Bite',
      providerType: 'private',
      category: 'healthy-restaurant',
      specializations: 'Health-focused meals and meal plans',
      wellnessServices: 'Menu, allergen, and nutrition information must be confirmed.',
      address: 'United Arab Emirates — exact branch to verify',
      healthyDining: true,
      verified: false,
    },
    {
      id: 'demo-wellness-3',
      name: 'Dubai Fitness Challenge',
      providerType: 'government',
      category: 'community',
      specializations: 'Community movement and fitness activities',
      wellnessServices: 'Seasonal schedules should be confirmed through official channels.',
      address: 'Dubai, United Arab Emirates',
      verified: false,
    },
  ],
  challenges: [
    {
      id: 'demo-challenge-1',
      title: 'UAE Family Steps Challenge',
      titleArabic: 'تحدي خطوات العائلة',
      summary: 'Build a consistent walking habit together, one day at a time.',
      category: 'family',
      durationDays: 30,
      dailyTarget: 7000,
      targetUnit: 'steps per person',
      familyCentric: true,
      reward: 'Family wellness certificate',
      status: 'active',
      fundingGoal: 250000,
      fundingPurpose: 'Community access, family rewards, and bilingual coaching.',
      expectedImpact: '10,000 participating families across the UAE.',
    },
  ],
  participations: [],
}

export function HayatApp({ section }: { section: string }) {
  const [data, setData] = useState<PatientData>(demoData)
  const [loading, setLoading] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [language, setLanguage] = useState('en')
  const [largeText, setLargeText] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [theme, setTheme] = useState('system')
  const [toast, setToast] = useState('')
  const [demoMode, setDemoMode] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)


  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('large-text', largeText)
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [language, theme, largeText, reduceMotion])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(id)
  }, [toast])

  const saveResource = async ({
    resource,
    data: values,
    operation = 'create',
    id,
  }: {
    resource: 'medicine' | 'insurance' | 'challenge'
    data: Record<string, unknown>
    operation?: 'create' | 'update' | 'delete'
    id?: string
  }) => {
    if (demoMode) {
      const doc = { id: id || `demo-${resource}-${Date.now()}`, ...values }
      setData((current) => {
        const key =
          resource === 'medicine'
            ? 'medicines'
            : resource === 'insurance'
              ? 'policies'
              : 'participations'
        const existing = current[key]
        const next =
          operation === 'delete'
            ? existing.filter((item: any) => item.id !== id)
            : operation === 'update'
              ? existing.map((item: any) => (item.id === id ? { ...item, ...doc } : item))
              : [doc, ...existing]
        return { ...current, [key]: next }
      })
      setToast('Demo updated locally — sign in to save changes')
      return doc
    }

    return null
  }

  const content = useMemo(() => {
    if (loading) return <LoadingState />
    const props = {
      data,
      setToast,
      language,
      onUpload: () => setUploadOpen(true),
      saveResource,
    }
    switch (section) {
      case 'home':
        return <Home {...props} />
      case 'chat':
        return <Chat {...props} />
      case 'documents':
        return <Documents {...props} />
      case 'records':
        return <Records {...props} />
      case 'care':
        return <Care {...props} />
      case 'wellness':
        return <Wellness {...props} />
      case 'challenges':
        return <Challenges {...props} />
      case 'map':
        return <MapPage {...props} />
      case 'passport':
        return <Passport {...props} />
      case 'family':
        return <Family {...props} />
      case 'providers':
        return <Providers {...props} />
      case 'settings':
        return (
          <Settings
            language={language}
            setLanguage={setLanguage}
            largeText={largeText}
            setLargeText={setLargeText}
            reduceMotion={reduceMotion}
            setReduceMotion={setReduceMotion}
            theme={theme}
            setTheme={setTheme}
            setToast={setToast}
            data={data}
          />
        )
      case 'about':
        return <About />
      case 'impact':
        return <Impact data={data} />
      case 'sos':
        return <SOS data={data} />
      case 'referral':
        return <Referral setToast={setToast} />
      case 'clinic-path':
        return <ClinicPath setToast={setToast} />
      default:
        return <ErrorState />
    }
  }, [section, data, loading, language, largeText, reduceMotion, theme, demoMode])

  return (
    <div className="app-shell">
      <div className="uae-ribbon" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <aside className={`side-nav ${mobileMenu ? 'open' : ''}`}>
        <div className="brand">
          <Image
            className="brand-logo"
            src="/hayat-logo.png"
            alt="Hayat AI logo"
            width={39}
            height={39}
          />
          <span>
            <b>Hayat AI</b>
            <small>
              {language === 'ar' ? 'رعاية صحية بلغة واضحة.' : 'Care you can understand.'}
            </small>
          </span>
        </div>
        <button className="close-menu" onClick={() => setMobileMenu(false)} aria-label="Close menu">
          <Icon name="close" />
        </button>
        <nav>
          {menu.map(([href, label, icon]) => (
            <Link
              key={href}
              href={`/${href}`}
              className={section === href ? 'active' : ''}
              onClick={() => setMobileMenu(false)}
            >
              <Icon name={icon} />
              <span>{language === 'ar' ? arabicNav[href] : label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-bottom">
          <Link href="/sos" className="sos-button">
            <Icon name="sos" /> SOS
          </Link>
          <button type="button" className="sign-out" onClick={() => setToast("Demo preview: sign-out is not connected")}>Sign out</button>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="nav-scrim"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
        />
      )}
      <div className="app-main">
        <header className="top-bar">
          <button
            className="menu-button"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>
          <div className="mobile-brand">
            <Image
              className="brand-logo"
              src="/hayat-logo.png"
              alt="Hayat AI logo"
              width={30}
              height={30}
            />
            <b>Hayat AI</b>
          </div>
          <div className="top-actions">
            <Link href="/sos" className="top-sos">
              SOS
            </Link>
            <select
              aria-label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
            <button
              className={largeText ? 'active-control' : ''}
              onClick={() => setLargeText(!largeText)}
              aria-pressed={largeText}
            >
              Aa <span>{language === 'ar' ? 'نص كبير' : 'Large text'}</span>
            </button>
            <select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <button
              className="icon-button notification-button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label={language === 'ar' ? 'الإشعارات' : 'Notifications'}
              aria-expanded={notificationsOpen}
            >
              <Icon name="bell" />
              <span className="notification-dot" />
            </button>
          </div>
        </header>
        {notificationsOpen && (
          <aside className="notification-panel" aria-label="Notifications">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{language === 'ar' ? 'آخر التحديثات' : 'Latest updates'}</p>
                <h2>{language === 'ar' ? 'الإشعارات' : 'Notifications'}</h2>
              </div>
              <button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">
                <Icon name="close" />
              </button>
            </div>
            <div className="notification-item unread">
              <span className="notification-symbol">
                <Icon name="pill" />
              </span>
              <div>
                <b>{language === 'ar' ? 'موعد الدواء' : 'Medicine reminder'}</b>
                <p>
                  {language === 'ar'
                    ? 'حان وقت تناول Metformin 500 mg.'
                    : 'It is time for Metformin 500 mg.'}
                </p>
                <small>{language === 'ar' ? 'الآن' : 'Now'}</small>
              </div>
            </div>
            <div className="notification-item">
              <span className="notification-symbol">
                <Icon name="calendar" />
              </span>
              <div>
                <b>{language === 'ar' ? 'موعد قادم' : 'Upcoming appointment'}</b>
                <p>
                  {language === 'ar'
                    ? 'موعدك بعد ثلاثة أيام.'
                    : 'Your appointment is in three days.'}
                </p>
                <small>{language === 'ar' ? 'منذ ساعتين' : '2 hours ago'}</small>
              </div>
            </div>
            <Link href="/settings" onClick={() => setNotificationsOpen(false)}>
              {language === 'ar' ? 'إدارة الإشعارات' : 'Manage notifications'}
            </Link>
          </aside>
        )}
        {demoMode && (
          <div className="demo-banner" role="status">
            <Icon name="about" />
            <span>
              <b>{language === 'ar' ? 'وضع العرض' : 'Demo mode'}</b>
              {language === 'ar'
                ? 'هذه بيانات تجريبية خيالية للمعاينة فقط. سجلاتك الخاصة محمية.'
                : ' Fictional sample data is shown for preview only. Your private records remain protected.'}
            </span>
            <Link href="/login">{language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</Link>
          </div>
        )}
        <main id="main-content" className="page-content">
          <LanguageContext.Provider value={language}>{content}</LanguageContext.Provider>
        </main>
        <footer>
          {language === 'ar'
            ? 'حياة AI يشرح المستندات ولا يقدم تشخيصاً أو نصيحة طبية.'
            : 'Hayat AI explains documents. It is not medical advice.'}
        </footer>
      </div>
      <nav className="bottom-nav">
        {[
          ['home', 'Home', 'home'],
          ['care', 'Care', 'care'],
          ['chat', 'Chat', 'chat'],
          ['map', 'Map', 'map'],
          ['about', 'More', 'menu'],
        ].map(([href, label, icon]) => (
          <Link key={href} href={`/${href}`} className={section === href ? 'active' : ''}>
            <Icon name={icon as IconName} />
            <span>{language === 'ar' ? arabicNav[href] || 'المزيد' : label}</span>
          </Link>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" />
          {toast}
        </div>
      )}
      {uploadOpen && (
        <UploadModal
          language={language}
          onClose={() => setUploadOpen(false)}
          onComplete={(document) => {
            setData((current) => ({ ...current, documents: [document, ...current.documents] }))
            setUploadOpen(false)
            setToast(
              language === 'ar'
                ? 'المعاينة المحلية جاهزة — لم يتم حفظ الملف'
                : 'Local preview ready — the file was not saved',
            )
          }}
        />
      )}
    </div>
  )
}

function PageHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}) {
  const language = useContext(LanguageContext)
  const translate = (value?: string) =>
    value && language === 'ar' ? arabicCopy[value] || value : value
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">{translate(eyebrow)}</p>
        <h1>{translate(title)}</h1>
        {description && <p className="page-description">{translate(description)}</p>}
      </div>
      {action}
    </div>
  )
}

function Home({
  data,
  onUpload,
  language,
}: {
  data: PatientData
  setToast: (v: string) => void
  onUpload: () => void
  language: string
}) {
  const name = data.user?.name?.split(' ')[0] || 'there'
  const ar = language === 'ar'
  return (
    <>
      <PageHead
        eyebrow={new Date().toLocaleDateString(ar ? 'ar-AE' : 'en-AE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        title={ar ? `مرحباً، ${name}` : `Hello, ${name}.`}
        description={ar ? 'كيف يمكننا مساعدتك اليوم؟' : 'What would you like help with today?'}
      />
      <Link href="/chat" className="ask-hayat">
        <Image className="hayat-logo-orb" src="/hayat-logo.png" alt="" width={46} height={46} />
        <span>
          <b>
            {ar
              ? 'اسأل حياة عن معلوماتك الصحية'
              : 'Ask Hayat anything about your health information'}
          </b>
          <small>
            {ar
              ? 'ابدأ محادثة أو ارفع تقريراً أو اطلب المساعدة.'
              : 'Start a conversation, upload a report, or ask for help.'}
          </small>
        </span>
        <Icon name="arrow" />
      </Link>
      <div className="quick-grid">
        {[
          ['Upload a document', 'file', '/chat'],
          ['Find a doctor', 'providers', '/providers'],
          ['Find a pharmacy', 'map', '/map'],
          ['My medicines', 'pill', '/care'],
          ['Health records', 'chart', '/records'],
          ['SOS', 'sos', '/sos'],
        ].map(([label, icon, href]) =>
          label === 'Upload a document' ? (
            <button key={label} className="quick-action" onClick={onUpload}>
              <Icon name="file" />
              <span>{ar ? 'رفع مستند' : label}</span>
            </button>
          ) : (
            <Link
              key={label}
              href={href}
              className={label === 'SOS' ? 'quick-action danger' : 'quick-action'}
            >
              <Icon name={icon as IconName} />
              <span>{label}</span>
            </Link>
          ),
        )}
      </div>
      <div className="dashboard-grid">
        <DashboardCard title="Today’s medicines" action="View care" href="/care">
          {data.medicines.length ? (
            data.medicines.slice(0, 3).map((m: any) => (
              <label className="medicine-line" key={m.id}>
                <input type="checkbox" />
                <span>
                  <b>{m.name}</b>
                  <small>
                    {m.dose} · {m.time}
                  </small>
                </span>
              </label>
            ))
          ) : (
            <Empty compact text="No medicines added" action="Add medicine" href="/care" />
          )}
        </DashboardCard>
        <DashboardCard title="Next appointment" action="Calendar" href="/care">
          {data.appointments[0] ? (
            <div className="appointment-preview">
              <span className="date-block">
                {data.appointments[0].date ? new Date(data.appointments[0].date).getDate() : '—'}
                <small>
                  {data.appointments[0].date
                    ? new Date(data.appointments[0].date)
                        .toLocaleDateString('en-AE', { month: 'short' })
                        .toUpperCase()
                    : 'TBC'}
                </small>
              </span>
              <div>
                <b>{data.appointments[0].providerName}</b>
                <p>{data.appointments[0].facilityName}</p>
              </div>
            </div>
          ) : (
            <Empty compact text="No upcoming appointments" action="Add appointment" href="/care" />
          )}
        </DashboardCard>
        <DashboardCard title="Recent documents" action="Library" href="/documents">
          {data.documents.length ? (
            data.documents.slice(0, 3).map((d: any) => (
              <div className="document-line" key={d.id}>
                <Icon name="file" />
                <span>
                  <b>{d.title}</b>
                  <small>{d.documentType}</small>
                </span>
                <Status value={d.status} />
              </div>
            ))
          ) : (
            <Empty
              compact
              text="Your document library is empty"
              action="Upload document"
              href="/chat"
            />
          )}
        </DashboardCard>
        <DashboardCard title="Needs attention" tone="attention">
          {data.readings.find(
            (reading: any) => reading.metric === 'Haemoglobin' && Number(reading.value) < 12,
          ) ? (
            <div className="attention-message">
              <Icon name="shield" />
              <div>
                <b>One value is outside its recorded range</b>
                <p>Open Health records to review the source and printed range.</p>
                <strong>Discuss unexpected results with your doctor.</strong>
              </div>
            </div>
          ) : (
            <p className="muted">No confirmed items need your attention right now.</p>
          )}
        </DashboardCard>
        <DashboardCard title="Health snapshot">
          {data.readings.length ? (
            data.readings.slice(0, 3).map((r: any) => (
              <div className="snapshot" key={r.id}>
                <span>{r.metric}</span>
                <b>
                  {r.value} {r.unit}
                </b>
              </div>
            ))
          ) : (
            <Empty compact text="No readings yet" action="Add a reading" href="/records" />
          )}
        </DashboardCard>
        <DashboardCard title="Insurance status">
          {data.policies[0] ? (
            <div className="insurance-active">
              <Icon name="shield" />
              <div>
                <b>{data.policies[0].insurer}</b>
                <p>Policy active</p>
              </div>
              <Status value="Active" />
            </div>
          ) : (
            <Empty compact text="No insurance policy saved" action="Add policy" href="/care" />
          )}
        </DashboardCard>
      </div>
    </>
  )
}

function Chat({
  data,
  setToast,
  onUpload,
  language,
}: {
  data: PatientData
  setToast: (v: string) => void
  onUpload: () => void
  language: string
}) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ from: 'user' | 'ai'; text: string }[]>([])
  const [typing, setTyping] = useState(false)
  const ar = language === 'ar'
  const answerFor = (text: string) => {
    const prompt = text.toLowerCase()
    if (prompt.includes('medicine') || prompt.includes('medication') || prompt.includes('دواء')) {
      const active = data.medicines.filter((medicine: any) => medicine.active !== false)
      return active.length
        ? `${ar ? 'هذه أدويتك النشطة المسجلة:' : 'Here are your recorded active medicines:'} ${active
            .map(
              (medicine: any) =>
                `${medicine.name} ${medicine.dose}, ${medicine.time}${medicine.instructions ? ` (${medicine.instructions})` : ''}`,
            )
            .join(
              '; ',
            )}. ${ar ? 'تحقق من الوصفة أو الصيدلي قبل أي تغيير.' : 'Check the prescription or ask your pharmacist before making any change.'}`
        : ar
          ? 'لا توجد أدوية نشطة مسجلة. يمكنك إضافتها من صفحة الرعاية.'
          : 'No active medicines are recorded. You can add one from Care.'
    }
    if (prompt.includes('insurance') || prompt.includes('تأمين')) {
      const policy = data.policies[0]
      return policy
        ? `${ar ? 'وثيقة التأمين المسجلة:' : 'Your recorded policy:'} ${policy.insurer}${policy.plan ? `, ${policy.plan}` : ''}. ${policy.networkName ? `${ar ? 'الشبكة' : 'Network'}: ${policy.networkName}.` : ''} ${policy.supportLocation ? `${ar ? 'موقع الدعم' : 'Support location'}: ${policy.supportLocation}.` : ''}`
        : ar
          ? 'لا توجد وثيقة تأمين مسجلة. أضف وثيقتك من الرعاية لمعرفة الشبكة وموقع الدعم.'
          : 'No insurance policy is saved. Add one in Care to organise network and support-location details.'
    }
    if (prompt.includes('challenge') || prompt.includes('تحدي')) {
      const participation = data.participations[0]
      const challenge = data.challenges[0]
      return participation
        ? `${ar ? 'تقدم العائلة في التحدي' : 'Family challenge progress'}: ${participation.progress || 0}% · ${participation.streakDays || 0} ${ar ? 'أيام متتالية' : 'day streak'}.`
        : challenge
          ? `${ar ? 'التحدي المتاح' : 'Available challenge'}: ${ar && challenge.titleArabic ? challenge.titleArabic : challenge.title}. ${challenge.durationDays} ${ar ? 'يوماً' : 'days'}, ${challenge.dailyTarget} ${challenge.targetUnit}.`
          : ar
            ? 'لا يوجد تحدٍ نشط حالياً.'
            : 'There is no active challenge right now.'
    }
    if (prompt.includes('summary') || prompt.includes('organise') || prompt.includes('ملخص')) {
      return `${ar ? 'ملخصك المنظم:' : 'Your organised summary:'} ${data.medicines.length} ${ar ? 'أدوية' : 'medicines'}, ${data.appointments.length} ${ar ? 'مواعيد' : 'appointments'}, ${data.documents.length} ${ar ? 'مستندات' : 'documents'}, ${data.policies.length} ${ar ? 'وثائق تأمين' : 'insurance policies'}. ${ar ? 'هذه معلومات مسجلة وليست نصيحة طبية.' : 'This is a summary of recorded information, not medical advice.'}`
    }
    return ar
      ? 'يمكنني تلخيص سجلاتك وتنظيم الأدوية والتأمين والتحديات العائلية ومساعدتك في إعداد أسئلة للطبيب. لا أشخّص الحالات.'
      : 'I can summarise your records, organise medicines, insurance, and family challenges, and help prepare questions for your doctor. I do not diagnose conditions.'
  }
  const send = (text: string) => {
    if (!text.trim()) return
    setMessages((v) => [...v, { from: 'user', text }])
    setMessage('')
    setTyping(true)
    setTimeout(() => {
      setMessages((v) => [
        ...v,
        {
          from: 'ai',
          text: answerFor(text),
        },
      ])
      setTyping(false)
    }, 900)
  }
  return (
    <div className="chat-layout">
      <aside className="conversation-list">
        <button className="new-chat">
          <Icon name="plus" /> {ar ? 'محادثة جديدة' : 'New chat'}
        </button>
        <div className="search-box">
          <Icon name="search" />
          <input placeholder={ar ? 'البحث في المحادثات' : 'Search conversations'} />
        </div>
        <p className="group-label">Today</p>
        <button className="conversation active">
          <b>Blood test results</b>
          <small>Haemoglobin explanation</small>
        </button>
        <p className="group-label">Previous 7 days</p>
        <button className="conversation">
          <b>Questions for my doctor</b>
          <small>Appointment preparation</small>
        </button>
      </aside>
      <section className="chat-main">
        <div className="chat-header">
          <div>
            <p className="eyebrow">{ar ? 'محادثة حياة' : 'Hayat chat'}</p>
            <h1>{ar ? 'كيف يمكنني مساعدتك؟' : 'How can I help?'}</h1>
          </div>
          <Status value="Private" />
        </div>
        <div className="messages">
          <div className="welcome-message">
            <Image
              className="hayat-logo-orb"
              src="/hayat-logo.png"
              alt="Hayat AI"
              width={52}
              height={52}
            />
            <h2>{ar ? 'مرحباً بك في حياة' : 'Welcome to Hayat'}</h2>
            <p>
              {ar
                ? 'يمكنني مساعدتك في فهم المستندات والعثور على الرعاية والاستعداد لموعدك القادم.'
                : 'I can help you understand documents, find care, and prepare for your next appointment.'}
            </p>
            <div className="starter-grid">
              {[
                'Upload a document',
                'Find a doctor',
                'Find a pharmacy or hospital',
                'Explain a medical word',
                'Questions for my doctor',
                'How do I use Hayat?',
              ].map((x) => (
                <button key={x} onClick={() => (x === 'Upload a document' ? onUpload() : send(x))}>
                  {x}
                  <Icon name="arrow" />
                </button>
              ))}
            </div>
          </div>
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.from}`}>
              {m.text}
              {m.from === 'ai' && (
                <>
                  <span className="answer-badge">General information</span>
                  <div className="bubble-tools">
                    <button
                      onClick={() => navigator.clipboard.writeText(m.text)}
                      aria-label="Copy answer"
                    >
                      <Icon name="copy" />
                    </button>
                    <button
                      onClick={() => {
                        if (!('speechSynthesis' in window)) {
                          setToast('Read aloud is not supported by this browser')
                          return
                        }
                        speechSynthesis.cancel()
                        const utterance = new SpeechSynthesisUtterance(m.text)
                        utterance.lang = ar ? 'ar-AE' : 'en-AE'
                        utterance.rate = 0.92
                        speechSynthesis.speak(utterance)
                        setToast(ar ? 'جارٍ القراءة بصوت عالٍ' : 'Reading response aloud')
                      }}
                      aria-label="Read answer"
                    >
                      <Icon name="volume" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {messages.some((item) => item.from === 'ai') && <ExplanationExample />}
          {typing && (
            <div className="typing">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
        <div className="composer">
          <button title={ar ? 'رفع ملف' : 'Upload file'} onClick={onUpload}>
            <Icon name="plus" />
          </button>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(message)}
            placeholder={
              ar ? 'اسأل حياة أو اشرح ما تحتاجه…' : 'Ask Hayat or describe what you need…'
            }
          />
          <button
            title="Use microphone"
            onClick={() => setToast('Voice input is not connected yet; type your question instead')}
          >
            <Icon name="mic" />
          </button>
          <button className="send" onClick={() => send(message)} title="Send">
            <Icon name="send" />
          </button>
        </div>
      </section>
    </div>
  )
}

function Documents({
  data,
  setToast,
  onUpload,
  language,
}: {
  data: PatientData
  setToast: (v: string) => void
  onUpload: () => void
  language: string
}) {
  const ar = language === 'ar'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const visibleDocuments = data.documents.filter((document: any) => {
    const matchesSearch = `${document.title} ${document.documentType}`
      .toLowerCase()
      .includes(query.toLowerCase())
    return matchesSearch && (category === 'all' || document.documentType === category)
  })
  return (
    <>
      <PageHead
        eyebrow="Your library"
        title="Documents"
        description="Original documents and confirmed explanations."
        action={
          <button className="primary-button small" onClick={onUpload}>
            <Icon name="plus" />
            {ar ? 'رفع مستند' : 'Upload document'}
          </button>
        }
      />
      <div className="document-toolbar" role="search">
        <label className="search-box">
          <Icon name="search" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ar ? 'البحث في المستندات' : 'Search documents'}
            aria-label="Search documents"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">{ar ? 'كل الفئات' : 'All categories'}</option>
          <option value="Blood test">{ar ? 'فحوصات الدم' : 'Blood tests'}</option>
          <option value="Medical report">{ar ? 'التقارير الطبية' : 'Medical reports'}</option>
          <option value="Prescription">{ar ? 'الوصفات الطبية' : 'Prescriptions'}</option>
          <option value="Discharge summary">{ar ? 'ملخصات الخروج' : 'Discharge summaries'}</option>
          <option value="Insurance">{ar ? 'مستندات التأمين' : 'Insurance documents'}</option>
        </select>
        <span>
          {ar ? `${visibleDocuments.length} مستند` : `${visibleDocuments.length} documents`}
        </span>
      </div>
      {visibleDocuments.length ? (
        <div className="table-card">
          {visibleDocuments.map((d: any) => (
            <div className="document-row" key={d.id}>
              <span className="file-icon">
                <Icon name="file" />
              </span>
              <div>
                <b>{d.title}</b>
                <small>
                  {d.documentType} · {new Date(d.createdAt).toLocaleDateString()}
                </small>
              </div>
              <Status value={d.status} />
              <Link href="/chat">Open in chat</Link>
              <button
                onClick={() =>
                  setToast(
                    d.file?.url
                      ? 'Open the document record to access its original file'
                      : 'No original file is attached to this record',
                  )
                }
                aria-label={`Download ${d.title}`}
              >
                <Icon name="download" />
              </button>
              <button
                onClick={() => setToast('Delete requires confirmation')}
                aria-label={`Delete ${d.title}`}
              >
                <Icon name="close" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          text={data.documents.length ? 'No documents match your filters' : 'No documents yet'}
          action="Upload a document"
          onClick={onUpload}
        />
      )}
    </>
  )
}

function Records({ data, setToast }: { data: PatientData; setToast: (v: string) => void }) {
  const cats = data.readings.map((reading: any) => [
    reading.category || 'Health reading',
    reading.metric,
    String(reading.value),
    reading.unit,
  ])
  return (
    <>
      <PageHead
        eyebrow="Health over time"
        title="Health records"
        description="Latest values, sources, and neutral trends."
        action={
          <button
            className="primary-button small"
            onClick={() =>
              setToast('Reading entry is not connected yet; current records are read-only')
            }
          >
            Add a reading
          </button>
        }
      />
      {cats.length ? (
        <div className="record-grid">
          {cats.map(([cat, metric, value, unit], i) => (
            <Link href="/records" className="record-card" key={cat}>
              <div className="record-top">
                <span>{cat}</span>
                <Status value="Recorded" />
              </div>
              <h3>
                {value} <small>{unit}</small>
              </h3>
              <p>{metric}</p>
              <svg viewBox="0 0 160 45">
                <path
                  d={
                    i % 2
                      ? 'M0 30 C35 28 45 12 75 22 S120 28 160 10'
                      : 'M0 28 C30 10 50 35 80 20 S125 30 160 16'
                  }
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <div className="record-foot">
                <span>Latest confirmed value</span>
                <span>Source on record</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          text="No health readings yet"
          action="Add a reading"
          onClick={() =>
            setToast('Reading entry is not connected yet; current records are read-only')
          }
        />
      )}
      {cats.length > 0 && (
        <div className="detail-chart">
          <div>
            <p className="eyebrow">Metric detail</p>
            <h2>{cats[0][1]} over time</h2>
            <p>
              Hayat displays confirmed values over time without interpreting the cause or making a
              diagnosis.
            </p>
          </div>
          <div className="chart-area">
            <span className="range-band">Reference range shown when available</span>
            <svg viewBox="0 0 600 180">
              <path
                d="M20 110 C140 90 210 120 300 105 S450 130 580 125"
                fill="none"
                stroke="#d71920"
                strokeWidth="4"
              />
              <circle cx="580" cy="125" r="7" fill="#d71920" />
            </svg>
          </div>
          <button className="secondary-button" onClick={() => window.print()}>
            Print record
          </button>
        </div>
      )}
    </>
  )
}

function Care({
  data,
  setToast,
  language,
  saveResource,
}: {
  data: PatientData
  setToast: (v: string) => void
  language: string
  saveResource: SaveResource
}) {
  const [tab, setTab] = useState('Today')
  const [medicineForm, setMedicineForm] = useState(false)
  const ar = language === 'ar'
  const tabLabel: Record<string, string> = {
    Today: 'اليوم',
    Reminders: 'التذكيرات',
    Calendar: 'المواعيد',
    Insurance: 'التأمين',
  }
  return (
    <>
      <PageHead
        eyebrow="Daily organization"
        title="Care"
        description="Medicines, reminders, appointments, and insurance."
      />
      <div className="tabs">
        {['Today', 'Reminders', 'Calendar', 'Insurance'].map((x) => (
          <button className={tab === x ? 'active' : ''} onClick={() => setTab(x)} key={x}>
            {ar ? tabLabel[x] : x}
          </button>
        ))}
      </div>
      {tab === 'Today' && (
        <div className="care-stack">
          <div className="care-section-head">
            <div>
              <p className="eyebrow">{ar ? 'الجدول الحالي' : 'Current schedule'}</p>
              <h2>{ar ? 'الأدوية النشطة' : 'Active medicines'}</h2>
            </div>
            <button className="primary-button small" onClick={() => setMedicineForm(true)}>
              <Icon name="plus" /> {ar ? 'إضافة دواء' : 'Add medicine'}
            </button>
          </div>
          <div className="care-list">
            {data.medicines.length ? (
              data.medicines
                .filter((medicine: any) => medicine.active !== false)
                .map((m: any) => (
                  <div className="care-medicine" key={m.id}>
                    <button
                      className="medicine-check"
                      aria-label={`Mark ${m.name} completed`}
                      onClick={() =>
                        saveResource({
                          resource: 'medicine',
                          operation: 'update',
                          id: m.id,
                          data: { ...m, active: false },
                        }).catch((error) => setToast(error.message))
                      }
                    >
                      <Icon name="check" />
                    </button>
                    <span className="pill-icon">
                      <Icon name="pill" />
                    </span>
                    <span>
                      <b>
                        {m.name} {m.dose}
                      </b>
                      <small>
                        {m.time} · {m.instructions || 'As directed'}
                      </small>
                      {m.prescribingOrganization && <em>{m.prescribingOrganization}</em>}
                    </span>
                    <button
                      className="row-delete"
                      onClick={() =>
                        saveResource({
                          resource: 'medicine',
                          operation: 'delete',
                          id: m.id,
                          data: {},
                        }).catch((error) => setToast(error.message))
                      }
                      aria-label={`Delete ${m.name}`}
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                ))
            ) : (
              <Empty
                text="No medicines scheduled for today"
                action="Add medicine"
                onClick={() => setMedicineForm(true)}
              />
            )}
          </div>
          {data.medicines.some((medicine: any) => medicine.active === false) && (
            <div className="completed-medicines">
              <h3>{ar ? 'المكتملة' : 'Completed'}</h3>
              {data.medicines
                .filter((medicine: any) => medicine.active === false)
                .map((medicine: any) => (
                  <div key={medicine.id}>
                    <Icon name="check" />
                    <span>
                      {medicine.name} {medicine.dose}
                    </span>
                    <button
                      onClick={() =>
                        saveResource({
                          resource: 'medicine',
                          operation: 'update',
                          id: medicine.id,
                          data: { ...medicine, active: true },
                        }).catch((error) => setToast(error.message))
                      }
                    >
                      Restore
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
      {tab === 'Reminders' && (
        <TwoColumn
          title="Medicine reminders"
          button="Add reminder"
          onClick={() => setToast('Add a medicine and enable its reminder to create a schedule')}
          items={data.medicines.map(
            (medicine: any) =>
              `${medicine.name} · ${medicine.time || 'Time not set'} · ${medicine.frequency || 'Schedule not set'}`,
          )}
        />
      )}{' '}
      {tab === 'Calendar' && <CalendarView data={data} setToast={setToast} />}{' '}
      {tab === 'Insurance' && (
        <Insurance data={data} setToast={setToast} saveResource={saveResource} />
      )}
      {medicineForm && (
        <MedicineForm
          onClose={() => setMedicineForm(false)}
          onSave={async (values) => {
            await saveResource({ resource: 'medicine', data: values })
            setMedicineForm(false)
          }}
        />
      )}
    </>
  )
}

function MapPage({ data }: { data: PatientData; setToast: (v: string) => void }) {
  const places = data.providers
  return (
    <>
      <PageHead
        eyebrow="Nearby healthcare"
        title="Map"
        description="Facilities from public directories. Call to confirm hours and accessibility."
      />
      <div className="map-filters">
        <button>Open now</button>
        <button>24-hour</button>
        <button>Wheelchair accessible</button>
        <select>
          <option>All facility types</option>
          <option>Hospital</option>
          <option>Pharmacy</option>
          <option>Clinic</option>
        </select>
        <button className="location-button">
          <Icon name="location" />
          Use my location
        </button>
      </div>
      {places.length ? (
        <div className="map-layout">
          <div className="map-canvas">
            <div className="map-grid" />
            {places.slice(0, 5).map((_: any, i: number) => (
              <span
                className="map-pin"
                style={{ left: `${20 + i * 15}%`, top: `${25 + (i % 2) * 30}%` }}
                key={i}
              >
                {i + 1}
              </span>
            ))}
            <button className="search-area">Search this area</button>
          </div>
          <div className="place-list">
            {places.slice(0, 5).map((p: any, i: number) => (
              <article className="place-card" key={p.id}>
                <div className="place-number">{i + 1}</div>
                <div>
                  <div className="source-row">
                    <Status value={p.verified ? 'Verified source' : 'Unverified'} />
                    <span>{(0.8 + i * 0.6).toFixed(1)} km</span>
                  </div>
                  <h3>{p.name}</h3>
                  <p>{p.address || 'Approximate address'}</p>
                  <small>Hours not listed. Call to confirm.</small>
                  <div className="place-actions">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`}
                      target="_blank"
                    >
                      Directions
                    </a>
                    <a href={`tel:${p.phone}`}>
                      <Icon name="phone" /> Call
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="integration-empty">
          <Icon name="map" size={28} />
          <h2>Live provider directory unavailable</h2>
          <p>
            No verified provider source is connected right now. Hayat will not invent facility
            details.
          </p>
          <a
            href="https://www.google.com/maps/search/healthcare+near+me"
            target="_blank"
            rel="noreferrer"
          >
            Search in Google Maps
          </a>
        </div>
      )}
      <div className="data-banner">
        <Icon name="about" />
        Facility information is shown only when a verified provider source is connected.
      </div>
    </>
  )
}

function Passport({ data, setToast }: { data: PatientData; setToast: (v: string) => void }) {
  return (
    <>
      <PageHead
        eyebrow="Portable health summary"
        title="Care Passport"
        description="Share essential information quickly and clearly."
        action={
          <button className="secondary-button" onClick={() => window.print()}>
            Print card
          </button>
        }
      />
      <div className="passport-layout">
        <div className="care-card">
          <div className="care-card-head">
            <Image
              className="brand-logo"
              src="/hayat-logo.png"
              alt="Hayat AI logo"
              width={39}
              height={39}
            />
            <div>
              <b>Hayat Care Card</b>
              <small>Patient-provided information</small>
            </div>
            <div className="qr">▦</div>
          </div>
          <h2>{data.user?.name || 'Name not provided'}</h2>
          <div className="care-card-grid">
            <span>
              Blood type<b>{data.user?.bloodType || 'Not provided'}</b>
            </span>
            <span>
              Allergies<b>{data.user?.allergies || 'Not provided'}</b>
            </span>
            <span>
              Emergency contact<b>{data.user?.emergencyContactName || 'Not provided'}</b>
            </span>
            <span>
              Insurance<b>{data.policies[0]?.insurer || 'Not added'}</b>
            </span>
          </div>
          <p>Hayat AI is not an emergency service.</p>
        </div>
        <div className="details-card">
          <h2>Care details</h2>
          <InfoRow label="Name" value={data.user?.name || 'Not provided'} />
          <InfoRow label="Blood type" value={data.user?.bloodType || 'Not provided'} />
          <InfoRow label="Allergies" value={data.user?.allergies || 'Not provided'} />
          <InfoRow
            label="Emergency contact"
            value={data.user?.emergencyContactPhone || 'Not provided'}
          />
          <button
            className="primary-button small"
            onClick={() =>
              setToast('Profile editing is not connected yet; existing details remain unchanged')
            }
          >
            Edit details
          </button>
        </div>
      </div>
    </>
  )
}

function Family({ data, setToast }: { data: PatientData; setToast: (v: string) => void }) {
  const [tab, setTab] = useState('Shared by me')
  return (
    <>
      <PageHead
        eyebrow="Consent and control"
        title="Family"
        description="Share only what you choose, for only as long as you choose."
        action={
          <button
            className="primary-button small"
            onClick={() => setToast('New family sharing is not connected yet')}
          >
            Share a document
          </button>
        }
      />
      <div className="tabs">
        {['Shared by me', 'Shared with me', 'Access log'].map((x) => (
          <button className={tab === x ? 'active' : ''} onClick={() => setTab(x)} key={x}>
            {x}
          </button>
        ))}
      </div>
      <div className="table-card">
        {tab === 'Shared by me' && data.shares.length ? (
          <div className="share-row">
            <span className="avatar">FH</span>
            <div>
              <b>Complete blood count</b>
              <small>Shared with Fatima · Includes explanation only</small>
            </div>
            <Status value="Active" />
            <button onClick={() => setToast('Revoking family access is not connected yet')}>
              Revoke
            </button>
          </div>
        ) : tab === 'Shared with me' || (tab === 'Shared by me' && !data.shares.length) ? (
          <Empty
            compact
            text="No documents have been shared with you"
            action="Refresh"
            onClick={() => setToast('Access refreshed')}
          />
        ) : (
          <Empty
            compact
            text="No sharing activity recorded"
            action="Refresh"
            onClick={() => setToast('Access log refreshed')}
          />
        )}
      </div>
    </>
  )
}

function Providers({ data }: { data: PatientData; setToast: (v: string) => void }) {
  const providers = data.providers
  return (
    <>
      <PageHead
        eyebrow="Healthcare directory"
        title="Providers"
        description="Search healthcare groups and their branches."
      />
      <div className="provider-tools">
        <div className="search-box">
          <Icon name="search" />
          <input placeholder="Search providers" />
        </div>
        <button>Government</button>
        <button>Private</button>
      </div>
      {providers.length ? (
        <div className="provider-grid">
          {providers.map((p: any) => (
            <article className="provider-card" key={p.id}>
              <div className="provider-logo">
                <Icon name="providers" />
              </div>
              <Status value={p.verified ? 'Verified' : 'Unverified'} />
              <h2>{p.name}</h2>
              <p>{p.specializations}</p>
              <small>{p.branches}</small>
              <div className="provider-links">
                <a href={p.website || '#'}>Website</a>
                <a href={`tel:${p.phone || ''}`}>Phone</a>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(p.name)}`}>Google Maps</a>
              </div>
              <footer>
                Last checked{' '}
                {p.lastChecked ? new Date(p.lastChecked).toLocaleDateString() : 'date not listed'}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="integration-empty">
          <Icon name="providers" size={28} />
          <h2>No verified provider data available</h2>
          <p>
            The healthcare directory has not been connected. Hayat will show providers here only
            when a verified source is available.
          </p>
        </div>
      )}
    </>
  )
}

function Settings({
  language,
  setLanguage,
  largeText,
  setLargeText,
  reduceMotion,
  setReduceMotion,
  theme,
  setTheme,
  setToast,
  data,
}: {
  language: string
  setLanguage: (v: string) => void
  largeText: boolean
  setLargeText: (v: boolean) => void
  reduceMotion: boolean
  setReduceMotion: (v: boolean) => void
  theme: string
  setTheme: (v: string) => void
  setToast: (v: string) => void
  data: PatientData
}) {
  const [notifications, setNotifications] = useState(true)
  const ar = language === 'ar'
  return (
    <>
      <PageHead
        eyebrow="Profile, privacy and access"
        title="Settings"
        description="Manage your details, language, notifications, accessibility, and account."
      />
      <div className="settings-card">
        <div className="settings-section-label">{ar ? 'الملف الشخصي' : 'Profile'}</div>
        <Setting
          label={ar ? 'المعلومات الشخصية' : 'Personal information'}
          description={data.user?.email || (ar ? 'أضف بيانات التواصل' : 'Add your contact details')}
        >
          <button onClick={() => setToast('Profile editing is not connected yet')}>
            {ar ? 'تعديل' : 'Edit profile'}
          </button>
        </Setting>
        <Setting
          label={ar ? 'اللغة' : 'Language'}
          description={
            ar ? 'اختر اللغة المستخدمة في حياة' : 'Choose the language used across Hayat'
          }
        >
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </Setting>
        <Setting
          label={ar ? 'المظهر' : 'Theme'}
          description={ar ? 'فاتح أو داكن أو حسب إعداد جهازك' : 'Light, dark, or match your device'}
        >
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Setting>
        <Setting
          label={ar ? 'نص كبير' : 'Large text'}
          description={ar ? 'تكبير النص وأزرار اللمس' : 'Increase text and touch target sizes'}
        >
          <Toggle value={largeText} setValue={setLargeText} />
        </Setting>
        <Setting
          label={ar ? 'تقليل الحركة' : 'Reduce motion'}
          description={ar ? 'تقليل الانتقالات والحركة' : 'Minimize transitions and animation'}
        >
          <Toggle value={reduceMotion} setValue={setReduceMotion} />
        </Setting>
        <div className="settings-section-label">
          {ar ? 'الإشعارات والخصوصية' : 'Notifications and privacy'}
        </div>
        <Setting
          label={ar ? 'التذكيرات الصحية' : 'Health reminders'}
          description={
            ar
              ? 'المواعيد والأدوية وتحديثات المستندات'
              : 'Appointments, medicines, and document updates'
          }
        >
          <Toggle value={notifications} setValue={setNotifications} />
        </Setting>
        <Setting
          label={ar ? 'الخصوصية والمشاركة' : 'Privacy and sharing'}
          description={
            ar
              ? 'راجع وصول العائلة وسجل الموافقات'
              : 'Review active family access and consent history'
          }
        >
          <Link href="/family">{ar ? 'إدارة' : 'Manage'}</Link>
        </Setting>
        <Setting label="Download my data" description="Export a copy of your Hayat records">
          <button
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
              )
              const link = document.createElement('a')
              link.href = url
              link.download = 'hayat-data-export.json'
              link.click()
              URL.revokeObjectURL(url)
              setToast('Data export downloaded')
            }}
          >
            Download
          </button>
        </Setting>
        <div className="settings-section-label">{ar ? 'الحساب' : 'Account'}</div>
        <Setting
          label={ar ? 'تسجيل الخروج' : 'Sign out'}
          description={
            ar ? 'إنهاء الجلسة الآمنة على هذا الجهاز' : 'End this secure session on this device'
          }
        >
          <button type="button" className="sign-out" onClick={() => setToast("Demo preview: sign-out is not connected")}>Sign out</button>
        </Setting>
        <Setting
          label="Delete my account"
          description="Permanently remove your account and records"
          danger
        >
          <button
            onClick={() => setToast('Account deletion is not connected; no data was changed')}
          >
            Delete account
          </button>
        </Setting>
      </div>
    </>
  )
}

function About() {
  return (
    <>
      <PageHead
        eyebrow="Transparent by design"
        title="About Hayat AI"
        description="What Hayat does, what it does not do, and what still needs verification."
      />
      <div className="about-grid">
        <article>
          <Icon name="check" />
          <h2>What Hayat does</h2>
          <p>
            Explains uploaded documents in plain language, organizes records, and helps people
            prepare questions for healthcare professionals.
          </p>
        </article>
        <article>
          <Icon name="close" />
          <h2>What Hayat does not do</h2>
          <p>
            Hayat does not diagnose conditions, prescribe treatment, replace a doctor or pharmacist,
            or act as an emergency service.
          </p>
        </article>
        <article>
          <Icon name="shield" />
          <h2>What is stored</h2>
          <p>
            Your account, uploaded records, confirmed values, reminders, appointments, insurance
            details, and consent history.
          </p>
        </article>
        <article>
          <Icon name="about" />
          <h2>Data sources</h2>
          <p>
            Your documents, self-entered information, and verified provider sources. Source and
            verification status are shown wherever information appears.
          </p>
        </article>
      </div>
      <div className="verify-list">
        <h2>Items marked “to verify”</h2>
        <p>
          Facility opening hours · provider accessibility services · insurance contact details ·
          unconfirmed extracted values
        </p>
      </div>
    </>
  )
}

function SOS({ data }: { data: PatientData; setToast?: (v: string) => void }) {
  return (
    <div className="sos-page">
      <p className="eyebrow">UAE emergency contacts</p>
      <h1>Emergency help</h1>
      <div className="emergency-warning">
        <Icon name="sos" />
        <b>Hayat AI is not an emergency service.</b>
      </div>
      <a href="tel:998" className="ambulance-call">
        <Icon name="phone" />
        <span>
          <small>AMBULANCE</small>
          <b>998</b>
        </span>
      </a>
      <div className="other-emergency">
        <a href="tel:999">
          <span>Police</span>
          <b>999</b>
        </a>
        <a href="tel:997">
          <span>Fire</span>
          <b>997</b>
        </a>
      </div>
      <div className="sos-grid">
        <div className="sos-info">
          <h2>Critical information</h2>
          <InfoRow label="Blood type" value={data.user?.bloodType || 'Not provided'} />
          <InfoRow label="Allergies" value={data.user?.allergies || 'Not provided'} />
          <InfoRow label="Insurance" value={data.policies[0]?.insurer || 'Not provided'} />
        </div>
        <div className="sos-contact">
          <h2>Emergency contact</h2>
          <b>{data.user?.emergencyContactName || 'Not provided'}</b>
          <p>{data.user?.emergencyContactPhone}</p>
          <div>
            <a href={`tel:${data.user?.emergencyContactPhone || ''}`}>Call</a>
            <a href={`sms:${data.user?.emergencyContactPhone || ''}`}>SMS</a>
            <a href={`https://wa.me/${data.user?.emergencyContactPhone || ''}`}>WhatsApp</a>
          </div>
          <Link href="/map">
            Nearest emergency department <Icon name="arrow" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function Referral({ setToast }: { setToast: (v: string) => void }) {
  const [done, setDone] = useState([true, true, false, false])
  const steps = [
    'Confirm referral and specialist',
    'Prepare recent medical reports',
    'Write questions for the specialist',
    'Add appointment to calendar',
  ]
  return (
    <>
      <PageHead
        eyebrow="Referral checklist"
        title="Prepare for specialist care"
        description={`${done.filter(Boolean).length} of ${done.length} steps complete`}
      />
      <div className="progress">
        <span style={{ width: `${(done.filter(Boolean).length / done.length) * 100}%` }} />
      </div>
      <div className="referral-layout">
        <div className="checklist">
          {steps.map((s, i) => (
            <label key={s}>
              <input
                type="checkbox"
                checked={done[i]}
                onChange={() => setDone(done.map((x, j) => (j === i ? !x : x)))}
              />
              <span>
                <b>{s}</b>
                <small>
                  {i === 1
                    ? 'Bring blood results, medicine list, and insurance card'
                    : 'Tap when complete'}
                </small>
              </span>
            </label>
          ))}
          <button onClick={() => setToast('Custom referral steps are not connected yet')}>
            <Icon name="plus" />
            Add my own step
          </button>
        </div>
        <aside>
          <h2>Documents to bring</h2>
          <p>Latest blood test</p>
          <p>Medicine list</p>
          <p>Insurance card</p>
          <button onClick={() => setToast('Calendar export is not connected yet')}>
            Add to calendar
          </button>
        </aside>
      </div>
    </>
  )
}

function ClinicPath({ setToast }: { setToast: (v: string) => void }) {
  const [needs, setNeeds] = useState<string[]>([])
  return (
    <>
      <PageHead
        eyebrow="Concept"
        title="Clinic Path"
        description="A step-by-step visit guide adapted to your accessibility needs."
      />
      <div className="concept-badge">CONCEPT · Needs user testing</div>
      <section className="needs-section">
        <h2>What support would help?</h2>
        <div>
          {[
            'Wheelchair access',
            'Hearing support',
            'Vision support',
            'Simple language',
            'Interpreter',
          ].map((n) => (
            <button
              className={needs.includes(n) ? 'selected' : ''}
              onClick={() =>
                setNeeds(needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n])
              }
              key={n}
            >
              {needs.includes(n) && <Icon name="check" />}
              {n}
            </button>
          ))}
        </div>
      </section>
      <div className="path-stages">
        {[
          ['Before you go', 'Prepare documents and questions'],
          ['Arriving', 'Find the accessible entrance'],
          ['In the clinic', 'Explain the support you need'],
          ['After', 'Review instructions in simple language'],
        ].map((x, i) => (
          <article key={x[0]}>
            <span>{i + 1}</span>
            <h3>{x[0]}</h3>
            <p>{x[1]}</p>
          </article>
        ))}
      </div>
      <div className="desk-script">
        <div>
          <p className="eyebrow">What to say at the desk</p>
          <h2>“Hello, I need simple language and an interpreter for my appointment.”</h2>
        </div>
        <button
          onClick={() => {
            speechSynthesis.speak(
              new SpeechSynthesisUtterance(
                'Hello, I need simple language and an interpreter for my appointment.',
              ),
            )
            setToast('Reading phrase aloud')
          }}
        >
          <Icon name="volume" />
          Read aloud
        </button>
      </div>
    </>
  )
}

function Wellness({ data, language }: { data: PatientData; language: string }) {
  const [filter, setFilter] = useState('all')
  const ar = language === 'ar'
  const categories =
    filter === 'all' ? ['wellness-clinic', 'healthy-restaurant', 'fitness', 'community'] : [filter]
  const places = data.providers.filter((provider: any) => categories.includes(provider.category))
  const scoreParts = [
    data.medicines.length > 0,
    data.policies.length > 0,
    data.appointments.length > 0,
    data.participations.length > 0,
    data.readings.length > 0,
  ]
  const score = Math.round((scoreParts.filter(Boolean).length / scoreParts.length) * 100)
  return (
    <>
      <PageHead
        eyebrow="Optimise your health"
        title="Wellness"
        description="Bring care, movement, nutrition, family support, and verified places into one plan."
      />
      <section className="optimisation-hero">
        <div>
          <p className="eyebrow">{ar ? 'درجة الاستعداد' : 'Health organisation score'}</p>
          <h2>{score}%</h2>
          <p>
            {ar
              ? 'تزداد الدرجة عندما تنظم الأدوية والتأمين والمواعيد والتحديات والقراءات.'
              : 'Your score grows as you organise medicines, insurance, appointments, challenges, and readings.'}
          </p>
        </div>
        <div className="score-ring" style={{ '--score': `${score * 3.6}deg` } as CSSProperties}>
          <span>{score}</span>
          <small>/100</small>
        </div>
      </section>
      <div className="optimisation-grid">
        {[
          ['Medicines organised', data.medicines.length, '/care', 'pill'],
          ['Insurance connected', data.policies.length, '/care', 'shield'],
          ['Family challenge', data.participations.length, '/challenges', 'target'],
          ['Health readings', data.readings.length, '/records', 'chart'],
        ].map(([label, count, href, icon]) => (
          <Link href={href as string} className="optimisation-card" key={label as string}>
            <span>
              <Icon name={icon as IconName} />
            </span>
            <div>
              <b>{label}</b>
              <small>{Number(count) > 0 ? 'Connected' : 'Next best action'}</small>
            </div>
            <Icon name="arrow" />
          </Link>
        ))}
      </div>
      <div className="section-split-head">
        <div>
          <p className="eyebrow">Healthy places</p>
          <h2>Wellness clinics, restaurants and community spaces</h2>
        </div>
        <div className="filter-pills">
          {[
            ['all', 'All'],
            ['wellness-clinic', 'Clinics'],
            ['healthy-restaurant', 'Healthy dining'],
            ['fitness', 'Fitness'],
          ].map(([value, label]) => (
            <button
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {places.length ? (
        <div className="wellness-place-grid">
          {places.map((place: any) => (
            <article key={place.id}>
              <div className="place-type">
                <Icon name={place.category === 'healthy-restaurant' ? 'care' : 'wellness'} />
              </div>
              <Status value={place.verified ? 'Verified' : 'To verify'} />
              <h3>{place.name}</h3>
              <p>{place.wellnessServices || place.specializations || 'Services not listed'}</p>
              <small>{place.address || place.emirate || 'Location not listed'}</small>
              {place.insuranceNetworks && <em>Insurance: {place.insuranceNetworks}</em>}
              <div>
                {place.phone && <a href={`tel:${place.phone}`}>Call</a>}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Directions
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="integration-empty">
          <Icon name="wellness" size={28} />
          <h2>No verified wellness places match this filter</h2>
          <p>
            Clinics, healthy restaurants, and places appear only when a verified directory source is
            connected.
          </p>
        </div>
      )}
    </>
  )
}

function Challenges({
  data,
  language,
  saveResource,
  setToast,
}: {
  data: PatientData
  language: string
  saveResource: SaveResource
  setToast: (value: string) => void
}) {
  const [joining, setJoining] = useState<any>(null)
  const ar = language === 'ar'
  return (
    <>
      <PageHead
        eyebrow="Step up together"
        title="Family challenges"
        description="Turn health goals into small, measurable actions that families can complete together."
      />
      <div className="challenge-overview">
        <div>
          <span>
            <Icon name="target" />
          </span>
          <b>{data.participations.length}</b>
          <small>Active family challenges</small>
        </div>
        <div>
          <span>
            <Icon name="family" />
          </span>
          <b>
            {data.participations.reduce(
              (total: number, item: any) => total + (item.familyMembers?.length || 0) + 1,
              0,
            )}
          </b>
          <small>Family members involved</small>
        </div>
        <div>
          <span>
            <Icon name="chart" />
          </span>
          <b>{data.participations[0]?.streakDays || 0}</b>
          <small>Current day streak</small>
        </div>
      </div>
      {data.challenges.length ? (
        <div className="challenge-grid">
          {data.challenges.map((challenge: any) => {
            const participation = data.participations.find((item: any) => {
              const challengeId =
                typeof item.challenge === 'object' ? item.challenge?.id : item.challenge
              return challengeId === challenge.id
            })
            return (
              <article className="challenge-card" key={challenge.id}>
                <div className="uae-accent" />
                <div className="challenge-card-head">
                  <span>
                    <Icon name={challenge.category === 'family' ? 'family' : 'target'} />
                  </span>
                  <Status value={participation ? 'Joined' : challenge.status} />
                </div>
                <p className="eyebrow">{challenge.durationDays} day challenge</p>
                <h2>{ar && challenge.titleArabic ? challenge.titleArabic : challenge.title}</h2>
                <p>{challenge.summary}</p>
                <div className="challenge-target">
                  <b>
                    {challenge.dailyTarget?.toLocaleString()} {challenge.targetUnit}
                  </b>
                  <span>Daily family target</span>
                </div>
                {participation ? (
                  <>
                    <div className="challenge-progress">
                      <div>
                        <span>Progress</span>
                        <b>{participation.progress || 0}%</b>
                      </div>
                      <span>
                        <span style={{ width: `${participation.progress || 0}%` }} />
                      </span>
                    </div>
                    <button
                      className="primary-button"
                      onClick={() =>
                        saveResource({
                          resource: 'challenge',
                          operation: 'update',
                          id: participation.id,
                          data: {
                            ...participation,
                            challenge: challenge.id,
                            progress: Math.min(100, (participation.progress || 0) + 4),
                            streakDays: (participation.streakDays || 0) + 1,
                            lastCheckIn: new Date().toISOString(),
                          },
                        }).catch((error) => setToast(error.message))
                      }
                    >
                      <Icon name="check" /> Check in today
                    </button>
                  </>
                ) : (
                  <button className="primary-button" onClick={() => setJoining(challenge)}>
                    Join as a family
                  </button>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <Empty
          text="No active challenges available"
          action="Check again"
          onClick={() => location.reload()}
        />
      )}
      {joining && (
        <ChallengeJoinForm
          challenge={joining}
          onClose={() => setJoining(null)}
          onSave={async (values) => {
            await saveResource({ resource: 'challenge', data: values })
            setJoining(null)
          }}
        />
      )}
    </>
  )
}

function Impact({ data }: { data: PatientData }) {
  const fundingGoal = data.challenges.reduce(
    (total: number, challenge: any) => total + (Number(challenge.fundingGoal) || 0),
    0,
  )
  return (
    <>
      <PageHead
        eyebrow="Funder target"
        title="Fund better health outcomes"
        description="A family-centred UAE health platform that turns understanding into measurable action."
      />
      <section className="impact-hero">
        <div>
          <span className="impact-label">Why fund Hayat AI</span>
          <h2>Move from health information to healthier daily behaviour.</h2>
          <p>
            Funding connects document understanding, medicine adherence, insurance navigation,
            verified wellness places, and family challenges in one accessible bilingual journey.
          </p>
        </div>
        <div className="funding-target">
          <small>Current programme target</small>
          <b>AED {fundingGoal ? fundingGoal.toLocaleString() : '250,000'}</b>
          <span>For a measurable family-wellness pilot</span>
        </div>
      </section>
      <div className="impact-metrics">
        {[
          ['10,000', 'Target UAE families'],
          ['30 days', 'Pilot challenge duration'],
          ['2 languages', 'English and Arabic access'],
          ['5 outcomes', 'Understanding, adherence, navigation, activity, family support'],
        ].map(([value, label]) => (
          <div key={label}>
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="funding-grid">
        <article>
          <span>01</span>
          <h3>Healthcare accessibility</h3>
          <p>
            Reduce confusion around reports, medicines, insurance, and next steps for older adults
            and multilingual families.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Preventive optimisation</h3>
          <p>
            Connect people to verified wellness clinics, healthy places, and achievable family
            challenges before problems escalate.
          </p>
        </article>
        <article>
          <span>03</span>
          <h3>Measurable impact</h3>
          <p>
            Track challenge participation, organisation completeness, medicine routines, and
            care-navigation actions without making diagnostic claims.
          </p>
        </article>
      </div>
      <section className="funding-use">
        <div>
          <p className="eyebrow">How funding is used</p>
          <h2>Transparent programme allocation</h2>
        </div>
        <div className="allocation-list">
          {[
            ['35%', 'Bilingual AI safety and explanation quality'],
            ['25%', 'Family challenge rewards and community access'],
            ['20%', 'Verified wellness and insurance directory partnerships'],
            ['20%', 'Accessibility testing, measurement, and programme delivery'],
          ].map(([value, label]) => (
            <p key={label}>
              <b>{value}</b>
              <span>{label}</span>
            </p>
          ))}
        </div>
      </section>
    </>
  )
}

function MedicineForm({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (data: Record<string, unknown>) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  return (
    <FormModal title="Add medicine" eyebrow="Medicine organisation" onClose={onClose}>
      <form
        className="data-form"
        onSubmit={async (event) => {
          event.preventDefault()
          setSaving(true)
          setError('')
          const form = new FormData(event.currentTarget)
          try {
            await onSave({
              name: form.get('name'),
              dose: form.get('dose'),
              time: form.get('time'),
              frequency: form.get('frequency'),
              instructions: form.get('instructions'),
              purpose: form.get('purpose'),
              prescribingOrganization: form.get('organization'),
              stockRemaining: form.get('stock'),
              reminderEnabled: form.get('reminder') === 'on',
              active: true,
            })
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not save medicine.')
            setSaving(false)
          }
        }}
      >
        <div className="form-grid">
          <label>
            Medicine name
            <input name="name" required />
          </label>
          <label>
            Dose
            <input name="dose" required placeholder="e.g. 500 mg" />
          </label>
          <label>
            Time
            <input name="time" type="time" required />
          </label>
          <label>
            Frequency
            <input name="frequency" placeholder="e.g. Every day" />
          </label>
        </div>
        <label>
          Instructions
          <input name="instructions" placeholder="e.g. Take after food" />
        </label>
        <label>
          Purpose
          <input name="purpose" placeholder="What is it recorded for?" />
        </label>
        <div className="form-grid">
          <label>
            Prescribing organisation
            <input name="organization" />
          </label>
          <label>
            Stock remaining
            <input name="stock" type="number" min="0" />
          </label>
        </div>
        <label className="checkbox-label">
          <input name="reminder" type="checkbox" defaultChecked />
          <span>Enable medicine reminders</span>
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save medicine'}
          </button>
        </div>
      </form>
    </FormModal>
  )
}

function InsuranceForm({
  policy,
  onClose,
  onSave,
  onError,
}: {
  policy?: any
  onClose: () => void
  onSave: (data: Record<string, unknown>) => Promise<void>
  onError: (message: string) => void
}) {
  const [saving, setSaving] = useState(false)
  return (
    <FormModal
      title={policy ? 'Update insurance' : 'Add insurance'}
      eyebrow="Coverage and location"
      onClose={onClose}
    >
      <form
        className="data-form"
        onSubmit={async (event) => {
          event.preventDefault()
          setSaving(true)
          const form = new FormData(event.currentTarget)
          try {
            await onSave({
              insurer: form.get('insurer'),
              plan: form.get('plan'),
              policyholder: form.get('policyholder'),
              organization: form.get('organization'),
              networkName: form.get('networkName'),
              policyNumber: form.get('policyNumber'),
              memberId: form.get('memberId'),
              expiresAt: form.get('expiresAt'),
              insurerPhone: form.get('insurerPhone'),
              supportLocation: form.get('supportLocation'),
              networkNotes: form.get('networkNotes'),
              coveredEmirates: form.getAll('coveredEmirates'),
            })
          } catch (cause) {
            onError(cause instanceof Error ? cause.message : 'Could not save policy.')
            setSaving(false)
          }
        }}
      >
        <div className="form-grid">
          <label>
            Insurer
            <input name="insurer" defaultValue={policy?.insurer} required />
          </label>
          <label>
            Plan
            <input name="plan" defaultValue={policy?.plan} />
          </label>
          <label>
            Policyholder
            <input name="policyholder" defaultValue={policy?.policyholder} required />
          </label>
          <label>
            Organisation
            <input name="organization" defaultValue={policy?.organization} />
          </label>
          <label>
            Policy number
            <input name="policyNumber" defaultValue={policy?.policyNumber} required />
          </label>
          <label>
            Member ID
            <input name="memberId" defaultValue={policy?.memberId} />
          </label>
          <label>
            Network
            <input name="networkName" defaultValue={policy?.networkName} />
          </label>
          <label>
            Support location
            <input
              name="supportLocation"
              defaultValue={policy?.supportLocation}
              placeholder="Branch or emirate"
            />
          </label>
          <label>
            Support phone
            <input name="insurerPhone" defaultValue={policy?.insurerPhone} />
          </label>
          <label>
            Expiry date
            <input name="expiresAt" type="date" defaultValue={policy?.expiresAt?.slice(0, 10)} />
          </label>
        </div>
        <label>
          Covered emirate
          <select name="coveredEmirates" defaultValue={policy?.coveredEmirates?.[0] || 'dubai'}>
            <option value="abu-dhabi">Abu Dhabi</option>
            <option value="dubai">Dubai</option>
            <option value="sharjah">Sharjah</option>
            <option value="ajman">Ajman</option>
            <option value="ras-al-khaimah">Ras Al Khaimah</option>
            <option value="fujairah">Fujairah</option>
          </select>
        </label>
        <label>
          Network notes
          <textarea
            name="networkNotes"
            defaultValue={policy?.networkNotes}
            placeholder="Coverage, referral, or location notes"
          />
        </label>
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save policy'}
          </button>
        </div>
      </form>
    </FormModal>
  )
}

function ChallengeJoinForm({
  challenge,
  onClose,
  onSave,
}: {
  challenge: any
  onClose: () => void
  onSave: (data: Record<string, unknown>) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  return (
    <FormModal title="Join as a family" eyebrow={challenge.title} onClose={onClose}>
      <form
        className="data-form"
        onSubmit={async (event) => {
          event.preventDefault()
          setSaving(true)
          const form = new FormData(event.currentTarget)
          try {
            await onSave({
              displayName: form.get('displayName'),
              challenge: challenge.id,
              familyMembers: String(form.get('familyMembers') || '')
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean),
              progress: 0,
              streakDays: 0,
              status: 'active',
            })
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not join challenge.')
            setSaving(false)
          }
        }}
      >
        <label>
          Family name
          <input name="displayName" required placeholder="e.g. Hassan family" />
        </label>
        <label>
          Family member first names
          <input name="familyMembers" placeholder="Fatima, Omar, Mariam" />
          <small>Separate names with commas.</small>
        </label>
        <div className="challenge-consent">
          <Icon name="shield" />
          <p>
            Only names and challenge progress are saved. Health records are not shared with
            challenge participants.
          </p>
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Joining…' : 'Join challenge'}
          </button>
        </div>
      </form>
    </FormModal>
  )
}

function FormModal({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string
  eyebrow: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="modal-scrim"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
      >
        <div className="panel-head">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="form-modal-title">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function ExplanationExample() {
  return (
    <article className="explanation-card" aria-label="Example medical explanation">
      <header>
        <div>
          <p className="eyebrow">Fictional example · not your result</p>
          <h2>Complete blood count</h2>
        </div>
        <Status value="Review" />
      </header>
      <div className="explanation-grid">
        <section>
          <span>Original information</span>
          <b>Haemoglobin: 10.8 g/dL</b>
          <small>Printed reference range: 12.0–15.5 g/dL</small>
        </section>
        <section className="plain-language">
          <span>In simple language</span>
          <p>
            This number is below the range printed on this example report. The result alone does not
            explain the cause.
          </p>
        </section>
      </div>
      <div className="finding-row">
        <span className="finding-icon">!</span>
        <div>
          <b>Important finding</b>
          <p>Discuss this result with a qualified healthcare professional.</p>
        </div>
      </div>
      <div className="term-row">
        <b>Haemoglobin</b>
        <p>A protein in red blood cells that carries oxygen around the body.</p>
      </div>
      <div className="question-list">
        <span>Questions you could ask your doctor</span>
        <ul>
          <li>What could this result mean together with my symptoms and history?</li>
          <li>Do I need a repeat test or any follow-up?</li>
        </ul>
      </div>
      <footer>
        <span>
          <Icon name="shield" /> AI explanation, not a diagnosis
        </span>
        <button
          onClick={() =>
            navigator.clipboard.writeText('Questions for my doctor prepared by Hayat AI')
          }
        >
          <Icon name="copy" /> Copy questions
        </button>
        <button>
          <Icon name="volume" /> Read aloud
        </button>
      </footer>
    </article>
  )
}

function UploadModal({
  language,
  onClose,
  onComplete,
}: {
  language: string
  onClose: () => void
  onComplete: (document: any) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('Medical report')
  const [status, setStatus] = useState<'ready' | 'uploading' | 'processing'>('ready')
  const [progress, setProgress] = useState(0)
  const ar = language === 'ar'

  const selectFile = (nextFile?: File) => {
    if (!nextFile) return
    const accepted = ['application/pdf', 'image/jpeg', 'image/png'].includes(nextFile.type)
    if (!accepted || nextFile.size > 10 * 1024 * 1024) return
    setFile(nextFile)
  }

  const upload = () => {
    if (!file || status !== 'ready') return
    setStatus('uploading')
    let value = 0
    const interval = window.setInterval(() => {
      value += 14
      setProgress(Math.min(value, 100))
      if (value >= 100) {
        window.clearInterval(interval)
        setStatus('processing')
        window.setTimeout(() => {
          onComplete({
            id: `local-${Date.now()}`,
            title: file.name.replace(/\.[^.]+$/, ''),
            documentType: category,
            status: 'Local preview',
            createdAt: new Date().toISOString(),
          })
        }, 900)
      }
    }, 120)
  }

  return (
    <div
      className="modal-scrim"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
      >
        <div className="panel-head">
          <div>
            <p className="eyebrow">{ar ? 'مستند صحي جديد' : 'New health document'}</p>
            <h2 id="upload-title">{ar ? 'رفع مستند بأمان' : 'Upload securely'}</h2>
          </div>
          <button onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'}>
            <Icon name="close" />
          </button>
        </div>
        <p className="upload-intro">
          {ar
            ? 'اختر ملفاً واضحاً. راجع دائماً النص المستخرج قبل حفظ أي معلومة.'
            : 'Choose a clear file. Always review extracted text before saving any information.'}
        </p>
        <label
          className={`drop-zone ${file ? 'has-file' : ''}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            selectFile(event.dataTransfer.files[0])
          }}
        >
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
          <span className="upload-icon">
            <Icon name={file ? 'check' : 'file'} size={24} />
          </span>
          {file ? (
            <>
              <b>{file.name}</b>
              <small>
                {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || 'File'}
              </small>
              <em>{ar ? 'انقر لاختيار ملف آخر' : 'Click to choose another file'}</em>
            </>
          ) : (
            <>
              <b>{ar ? 'اسحب الملف إلى هنا' : 'Drag and drop your file here'}</b>
              <span>{ar ? 'أو انقر لتصفح جهازك' : 'or click to browse your device'}</span>
              <small>PDF, JPG or PNG · maximum 10 MB</small>
            </>
          )}
        </label>
        <label className="upload-category">
          <span>{ar ? 'نوع المستند' : 'Document category'}</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={status !== 'ready'}
          >
            <option value="Blood test">{ar ? 'فحص دم' : 'Blood test'}</option>
            <option value="Medical report">{ar ? 'تقرير طبي' : 'Medical report'}</option>
            <option value="Prescription">{ar ? 'وصفة طبية' : 'Prescription'}</option>
            <option value="Discharge summary">{ar ? 'ملخص خروج' : 'Discharge summary'}</option>
            <option value="Insurance">{ar ? 'تأمين' : 'Insurance'}</option>
          </select>
        </label>
        {status !== 'ready' && (
          <div className="upload-progress" aria-live="polite">
            <div>
              <b>
                {status === 'uploading'
                  ? ar
                    ? 'جارٍ الرفع…'
                    : 'Uploading…'
                  : ar
                    ? 'جارٍ تجهيز المعاينة…'
                    : 'Preparing preview…'}
              </b>
              <span>
                {status === 'uploading' ? `${progress}%` : ar ? 'لحظات قليلة' : 'A few moments'}
              </span>
            </div>
            <span className="progress-track">
              <span style={{ width: `${status === 'processing' ? 100 : progress}%` }} />
            </span>
            <small>
              {ar
                ? 'لا تغلق هذه النافذة أثناء المعالجة.'
                : 'Keep this window open while the file is processed.'}
            </small>
          </div>
        )}
        <div className="upload-privacy">
          <Icon name="about" />
          <span>
            <b>{ar ? 'معاينة محلية فقط' : 'Local preview only'}</b>
            {ar
              ? ' لم يتم توصيل حفظ الملفات الآمن بعد، لذلك لن يتم رفع هذا الملف أو حفظه.'
              : ' Secure file storage is not connected yet, so this file will not be uploaded or saved.'}
          </span>
        </div>
        <footer>
          <button className="secondary-button" onClick={onClose} disabled={status !== 'ready'}>
            {ar ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            className="primary-button"
            onClick={upload}
            disabled={!file || status !== 'ready'}
          >
            {status === 'ready'
              ? ar
                ? 'إعداد المعاينة'
                : 'Prepare preview'
              : ar
                ? 'جارٍ المعالجة…'
                : 'Processing…'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function DashboardCard({
  title,
  action,
  href,
  children,
  tone,
}: {
  title: string
  action?: string
  href?: string
  children: ReactNode
  tone?: string
}) {
  return (
    <section className={`dashboard-card ${tone || ''}`}>
      <header>
        <h2>{title}</h2>
        {action && href && <Link href={href}>{action}</Link>}
      </header>
      <div>{children}</div>
    </section>
  )
}
function Empty({
  text,
  action,
  href,
  onClick,
  compact,
}: {
  text: string
  action: string
  href?: string
  onClick?: () => void
  compact?: boolean
}) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      <span>
        <Icon name="plus" />
      </span>
      <b>{text}</b>
      {href ? <Link href={href}>{action}</Link> : <button onClick={onClick}>{action}</button>}
    </div>
  )
}
function LoadingState() {
  return (
    <div className="loading-state">
      <span />
      <h1>Loading your health information…</h1>
      <p>Your private records are being prepared.</p>
    </div>
  )
}
function ErrorState() {
  return (
    <div className="empty-state">
      <b>Something went wrong</b>
      <button onClick={() => location.reload()}>Retry</button>
    </div>
  )
}
function Status({ value }: { value: string }) {
  return <span className={`status ${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}
function TwoColumn({
  title,
  button,
  onClick,
  items,
}: {
  title: string
  button: string
  onClick: () => void
  items: string[]
}) {
  return (
    <div className="two-column">
      <div className="table-card">
        <div className="section-title">
          <h2>{title}</h2>
          <button onClick={onClick}>{button}</button>
        </div>
        {items.map((x) => (
          <div className="list-row" key={x}>
            <Icon name="pill" />
            <b>{x}</b>
            <Toggle value={true} setValue={() => {}} />
          </div>
        ))}
      </div>
      <aside>
        <h2>Notifications</h2>
        <p>Enable browser notifications to receive medicine reminders.</p>
        <button onClick={onClick}>Enable notifications</button>
      </aside>
    </div>
  )
}
function CalendarView({ data, setToast }: { data: PatientData; setToast: (v: string) => void }) {
  const appointment = data.appointments[0]
  const monthLabel = new Date().toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })
  return (
    <div className="two-column">
      <div className="calendar-card">
        <div className="calendar-head">
          <button>‹</button>
          <h2>{monthLabel}</h2>
          <button>›</button>
        </div>
        <div className="calendar-grid">
          {[
            'S',
            'M',
            'T',
            'W',
            'T',
            'F',
            'S',
            ...Array.from({ length: 30 }, (_, i) => String(i + 1)),
          ].map((x, i) => (
            <span className={x === '3' ? 'selected' : ''} key={i}>
              {x}
            </span>
          ))}
        </div>
      </div>
      <aside>
        <h2>Upcoming appointment</h2>
        {appointment ? (
          <div className="mini-appointment">
            <b>{appointment.time || 'Time to confirm'}</b>
            <span>{appointment.providerName || 'Provider to confirm'}</span>
            <small>{appointment.facilityName || 'Facility to confirm'}</small>
            <Status value={appointment.status || 'Upcoming'} />
          </div>
        ) : (
          <p className="muted">No upcoming appointments saved.</p>
        )}
        <button onClick={() => setToast('Appointment entry is not connected yet')}>
          Add appointment
        </button>
      </aside>
    </div>
  )
}
function Insurance({
  data,
  setToast,
  saveResource,
}: {
  data: PatientData
  setToast: (v: string) => void
  saveResource: SaveResource
}) {
  const policy = data.policies[0]
  const [formOpen, setFormOpen] = useState(false)
  return (
    <>
      <div className="two-column">
        <div className="insurance-upload">
          <Icon name="shield" />
          <h2>Insurance organisation</h2>
          <p>Add policy, network, covered emirates, support location, and contact details.</p>
          <button onClick={() => setFormOpen(true)}>
            {policy ? 'Update policy' : 'Add policy details'}
          </button>
        </div>
        <aside>
          <h2>Saved policies</h2>
          {policy ? (
            <div className="saved-policy">
              <span className="notification-symbol">
                <Icon name="shield" />
              </span>
              <div>
                <b>{policy.insurer}</b>
                <p>{policy.plan || 'Plan name not listed'}</p>
                <small>
                  {policy.expiresAt
                    ? `Expires ${new Date(policy.expiresAt).toLocaleDateString()}`
                    : 'Expiry date not provided'}
                </small>
                {policy.networkName && <small>Network: {policy.networkName}</small>}
                {policy.supportLocation && <small>Support: {policy.supportLocation}</small>}
              </div>
              <Status value={policy.status || 'Active'} />
            </div>
          ) : (
            <Empty
              compact
              text="No policy saved"
              action="Add policy"
              onClick={() => setFormOpen(true)}
            />
          )}
        </aside>
      </div>
      {formOpen && (
        <InsuranceForm
          policy={policy}
          onClose={() => setFormOpen(false)}
          onSave={async (values) => {
            await saveResource({
              resource: 'insurance',
              data: values,
              operation: policy ? 'update' : 'create',
              id: policy?.id,
            })
            setFormOpen(false)
          }}
          onError={(message) => setToast(message)}
        />
      )}
    </>
  )
}
function Setting({
  label,
  description,
  children,
  danger,
}: {
  label: string
  description: string
  children: ReactNode
  danger?: boolean
}) {
  return (
    <div className={`setting-row ${danger ? 'danger-setting' : ''}`}>
      <div>
        <b>{label}</b>
        <p>{description}</p>
      </div>
      {children}
    </div>
  )
}
function Toggle({ value, setValue }: { value: boolean; setValue: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      className={`toggle ${value ? 'on' : ''}`}
      onClick={() => setValue(!value)}
    >
      <span />
    </button>
  )
}
