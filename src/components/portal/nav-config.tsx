import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  CalendarCheck,
  Calendar,
  FileText,
  Wallet,
  FolderOpen,
  Images,
  User,
  Settings,
  Utensils,
  Bus,
  GraduationCap,
  Users,
  ClipboardList,
  School,
  BarChart3,
  Clock,
  ClipboardCheck,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };

export const studentNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/noticeboard", label: "Noticeboard", icon: Megaphone },
  { to: "/homework", label: "Homework", icon: BookOpen },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/timetable", label: "Timetable", icon: Clock },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/academics", label: "Academics", icon: GraduationCap },
  { to: "/report-cards", label: "Report Cards", icon: FileText },
  { to: "/diary", label: "Diary", icon: NotebookPen },
  { to: "/fees", label: "Fee Details", icon: Wallet },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/gallery", label: "Gallery", icon: Images },
  { to: "/cafeteria", label: "Cafeteria", icon: Utensils },
  { to: "/bus", label: "Bus Tracking", icon: Bus },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const dockNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/homework", label: "Homework", icon: BookOpen },
  { to: "/attendance", label: "Attend", icon: CalendarCheck },
  { to: "/diary", label: "Diary", icon: NotebookPen },
  { to: "/profile", label: "Profile", icon: User },
];

export const teacherNav: NavItem[] = [
  { to: "/teacher-portal", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher-portal/classes", label: "Classes", icon: School },
  { to: "/teacher-portal/homework", label: "Homework", icon: BookOpen },
  { to: "/teacher-portal/planner", label: "Academic Planner", icon: ClipboardList },
  { to: "/teacher-portal/pupa", label: "PUPA Reports", icon: BarChart3 },
  { to: "/teacher-portal/attendance", label: "Class Attendance", icon: CalendarCheck },
  { to: "/teacher-portal/my-attendance", label: "My Attendance", icon: Clock },
  { to: "/teacher-portal/regularization", label: "Regularization", icon: ClipboardCheck },
  { to: "/teacher-portal/students", label: "Students", icon: Users },
  { to: "/teacher-portal/notices", label: "Notices", icon: Megaphone },
  { to: "/teacher-portal/timetable", label: "Timetable", icon: Clock },
  { to: "/teacher-portal/calendar", label: "Calendar", icon: Calendar },
  { to: "/teacher-portal/profile", label: "Profile", icon: User },
];


export const teacherDockNav: NavItem[] = [
  { to: "/teacher-portal", label: "Home", icon: LayoutDashboard },
  { to: "/teacher-portal/homework", label: "Homework", icon: BookOpen },
  { to: "/teacher-portal/attendance", label: "Attend", icon: CalendarCheck },
  { to: "/teacher-portal/notices", label: "Notices", icon: Megaphone },
  { to: "/teacher-portal/profile", label: "Me", icon: User },
];

export const staffNav: NavItem[] = [
  { to: "/staff-portal", label: "Dashboard", icon: LayoutDashboard },
  { to: "/staff-portal/students", label: "Students", icon: Users },
  { to: "/staff-portal/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/staff-portal/classes", label: "Classes", icon: School },
  { to: "/staff-portal/attendance", label: "Student Attendance", icon: CalendarCheck },
  { to: "/staff-portal/teacher-attendance", label: "Teacher Attendance", icon: Clock },
  { to: "/staff-portal/regularization", label: "Regularization", icon: ClipboardCheck },
  { to: "/staff-portal/homework", label: "Homework", icon: BookOpen },
  { to: "/staff-portal/notices", label: "Notices", icon: Megaphone },
  { to: "/staff-portal/timetable", label: "Timetable", icon: Clock },
  { to: "/staff-portal/profile", label: "Profile", icon: User },
];

export const staffDockNav: NavItem[] = [
  { to: "/staff-portal", label: "Home", icon: LayoutDashboard },
  { to: "/staff-portal/students", label: "Students", icon: Users },
  { to: "/staff-portal/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/staff-portal/notices", label: "Notices", icon: Megaphone },
  { to: "/staff-portal/profile", label: "Me", icon: User },
];
