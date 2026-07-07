"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  CalendarRange,
  Target,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
  RefreshCw,
  Info,
  Pin,
  Trash2,
  Edit2,
  Save,
  Download,
  Bell,
  BookOpen,
  Heart,
  Code,
  Compass,
  Languages,
  Flame,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play
} from "lucide-react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

interface StudyPlan {
  id: string;
  title: string;
  prompt: {
    examDate: string;
    subjects: string;
    studyHours: string;
    targetScore: string;
    weakTopics: string;
  };
  generatedText: {
    weeklyPlan: any[];
    dailySessions: any[];
  };
  createdAt: string;
  pinned: boolean;
  progress?: {
    completedTasks: Record<string, boolean>;
    completedTaskDates: Record<string, string>;
  };
}

interface Reminder {
  id: string;
  planId: string;
  planTitle: string;
  dateTime: string;
  fired: boolean;
}

const templates = [
  {
    title: "JEE Prep",
    icon: BookOpen,
    color: "from-blue-600/20 to-indigo-600/20 text-indigo-300 border-indigo-500/35 hover:border-indigo-400",
    prompt: {
      subjects: "Physics (Mechanics, Electromagnetism), Chemistry (Organic, Physical), Mathematics (Calculus, Algebra)",
      weakTopics: "Rotational Dynamics, Ionic Equilibrium, Coordinate Geometry",
      targetScore: "99.5 Percentile",
      studyHours: "4",
      examWeeksAhead: 12
    }
  },
  {
    title: "NEET Prep",
    icon: Heart,
    color: "from-rose-600/20 to-pink-600/20 text-rose-300 border-rose-500/35 hover:border-rose-400",
    prompt: {
      subjects: "Biology (Genetics, Human Physiology), Chemistry (Organic, Inorganic), Physics (Optics, Thermodynamics)",
      weakTopics: "Genetics & Evolution, Chemical Bonding, Semi-conductors",
      targetScore: "680/720",
      studyHours: "4",
      examWeeksAhead: 10
    }
  },
  {
    title: "Coding Interview",
    icon: Code,
    color: "from-emerald-600/20 to-teal-600/20 text-teal-300 border-teal-500/35 hover:border-teal-400",
    prompt: {
      subjects: "Data Structures, Algorithms, System Design",
      weakTopics: "Dynamic Programming, Graph Algorithms, System Design basics",
      targetScore: "FAANG Ready",
      studyHours: "3",
      examWeeksAhead: 8
    }
  },
  {
    title: "UPSC CSE",
    icon: Compass,
    color: "from-amber-600/20 to-orange-600/20 text-orange-300 border-orange-500/35 hover:border-orange-400",
    prompt: {
      subjects: "Indian History, Indian Polity, Geography, Economics, Current Affairs",
      weakTopics: "Modern Indian History, Indian Polity (Constitutional Bodies), Macroeconomics Concepts",
      targetScore: "Clear Cutoff (110+)",
      studyHours: "4",
      examWeeksAhead: 16
    }
  },
  {
    title: "Language",
    icon: Languages,
    color: "from-purple-600/20 to-fuchsia-600/20 text-purple-300 border-purple-500/35 hover:border-purple-400",
    prompt: {
      subjects: "Vocabulary building, Grammar conjugation, Speaking practice, Listening comprehension",
      weakTopics: "Subjunctive mood verbs, Pronunciation / Accent, Listening speed (fast speech)",
      targetScore: "B2 Proficiency",
      studyHours: "2",
      examWeeksAhead: 6
    }
  },
  {
    title: "Gym & Strength",
    icon: Flame,
    color: "from-pink-600/20 to-rose-600/20 text-pink-300 border-pink-500/35 hover:border-pink-400",
    prompt: {
      subjects: "Strength training, Progressive overload, Nutrition, Cardiovascular health",
      weakTopics: "Squats/Deadlifts form correctness, Macro-tracking consistency",
      targetScore: "10% Body Fat / Muscle Gain",
      studyHours: "1",
      examWeeksAhead: 4
    }
  }
];

