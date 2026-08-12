// Mock data for Chrysalis Bloom student portal.

export const student = {
  name: "Aarav Menon",
  firstName: "Aarav",
  photo: "",
  studentId: "CHV-2024-0921",
  admissionNumber: "ADM-14218",
  rollNo: "18",
  className: "Grade IX",
  section: "B",
  house: "Warriors" as const,
  dob: "2010-08-14",
  gender: "Male",
  bloodGroup: "O+",
  nationality: "Indian",
  contact: "+91 98450 12345",
  email: "aarav.menon@chvportal.in",
  motto: "Preparing children for the exam called LIFE.",
};

export const parents = {
  mother: {
    name: "Meera Menon",
    phone: "+91 98450 12310",
    email: "meera.menon@example.com",
    occupation: "Architect",
    employer: "Studio Verde",
  },
  father: {
    name: "Rahul Menon",
    phone: "+91 98450 12300",
    email: "rahul.menon@example.com",
    occupation: "Software Engineer",
  },
  address: "42, Palm Grove Layout, Whitefield, Bengaluru 560066",
};

export const emergency = {
  name: "Nikhil Menon",
  relation: "Uncle",
  phone: "+91 98800 41221",
};

export const transport = {
  route: "R-12",
  busNumber: "CHV-BUS-12",
  pickup: {
    location: "Palm Grove Gate 2",
    time: "07:12",
  },
  drop: {
    location: "Palm Grove Gate 2",
    time: "15:48",
  },
  driver: "Suresh Kumar",
  attendant: "Lakshmi R.",
  attendantContact: "+91 98800 91234",
  trackingUrl: "https://satcop.online/jsp/quickview.jsp?param=MTQxMjE4JlNjaG9vbEJ1cyZFTg==",
};

export const academic = {
  firstLanguage: "English",
  secondLanguage: "Hindi",
  thirdLanguage: "Kannada",
  sports: "Basketball",
  optional: "Coding Club",
};

export type Notice = {
  id: string;
  title: string;
  snippet: string;
  body: string;
  category: "General" | "Academic" | "Events" | "Urgent";
  postedBy: string;
  date: string;
  pinned?: boolean;
  isNew?: boolean;
  attachments?: { name: string; type: "pdf" | "image" }[];
};

export const notices: Notice[] = [
  {
    id: "n1",
    title: "Annual Sports Day — 12th July",
    snippet: "All students to report by 7:30 AM in house-colour uniform. Parents welcome.",
    body: "Chrysalis High's Annual Sports Day will be held on 12th July at the main ground. All students must report by 7:30 AM in their house-colour uniform. Parents are welcome from 8:00 AM. Refreshments will be arranged.",
    category: "Events",
    postedBy: "Principal's Office",
    date: "2026-07-03",
    pinned: true,
    isNew: true,
    attachments: [{ name: "sports-day-schedule.pdf", type: "pdf" }],
  },
  {
    id: "n2",
    title: "Mid-term Exam Timetable Released",
    snippet: "Grades VI–X mid-term exams begin 22nd July. Timetable attached.",
    body: "Please find attached the mid-term exam timetable for Grades VI–X. Exams begin 22nd July.",
    category: "Academic",
    postedBy: "Academic Coordinator",
    date: "2026-07-02",
    pinned: true,
    attachments: [{ name: "midterm-timetable.pdf", type: "pdf" }],
  },
  {
    id: "n3",
    title: "Cafeteria menu — July",
    snippet: "The updated monthly cafeteria menu is now available under Cafeteria.",
    body: "The July cafeteria menu has been uploaded. Please review dietary options.",
    category: "General",
    postedBy: "Admin Office",
    date: "2026-07-01",
    isNew: true,
  },
  {
    id: "n4",
    title: "Bus route R-12 timing revised",
    snippet: "Pickup time from Palm Grove Gate 2 revised to 07:12.",
    body: "Effective 5th July, bus route R-12 pickup time from Palm Grove Gate 2 has been revised to 07:12.",
    category: "Urgent",
    postedBy: "Transport Office",
    date: "2026-06-30",
  },
  {
    id: "n5",
    title: "Library Week — activities schedule",
    snippet: "Book quizzes, author talks, and story-telling sessions all week.",
    body: "Library Week runs from 8th–12th July with quizzes, author talks, and story-telling.",
    category: "Events",
    postedBy: "Librarian",
    date: "2026-06-28",
  },
];

export type Homework = {
  id: string;
  subject: string;
  teacher: string;
  title: string;
  description: string;
  due: string;
  status: "pending" | "submitted";
  attachments?: string[];
};

export const homework: Homework[] = [
  { id: "h1", subject: "Mathematics", teacher: "Ms. Priya Rao", title: "Quadratic Equations — Exercise 4.3", description: "Solve problems 1–15 from Exercise 4.3.", due: "2026-07-05", status: "pending", attachments: ["exercise-4.3.pdf"] },
  { id: "h2", subject: "Science", teacher: "Mr. Arjun Nair", title: "Light — Reflection Lab Report", description: "Submit lab report on reflection experiment.", due: "2026-07-06", status: "pending" },
  { id: "h3", subject: "English", teacher: "Mrs. Farah Sheikh", title: "The Merchant of Venice — Act I summary", description: "Write a 300-word summary of Act I.", due: "2026-07-08", status: "pending" },
  { id: "h4", subject: "Social Studies", teacher: "Mr. Rajeev Kumar", title: "French Revolution — Map work", description: "Complete the map work on pages 42–43.", due: "2026-07-02", status: "submitted" },
  { id: "h5", subject: "Hindi", teacher: "Mrs. Sunita Sharma", title: "अभ्यास पाठ 4", description: "पाठ 4 का सम्पूर्ण अभ्यास।", due: "2026-06-30", status: "submitted" },
];

