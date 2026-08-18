/**
 * Centralized school content.
 * NOTE: Items marked PLACEHOLDER must be replaced with official
 * information supplied by the client before launch.
 */

export const school = {
  name: "Maxfem International School",
  shortName: "Maxfem",
  tagline: "Empowering Future Leaders Through Excellence in Education",
  intro:
    "Maxfem International School provides a nurturing, academically rigorous environment designed to prepare students for a changing world.",
  // PLACEHOLDER contact details — replace with official details.
  contact: {
    addressLines: ["School address line 1 (placeholder)", "City, State, Country"],
    phone: "+000 000 0000",
    email: "info@maxfem.example",
    officeHours: "Monday – Friday, 8:00am – 4:00pm",
  },
};

export const mainNav = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Academics", to: "/academics" },
  { label: "Admissions", to: "/admissions" },
  { label: "Facilities", to: "/facilities" },
  { label: "News & Events", to: "/news" },
  { label: "Gallery", to: "/gallery" },
  { label: "Contact", to: "/contact" },
] as const;

export const highlights = [
  {
    icon: "GraduationCap",
    title: "Academic Excellence",
    description: "A rigorous, well-structured curriculum that challenges every learner to grow.",
  },
  {
    icon: "Users",
    title: "Experienced Educators",
    description: "Teachers who mentor, guide and know each student personally.",
  },
  {
    icon: "Building2",
    title: "Modern Learning Environment",
    description: "Purposeful spaces and resources that support focused, active learning.",
  },
  {
    icon: "Compass",
    title: "Student-Centered Education",
    description: "Learning shaped around individual strengths, pace and ambition.",
  },
  {
    icon: "Globe2",
    title: "Global Perspective",
    description: "An outlook that prepares students for study and work anywhere.",
  },
  {
    icon: "ShieldCheck",
    title: "Safe & Supportive Community",
    description: "A secure, respectful environment where wellbeing comes first.",
  },
] as const;

export const values = [
  {
    title: "Mission",
    body: "PLACEHOLDER — official mission statement to be supplied by the school.",
  },
  {
    title: "Vision",
    body: "PLACEHOLDER — official vision statement to be supplied by the school.",
  },
  {
    title: "Core Values",
    body: "Integrity, curiosity, discipline, respect and service. PLACEHOLDER — to be confirmed.",
  },
  {
    title: "Educational Philosophy",
    body: "We believe learning thrives where high expectations meet genuine care. PLACEHOLDER — to be confirmed.",
  },
];

export const academics = [
  {
    title: "Early Years",
    description:
      "Foundational learning through structured play, language and early numeracy. PLACEHOLDER curriculum detail.",
    icon: "Blocks",
  },
  {
    title: "Primary Education",
    description:
      "Core literacy, numeracy and enquiry skills within a broad, balanced programme. PLACEHOLDER curriculum detail.",
    icon: "BookOpen",
  },
  {
    title: "Secondary Education",
    description:
      "Subject specialism, academic depth and preparation for further study. PLACEHOLDER curriculum detail.",
    icon: "GraduationCap",
  },
  {
    title: "STEM & Sciences",
    description:
      "Practical, laboratory-based science, mathematics and engineering thinking. PLACEHOLDER curriculum detail.",
    icon: "FlaskConical",
  },
  {
    title: "Arts & Humanities",
    description:
      "Languages, literature, history and creative arts that build expression. PLACEHOLDER curriculum detail.",
    icon: "Palette",
  },
  {
    title: "Digital & Technology",
    description:
      "Computing, digital literacy and responsible use of technology. PLACEHOLDER curriculum detail.",
    icon: "Laptop",
  },
] as const;

export const whyChoose = [
  { title: "Personalized Learning", icon: "UserRoundCheck" },
  { title: "Academic Excellence", icon: "Award" },
  { title: "Character Development", icon: "HeartHandshake" },
  { title: "Technology-Enhanced Learning", icon: "MonitorSmartphone" },
  { title: "Leadership Development", icon: "Flag" },
  { title: "Extracurricular Opportunities", icon: "Trophy" },
  { title: "Safe Learning Environment", icon: "ShieldCheck" },
  { title: "Global-Minded Education", icon: "Globe2" },
] as const;

export const schoolLife = [
  {
    title: "Clubs & Societies",
    description: "Student-led interest groups across academics, service and creativity.",
  },
  {
    title: "Sports",
    description: "Team and individual sport supporting fitness, discipline and teamwork.",
  },
  {
    title: "Cultural Activities",
    description: "Music, drama and cultural celebrations across the school year.",
  },
  {
    title: "Leadership",
    description: "Prefect and council roles that build responsibility and voice.",
  },
  {
    title: "Competitions",
    description: "Academic and creative competitions that stretch student ability.",
  },
  {
    title: "Community Engagement",
    description: "Service initiatives connecting students with the wider community.",
  },
];

export const news = [
  {
    slug: "sample-news-1",
    title: "Sample news article title",
    excerpt:
      "PLACEHOLDER article summary. Replace with real school news once the content system is connected.",
    date: "2026-08-10",
    category: "School News",
  },
  {
    slug: "sample-news-2",
    title: "Second sample news article",
    excerpt: "PLACEHOLDER article summary for demonstration of the news card layout.",
    date: "2026-07-28",
    category: "Announcement",
  },
  {
    slug: "sample-news-3",
    title: "Third sample news article",
    excerpt: "PLACEHOLDER article summary for demonstration of the news card layout.",
    date: "2026-07-15",
    category: "Academics",
  },
];

export const events = [
  {
    slug: "sample-event-1",
    title: "Open Day (sample event)",
    date: "2026-09-12",
    time: "10:00 – 13:00",
    location: "Main Campus (placeholder)",
    description: "PLACEHOLDER event description to be replaced with official event details.",
  },
  {
    slug: "sample-event-2",
    title: "Parent–Teacher Conference (sample event)",
    date: "2026-10-03",
    time: "09:00 – 15:00",
    location: "Assembly Hall (placeholder)",
    description: "PLACEHOLDER event description to be replaced with official event details.",
  },
  {
    slug: "sample-event-3",
    title: "Inter-House Sports Day (sample event)",
    date: "2026-11-14",
    time: "08:30 – 16:00",
    location: "Sports Field (placeholder)",
    description: "PLACEHOLDER event description to be replaced with official event details.",
  },
];

export const testimonials = [
  {
    quote:
      "SAMPLE PLACEHOLDER quote. Real parent and student testimonials will be added once collected.",
    name: "Parent name",
    role: "Parent (sample placeholder)",
  },
  {
    quote:
      "SAMPLE PLACEHOLDER quote. Real parent and student testimonials will be added once collected.",
    name: "Student name",
    role: "Student (sample placeholder)",
  },
  {
    quote:
      "SAMPLE PLACEHOLDER quote. Real parent and student testimonials will be added once collected.",
    name: "Alumni name",
    role: "Alumni (sample placeholder)",
  },
];