export default function PlannerPage() {
  // Input form states
  const [examDate, setExamDate] = useState("2026-07-20");
  const [subjects, setSubjects] = useState("Calculus II, Organic Chemistry, Physics Mechanics");
  const [studyHours, setStudyHours] = useState("3");
  const [targetScore, setTargetScore] = useState("95%");
  const [weakTopics, setWeakTopics] = useState("Integration by parts, Aromatic reactions, Fluid dynamics");

  // Planner engine status
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState("weekly");

  // Missed sessions / Rescheduling state
  const [missedAlert, setMissedAlert] = useState(true);
  const [reschedulingDone, setReschedulingDone] = useState(false);

  // LocalStorage Plans and Reminders State
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<string>("default");

  // Collapsible sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const generationSteps = [
    "Analyzing exam parameters...",
    "Dividing syllabus into daily micro-modules...",
    "Integrating spaced repetition review intervals...",
    "Balancing difficulty curves and breaks...",
    "Finalizing StudyForge Schedule..."
  ];

  const [errorMessage, setErrorMessage] = useState("");

  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [dailySessions, setDailySessions] = useState<any[]>([]);

  // Calculate Streak Helper
  const calculateStreak = (completedDates: string[]): number => {
    if (!completedDates || completedDates.length === 0) return 0;
    const uniqueDates = Array.from(new Set(completedDates)).sort();
    let streak = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let checkDate = new Date();
    if (uniqueDates.includes(todayStr)) {
      // start from today
    } else if (uniqueDates.includes(yesterdayStr)) {
      // start from yesterday
      checkDate = yesterday;
    } else {
      return 0;
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Load plans & reminders from LocalStorage on mount
  useEffect(() => {
    const storedPlans = localStorage.getItem("studyforge_plans");
    const storedReminders = localStorage.getItem("studyforge_reminders");

    if (storedReminders) {
      setReminders(JSON.parse(storedReminders));
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
    }

    if (storedPlans) {
      const parsed = JSON.parse(storedPlans);
      setPlans(parsed);
      if (parsed.length > 0) {
        const initialPlan = parsed[0];
        loadPlan(initialPlan);
      }
    } else {
      // Save initial mock plan as starting history
      const initialMock: StudyPlan = {
        id: "mock-initial",
        title: "Calculus & Organic Chemistry Prep",
        prompt: {
          examDate: "2026-07-20",
          subjects: "Calculus II, Organic Chemistry, Physics Mechanics",
          studyHours: "3",
          targetScore: "95%",
          weakTopics: "Integration by parts, Aromatic reactions, Fluid dynamics"
        },
        generatedText: {
          weeklyPlan: [
            { day: "Monday", sessions: [{ time: "09:00 AM", title: "Calculus: Integration by Parts (Weak Area Focus)", type: "Core Study", dur: "90m" }, { time: "02:00 PM", title: "Chemistry: Aromatic Rings", type: "Recap", dur: "60m" }] },
            { day: "Tuesday", sessions: [{ time: "10:00 AM", title: "Physics: Fluid Dynamics Practice Problems", type: "Core Study", dur: "90m" }, { time: "04:00 PM", title: "Active Recall: Quiz 1", type: "Review", dur: "45m" }] },
            { day: "Wednesday", sessions: [{ time: "09:00 AM", title: "Chemistry: Nucleophilic Substitution", type: "Core Study", dur: "90m" }, { time: "03:00 PM", title: "Calculus: Spaced Repetition Review", type: "Spaced Repet", dur: "60m" }] },
            { day: "Thursday", sessions: [{ time: "11:00 AM", title: "Physics: Fluids & Pressure Equations", type: "Core Study", dur: "90m" }, { time: "02:00 PM", title: "Calculus: Integration Practice", type: "Practice", dur: "60m" }] },
            { day: "Friday", sessions: [{ time: "09:00 AM", title: "Calculus & Chemistry Cross-Quiz", type: "Exam Prep", dur: "120m" }, { time: "04:00 PM", title: "Weekly progress audit & breakdown", type: "Audit", dur: "30m" }] }
          ],
          dailySessions: [
            { time: "09:00 AM - 10:30 AM", title: "Calculus: Integration by Parts (Weak Area Focus)", desc: "Solve 15 integration by parts problems. Focus on trigonometry multipliers.", subject: "Calculus", type: "Core Study", status: "Due" },
            { time: "10:30 AM - 10:45 AM", title: "Mindfulness Break (AI Recommendation)", desc: "Stretch, hydrate, and look away from screen.", subject: "Break", type: "AI Break", status: "Rest" },
            { time: "02:00 PM - 03:00 PM", title: "Chemistry: Aromatic Compounds Review", desc: "Active recall flashcards for benzene reactions.", subject: "Chemistry", type: "Review", status: "Due" }
          ]
        },
        createdAt: new Date().toISOString(),
        pinned: false,
        progress: {
          completedTasks: {},
          completedTaskDates: {}
        }
      };
      setPlans([initialMock]);
      loadPlan(initialMock);
      localStorage.setItem("studyforge_plans", JSON.stringify([initialMock]));
    }
  }, []);

  // Background reminder checker
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem("studyforge_reminders");
      if (!stored) return;
      const currentReminders: Reminder[] = JSON.parse(stored);
      let updated = false;
      const now = new Date().getTime();

      currentReminders.forEach((rem) => {
        if (!rem.fired && new Date(rem.dateTime).getTime() <= now) {
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification(`Time to study: ${rem.planTitle}`, {
                body: "Your StudyForge session is scheduled now! Keep up the hard work.",
                icon: "/favicon.ico"
              });
            }
          }
          rem.fired = true;
          updated = true;
          toast.success(`Study Reminder: ${rem.planTitle} starts now!`, { icon: "🔥", duration: 6000 });
        }
      });

      if (updated) {
        localStorage.setItem("studyforge_reminders", JSON.stringify(currentReminders));
        setReminders(currentReminders);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadPlan = (plan: StudyPlan) => {
    setActivePlanId(plan.id);
    setExamDate(plan.prompt.examDate);
    setSubjects(plan.prompt.subjects);
    setStudyHours(plan.prompt.studyHours);
    setTargetScore(plan.prompt.targetScore);
    setWeakTopics(plan.prompt.weakTopics);
    setWeeklyPlan(plan.generatedText.weeklyPlan);
    setDailySessions(plan.generatedText.dailySessions);
    setPlanGenerated(true);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPlanGenerated(false);
    setErrorMessage("");
    setStepIndex(0);

    // Animate generation steps simulation
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < generationSteps.length) {
        setStepIndex(currentStep);
      }
    }, 400);

    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examDate,
          subjects,
          studyHours,
          targetScore,
          weakTopics,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate study plan from Gemini.");
      }

      if (data.weeklyPlan && data.dailySessions) {
        const newPlanId = data.planId || `plan-${Date.now()}`;
        const newPlan: StudyPlan = {
          id: newPlanId,
          title: `${subjects.split(",")[0]} prep — Exam on ${examDate}`,
          prompt: {
            examDate,
            subjects,
            studyHours,
            targetScore,
            weakTopics
          },
          generatedText: {
            weeklyPlan: data.weeklyPlan,
            dailySessions: data.dailySessions
          },
          createdAt: new Date().toISOString(),
          pinned: false,
          progress: {
            completedTasks: {},
            completedTaskDates: {}
          }
        };

        savePlanToHistory(newPlan);
        setWeeklyPlan(data.weeklyPlan);
        setDailySessions(data.dailySessions);
        setPlanGenerated(true);
        confetti({
          particleCount: 100,
          spread: 50,
          colors: ["#6366f1", "#a855f7", "#14b8a6"]
        });
        toast.success("AI Study Plan generated and saved to your history!");
      } else {
        throw new Error("Invalid plan structure received from AI planner.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to construct AI schedule.");
      toast.error(err.message || "Error generating plan.");
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  const savePlanToHistory = (newPlan: StudyPlan) => {
    setPlans(prevPlans => {
      // Evict oldest unpinned plan if size >= 10
      let updated = [newPlan, ...prevPlans.filter(p => p.id !== newPlan.id)];
      if (updated.length > 10) {
        let unpinnedIndex = -1;
        for (let i = updated.length - 1; i >= 0; i--) {
          if (!updated[i].pinned) {
            unpinnedIndex = i;
            break;
          }
        }
        if (unpinnedIndex !== -1) {
          updated.splice(unpinnedIndex, 1);
        } else {
          updated = updated.slice(0, 10);
        }
      }
      localStorage.setItem("studyforge_plans", JSON.stringify(updated));
      return updated;
    });
    setActivePlanId(newPlan.id);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p);
      localStorage.setItem("studyforge_plans", JSON.stringify(updated));
      return updated;
    });
    toast.success("Pin status updated!");
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlans(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem("studyforge_plans", JSON.stringify(updated));
      if (activePlanId === id) {
        if (updated.length > 0) {
          loadPlan(updated[0]);
        } else {
          setActivePlanId(null);
          setPlanGenerated(false);
        }
      }
      return updated;
    });
    toast.success("Plan deleted from history.");
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlanId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    setPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, title: editTitle } : p);
      localStorage.setItem("studyforge_plans", JSON.stringify(updated));
      return updated;
    });
    setEditingPlanId(null);
    toast.success("Plan renamed.");
  };

  const applyTemplate = (template: typeof templates[0]) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + template.prompt.examWeeksAhead * 7);

    setExamDate(futureDate.toISOString().split("T")[0]);
    setSubjects(template.prompt.subjects);
    setStudyHours(template.prompt.studyHours);
    setTargetScore(template.prompt.targetScore);
    setWeakTopics(template.prompt.weakTopics);
    toast.success(`Loaded ${template.title} Template!`);
  };

  const toggleTaskCompletion = (planId: string, taskId: string) => {
    setPlans(prev => {
      const updated = prev.map(p => {
        if (p.id !== planId) return p;

        const progress = p.progress || { completedTasks: {}, completedTaskDates: {} };
        const completedTasks = { ...progress.completedTasks };
        const completedTaskDates = { ...progress.completedTaskDates };

        const isCompleted = !completedTasks[taskId];
        completedTasks[taskId] = isCompleted;

        if (isCompleted) {
          completedTaskDates[taskId] = new Date().toISOString().split("T")[0];
        } else {
          delete completedTaskDates[taskId];
        }

        return {
          ...p,
          progress: {
            completedTasks,
            completedTaskDates
          }
        };
      });
      localStorage.setItem("studyforge_plans", JSON.stringify(updated));
      
      // If we updated the active plan, sync daily sessions list completion locally
      const activeObj = updated.find(p => p.id === planId);
      if (activeObj) {
        // Keep component state aligned
        // This makes UI update instantly
      }
      return updated;
    });
  };

  const handleReschedule = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setMissedAlert(false);
      setReschedulingDone(true);
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#14b8a6", "#10b981"]
      });
    }, 1500);
  };

  const activePlan = plans.find(p => p.id === activePlanId);
  const completedTasks = activePlan?.progress?.completedTasks || {};
  const completedTaskDates = activePlan?.progress?.completedTaskDates || {};

  // Calculate Streak & Completion
  const activeStreak = calculateStreak(Object.values(completedTaskDates));
  
  let totalTasksCount = 0;
  let completedTasksCount = 0;

  if (activePlan) {
    activePlan.generatedText.weeklyPlan.forEach((dayData: any) => {
      dayData.sessions.forEach((sess: any, sIdx: number) => {
        totalTasksCount++;
        const taskId = `weekly-${dayData.day}-${sIdx}`;
        if (completedTasks[taskId]) {
          completedTasksCount++;
        }
      });
    });
    activePlan.generatedText.dailySessions.forEach((sess: any, dIdx: number) => {
      totalTasksCount++;
      const taskId = `daily-${dIdx}`;
      if (completedTasks[taskId]) {
        completedTasksCount++;
      }
    });
  }

  const completionPercentage = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // jsPDF Download Generator
  const downloadPlanAsPDF = async () => {
    if (!activePlan) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      // Title
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 27, 75); // Dark Indigo
      doc.text(activePlan.title, 14, 22);

      // Meta parameters
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Created: ${new Date(activePlan.createdAt).toLocaleDateString()}`, 14, 30);
      doc.text(`Target Exam: ${activePlan.prompt.examDate} | Daily Target: ${activePlan.prompt.studyHours}h | Target Score: ${activePlan.prompt.targetScore}`, 14, 35);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 40, 196, 40);

      // Subjects & Weak Areas
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 27, 75);
      doc.text("Subjects to Study:", 14, 48);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const subjectsLines = doc.splitTextToSize(activePlan.prompt.subjects, 180);
      doc.text(subjectsLines, 14, 54);

      let currentY = 54 + (subjectsLines.length * 5) + 5;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 27, 75);
      doc.text("Focus / Weak Topics:", 14, currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const weakTopicsLines = doc.splitTextToSize(activePlan.prompt.weakTopics, 180);
      doc.text(weakTopicsLines, 14, currentY + 6);

      currentY = currentY + 6 + (weakTopicsLines.length * 5) + 10;

      // Weekly breakdown
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text("Weekly Study Schedule", 14, currentY);
      currentY += 8;

      activePlan.generatedText.weeklyPlan.forEach((dayData: any) => {
        if (currentY > 260) {
          doc.addPage();
          currentY = 22;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 27, 75);
        doc.text(dayData.day, 14, currentY);
        currentY += 6;

        dayData.sessions.forEach((sess: any) => {
          if (currentY > 275) {
            doc.addPage();
            currentY = 22;
          }
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          doc.text(`• [${sess.time}] (${sess.dur}) — ${sess.title} [${sess.type}]`, 18, currentY);
          currentY += 5.5;
        });
        currentY += 4;
      });

      // Footer addition
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(148, 163, 184);
        doc.line(14, 284, 196, 284);
        doc.text("Generated by StudyForge AI", 14, 289);
        doc.text(`Page ${i} of ${totalPages}`, 178, 289);
      }

      doc.save(`${activePlan.title.toLowerCase().replace(/\s+/g, "-")}-studyplan.pdf`);
      toast.success("PDF study plan downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Make sure jsPDF is loaded correctly.");
    }
  };

  // Schedule Reminder Handler
  const handleSetReminder = async () => {
    if (!activePlanId || !activePlan) return;

    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported in this browser.");
      return;
    }

    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
      setPermissionStatus(perm);
    }

    if (perm === "denied") {
      toast.error("Notification permission denied. Please allow notifications in browser settings.");
      return;
    }

    if (!reminderDateTime) {
      toast.error("Please pick a valid study target date & time.");
      return;
    }

    const newReminder: Reminder = {
      id: `rem-${Date.now()}`,
      planId: activePlan.id,
      planTitle: activePlan.title,
      dateTime: reminderDateTime,
      fired: false
    };

    const updated = [...reminders, newReminder];
    localStorage.setItem("studyforge_reminders", JSON.stringify(updated));
    setReminders(updated);
    setShowReminderModal(false);
    setReminderDateTime("");
    toast.success(`Study reminder set for ${new Date(newReminder.dateTime).toLocaleString()}!`, { icon: "⏰" });
  };

  // Sorted plans: Pinned first, then newest first
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarRange className="text-indigo-400" />
            <span>AI Study Planner & Scheduler</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure your target parameters or pick a subject template to trigger Gemini study layout generations.
          </p>
        </div>
      </div>

      {/* Main Grid containing History Sidebar, Parameters, Plan Viewer */}
      <div className="flex flex-col xl:flex-row gap-8 items-stretch">
        
        {/* Toggleable "My Plans" Sidebar on the Left */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? "w-full xl:w-16" : "w-full xl:w-72"} shrink-0 flex flex-col`}>
          <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 shadow-xl flex-1 flex flex-col text-left h-full">
            <div className="flex justify-between items-center mb-4">
              {!sidebarCollapsed && (
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-indigo-400" />
                  <span>My Plans ({plans.length}/10)</span>
                </h3>
              )}
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded-md bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-white transition-all ml-auto"
                title={sidebarCollapsed ? "Expand History" : "Collapse History"}
              >
                {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>

            {!sidebarCollapsed ? (
              <div className="space-y-2.5 overflow-y-auto max-h-[500px] xl:max-h-none flex-1 pr-1">
                {sortedPlans.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No saved plans yet.</p>
                ) : (
                  sortedPlans.map((plan) => {
                    const isActive = plan.id === activePlanId;
                    const isEditing = plan.id === editingPlanId;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => !isEditing && loadPlan(plan)}
                        className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer ${
                          isActive 
                            ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                            : "bg-slate-950/20 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          {isEditing ? (
                            <div className="flex gap-1 items-center w-full min-w-0" onClick={e => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-slate-900 border border-indigo-500/80 rounded px-2 py-0.5 text-xs text-slate-100 outline-none"
                                onKeyDown={(e) => e.key === "Enter" && handleSaveRename(plan.id, e)}
                                autoFocus
                              />
                              <button onClick={(e) => handleSaveRename(plan.id, e)} className="p-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded text-white hover:from-purple-500 hover:to-pink-500">
                                <Check size={10} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-bold truncate leading-tight flex-1">
                              {plan.title}
                            </span>
                          )}
                          {!isEditing && (
                            <div className="flex gap-1 items-center shrink-0">
                              <button
                                onClick={(e) => handleTogglePin(plan.id, e)}
                                className={`p-1 rounded hover:bg-slate-800 ${plan.pinned ? "text-indigo-400" : "text-slate-600"}`}
                                title={plan.pinned ? "Unpin Plan" : "Pin Plan"}
                              >
                                <Pin size={11} className={plan.pinned ? "fill-indigo-400" : ""} />
                              </button>
                              <button
                                onClick={(e) => handleStartRename(plan.id, plan.title, e)}
                                className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-slate-300"
                                title="Rename Plan"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                onClick={(e) => handleDeletePlan(plan.id, e)}
                                className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-red-400"
                                title="Delete Plan"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                          {plan.progress && (
                            <span className="font-semibold text-indigo-400 bg-indigo-950/40 border border-indigo-900/35 px-1.5 py-0.25 rounded">
                              {completionPercentage}% complete
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                {sortedPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => loadPlan(plan)}
                    className={`p-2 rounded-xl border flex items-center justify-center relative ${
                      plan.id === activePlanId 
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-400" 
                        : "bg-slate-900/40 border-slate-900 text-slate-600"
                    }`}
                    title={plan.title}
                  >
                    <BookOpen size={16} />
                    {plan.pinned && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configure Target Form & Planner Viewer Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Configure Target Panel */}
          <div className="space-y-6 text-left">
            
            {/* Subject Templates Row */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl">
              <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                <Zap size={14} className="text-amber-400 fill-amber-400/20" />
                <span>Subject Templates</span>
              </h3>
              {/* Horizontal Scrollable list of templates */}
              <div className="flex overflow-x-auto pb-2.5 gap-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {templates.map((temp) => {
                  const IconComp = temp.icon;
                  return (
                    <button
                      key={temp.title}
                      onClick={() => applyTemplate(temp)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold shrink-0 cursor-pointer bg-gradient-to-br transition-all hover:scale-105 active:scale-95 ${temp.color}`}
                    >
                      <IconComp size={13} className="shrink-0" />
                      <span>{temp.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Inputs Form */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <Layers size={18} className="text-indigo-400" />
                <span>Configure Target</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Target Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Subjects
                  </label>
                  <input
                    type="text"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="e.g. Calculus, Chemistry"
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Study Hours / Day
                    </label>
                    <select
                      value={studyHours}
                      onChange={(e) => setStudyHours(e.target.value)}
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-350 outline-none focus:border-indigo-500/80 cursor-pointer"
                    >
                      <option value="1">1 Hour</option>
                      <option value="2">2 Hours</option>
                      <option value="3">3 Hours</option>
                      <option value="4">4+ Hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Target Score
                    </label>
                    <input
                      type="text"
                      value={targetScore}
                      onChange={(e) => setTargetScore(e.target.value)}
                      placeholder="e.g. A+ or 90%"
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Weak Topics (Focus Areas)
                  </label>
                  <textarea
                    value={weakTopics}
                    onChange={(e) => setWeakTopics(e.target.value)}
                    placeholder="Integration, Benzene structures"
                    rows={3}
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 placeholder-slate-650 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  />
                </div>

                {errorMessage && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs text-center leading-normal">
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white border border-purple-500/25 hover:border-pink-400/50 glow-btn flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-6 shadow-md"
                >
                  <Sparkles size={14} />
                  <span>{isGenerating ? "AI is generating plan..." : "Generate AI Study Plan"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Generated Schedule & Adaptive Alerts */}
          <div className="lg:col-span-2 space-y-6 text-left">
            {/* Missed Sessions / Adaptive Rescheduling Notification */}
            {missedAlert && (
              <div className="glass-panel border-l-4 border-amber-500 rounded-2xl p-5 bg-amber-500/5 shadow-md flex gap-4 items-start animate-in slide-in-from-top-4 duration-500">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide leading-none">
                    Missed Session Detected!
                  </h4>
                  <p className="text-xs text-slate-350 mt-1.5 leading-relaxed">
                    Yesterday's 1.5h Calculus session was missed. Your exams are in 12 days; to avoid overload, AI proposes redistributing the topics to Thursday's review slot and Friday's practice block.
                  </p>
                  <div className="flex gap-4 mt-3">
                    <button
                      onClick={handleReschedule}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      <RefreshCw size={12} className="animate-spin-slow" />
                      <span>Apply Adaptive Reschedule</span>
                    </button>
                    <button
                      onClick={() => setMissedAlert(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rescheduling Success notification */}
            {reschedulingDone && (
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs flex items-center gap-2 animate-in fade-in duration-300">
                <CheckCircle2 size={16} className="text-teal-400" />
                <span>Calculus topics successfully redistributed. No overall deadlines were missed!</span>
              </div>
            )}

            {/* AI Generated Plan Viewer */}
            {isGenerating ? (
              <div className="glass-panel rounded-3xl p-12 border border-slate-800/80 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
                <h4 className="text-sm font-bold text-white mb-1">AI Generator Core</h4>
                <p className="text-xs text-slate-400 font-semibold italic animate-pulse">
                  {generationSteps[stepIndex]}
                </p>
              </div>
            ) : planGenerated && activePlan ? (
              <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl space-y-6">
                
                {/* Progress Tracker Widget & Utilities */}
                <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-900/30 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Streak & Completion */}
                  <div className="flex items-center gap-6 text-left w-full md:w-auto">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/35 text-amber-400 flex items-center justify-center">
                        <Flame size={20} className="fill-amber-500/20 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase leading-none">Streak</span>
                        <span className="text-sm font-extrabold text-amber-400">{activeStreak} Days 🔥</span>
                      </div>
                    </div>
                    <div className="flex-1 md:w-44 min-w-0">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <span>Completion</span>
                        <span>{completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500" 
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions: Download PDF & Reminders */}
                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => setShowReminderModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                      title="Set reminder"
                    >
                      <Bell size={13} className="text-indigo-400" />
                      <span>Set Reminder</span>
                    </button>
                    <button
                      onClick={downloadPlanAsPDF}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white border border-purple-500/35 hover:border-pink-400 transition-all cursor-pointer shadow-lg hover:shadow-purple-500/20"
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Tab Selector & Exam Meta */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-800/40">
                  <div className="flex gap-2">
                    {["daily", "weekly", "monthly"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          activeTab === tab
                            ? "bg-indigo-600/25 border border-indigo-500/45 text-indigo-300"
                            : "text-slate-400 hover:text-slate-200 border border-transparent"
                        }`}
                      >
                        {tab} Plan
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-950/40 border border-slate-900 px-2 py-1 rounded">
                    <Info size={11} className="text-slate-500" />
                    <span>Exam Target: {examDate}</span>
                  </div>
                </div>

                {/* Tab Content 1: Daily */}
                {activeTab === "daily" && (
                  <div className="space-y-4">
                    {dailySessions.map((session, idx) => {
                      const taskId = `daily-${idx}`;
                      const isCompleted = !!completedTasks[taskId];
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl bg-slate-950/20 border transition-all flex items-start gap-4 ${
                            isCompleted 
                              ? "border-indigo-950/50 bg-indigo-950/5 opacity-60" 
                              : "border-slate-900/60 hover:border-slate-800/60"
                          }`}
                        >
                          <button
                            onClick={() => toggleTaskCompletion(activePlanId!, taskId)}
                            className={`mt-1 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${
                              isCompleted
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "border-slate-800 hover:border-indigo-500 text-transparent bg-slate-950/40"
                            }`}
                          >
                            <Check size={12} strokeWidth={3.5} />
                          </button>
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-indigo-400 text-xs font-bold tracking-tight text-center shrink-0">
                            {session.time.split(" ")[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-bold truncate ${isCompleted ? "line-through text-slate-550" : "text-white"}`}>
                                {session.title}
                              </h4>
                              <span
                                className={`text-[9px] px-2 py-0.25 font-bold rounded-full border ${
                                  session.status === "Rest"
                                    ? "bg-teal-500/10 border-teal-500/35 text-teal-400"
                                    : "bg-indigo-500/10 border-indigo-500/35 text-indigo-400"
                                }`}
                              >
                                {session.type}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 leading-snug ${isCompleted ? "text-slate-555 line-through" : "text-slate-400"}`}>
                              {session.desc}
                            </p>
                            {!isCompleted && session.status !== "Rest" && (
                              <button
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent("start-focus-session", { detail: { taskName: session.title } }));
                                }}
                                className="mt-2 flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-pink-400 transition-all cursor-pointer"
                              >
                                <Play size={10} /> Start Focus Session
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab Content 2: Weekly */}
                {activeTab === "weekly" && (
                  <div className="space-y-6">
                    {weeklyPlan.map((dayData, idx) => (
                      <div key={idx} className="border-b border-slate-900/60 last:border-b-0 pb-4 last:pb-0">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
                          {dayData.day}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {dayData.sessions.map((sess: any, sIdx: number) => {
                            const taskId = `weekly-${dayData.day}-${sIdx}`;
                            const isCompleted = !!completedTasks[taskId];
                            return (
                              <div
                                key={sIdx}
                                className={`p-3 rounded-xl border transition-all text-left flex justify-between items-center gap-3 ${
                                  isCompleted 
                                    ? "bg-indigo-950/5 border-indigo-950/40 opacity-60" 
                                    : "bg-slate-950/20 border-slate-900 hover:border-slate-850"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <button
                                    onClick={() => toggleTaskCompletion(activePlanId!, taskId)}
                                    className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${
                                      isCompleted
                                        ? "bg-indigo-600 border-indigo-500 text-white"
                                        : "border-slate-850 hover:border-indigo-500 text-transparent bg-slate-950/45"
                                    }`}
                                  >
                                    <Check size={11} strokeWidth={3.5} />
                                  </button>
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-slate-500 font-bold block">{sess.time}</span>
                                    <span className={`text-xs font-bold block truncate mt-0.5 ${isCompleted ? "line-through text-slate-500" : "text-slate-200"}`}>
                                      {sess.title}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] font-semibold text-slate-400 shrink-0 bg-slate-900 px-2 py-0.75 rounded border border-slate-850">
                                  {sess.dur}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab Content 3: Monthly Calendar outline */}
                {activeTab === "monthly" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-900">
                      <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 30 }).map((_, idx) => {
                        const dayNumber = idx + 1;
                        const hasStudy = dayNumber % 3 === 0;
                        const hasExam = dayNumber === 16;
                        return (
                          <div
                            key={idx}
                            className={`aspect-square rounded-xl flex flex-col justify-between p-1.5 border text-xs font-semibold ${
                              hasExam
                                ? "bg-red-500/10 border-red-500/40 text-red-400"
                                : hasStudy
                                ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40"
                                : "bg-slate-950/20 border-slate-900/60 text-slate-600"
                            }`}
                          >
                            <span className="self-end text-[10px]">{dayNumber}</span>
                            {hasExam && <span className="w-1.5 h-1.5 rounded-full bg-red-500 self-start ml-1 mb-1" />}
                            {hasStudy && !hasExam && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 self-start ml-1 mb-1" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-500 font-bold border-t border-slate-900 pt-3">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500/20 border border-indigo-500/35" /> Study Blocks</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/35" /> Exam Date</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 border border-slate-800/80 flex flex-col items-center justify-center min-h-[300px]">
                <Sparkles className="w-12 h-12 text-slate-750 mb-4" />
                <h4 className="text-sm font-bold text-slate-400">No Study Plan Active</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-normal text-center">
                  Configure your target parameters or load a template and hit Generate to build your customized AI study schedule.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Reminders Scheduler Dialog/Modal */}
      {showReminderModal && activePlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-slate-800 rounded-3xl w-full max-w-md p-6 text-left shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Bell className="text-indigo-400" />
              <span>Set Study Reminder</span>
            </h3>
            <p className="text-xs text-slate-450 mb-4">
              Schedule a push notification to remind you to start studying your plan: <span className="font-semibold text-slate-200">"{activePlan.title}"</span>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pick Study Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              {permissionStatus === "denied" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] leading-relaxed flex gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Notification permissions are blocked. Please allow notification permissions for this website in your browser's site settings to receive reminders.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white border border-transparent hover:bg-slate-900 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetReminder}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold cursor-pointer transition-all border border-purple-500/30"
                >
                  Save Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