export const attendance = {
  overall: 94,
  monthly: [
    { month: "Jan", present: 20, absent: 1, late: 1 },
    { month: "Feb", present: 18, absent: 2, late: 0 },
    { month: "Mar", present: 21, absent: 0, late: 1 },
    { month: "Apr", present: 19, absent: 1, late: 0 },
    { month: "May", present: 22, absent: 0, late: 0 },
    { month: "Jun", present: 20, absent: 2, late: 1 },
    { month: "Jul", present: 3, absent: 0, late: 0 },
  ],
};

export const subjects = [
  { name: "Mathematics", teacher: "Ms. Priya Rao", covered: 7, total: 12, resources: 14 },
  { name: "Science", teacher: "Mr. Arjun Nair", covered: 5, total: 10, resources: 9 },
  { name: "English", teacher: "Mrs. Farah Sheikh", covered: 6, total: 11, resources: 12 },
  { name: "Social Studies", teacher: "Mr. Rajeev Kumar", covered: 4, total: 9, resources: 7 },
  { name: "Hindi", teacher: "Mrs. Sunita Sharma", covered: 5, total: 8, resources: 6 },
  { name: "Computer Science", teacher: "Mr. Vikram Iyer", covered: 3, total: 7, resources: 11 },
];

export const reportCards = [
  { id: "rc1", term: "Term 2", year: "2025–26", status: "Available", releaseDate: "2026-03-28" },
  { id: "rc2", term: "Term 1", year: "2025–26", status: "Available", releaseDate: "2025-10-12" },
  { id: "rc3", term: "Term 3", year: "2025–26", status: "Coming Soon", releaseDate: "" },
];

export const fees = {
  total: 148000,
  paid: 111000,
  outstanding: 37000,
  history: [
    { id: "f1", label: "Term 1 tuition", amount: 55000, date: "2025-06-05", status: "Paid" as const },
    { id: "f2", label: "Term 2 tuition", amount: 56000, date: "2025-11-08", status: "Paid" as const },
    { id: "f3", label: "Transport — H1", amount: 12000, date: "2025-07-02", status: "Paid" as const },
    { id: "f4", label: "Term 3 tuition", amount: 37000, date: "2026-08-01", status: "Due" as const },
  ],
};

export const documents = {
  "Bonafide Certificates": [
    { id: "d1", name: "Bonafide — Feb 2026.pdf", date: "2026-02-18" },
  ],
  "Fee Receipts": [
    { id: "d2", name: "Receipt Term 2 tuition.pdf", date: "2025-11-08" },
    { id: "d3", name: "Receipt Term 1 tuition.pdf", date: "2025-06-05" },
  ],
  "Circulars": [
    { id: "d4", name: "Sports Day 2026.pdf", date: "2026-07-01" },
    { id: "d5", name: "Mid-term timetable.pdf", date: "2026-07-02" },
  ],
  "Permission Letters": [
    { id: "d6", name: "Field trip — Museum.pdf", date: "2026-06-20" },
  ],
  "Other": [
    { id: "d7", name: "School diary policy.pdf", date: "2026-04-11" },
  ],
};

export const events = [
  { id: "e1", date: "2026-07-05", title: "Mathematics — Ch. 4 quiz", type: "exam" as const },
  { id: "e2", date: "2026-07-08", title: "Library Week talk", type: "event" as const },
  { id: "e3", date: "2026-07-12", title: "Annual Sports Day", type: "event" as const },
  { id: "e4", date: "2026-07-15", title: "Mid-term begins", type: "exam" as const },
  { id: "e5", date: "2026-07-22", title: "PTM", type: "event" as const },
];

export const gallery = [
  { id: "g1", title: "Founder's Day 2025", cover: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800", count: 42, date: "2025-11-14" },
  { id: "g2", title: "Inter-house Basketball", cover: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800", count: 28, date: "2026-01-22" },
  { id: "g3", title: "Science Exhibition", cover: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800", count: 54, date: "2026-02-05" },
  { id: "g4", title: "Republic Day", cover: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=800", count: 33, date: "2026-01-26" },
];

export const cafeteria = {
  month: "July 2026",
  uploaded: "2026-06-30",
  file: "Cafeteria-Menu-July-2026.pdf",
  history: [
    { month: "June 2026", file: "Cafeteria-Menu-June-2026.pdf" },
    { month: "May 2026", file: "Cafeteria-Menu-May-2026.pdf" },
    { month: "April 2026", file: "Cafeteria-Menu-April-2026.pdf" },
  ],
};

export const achievements = [
  { id: "a1", title: "Class Topper — Term 1", year: "2025" },
  { id: "a2", title: "Best in Basketball", year: "2025" },
  { id: "a3", title: "Silver — Math Olympiad", year: "2024" },
  { id: "a4", title: "Perfect Attendance", year: "2024" },
];
