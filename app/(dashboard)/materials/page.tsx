"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

interface Material {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  extracted_text: string | null;
  summary: string | null;
  processing_status: "pending" | "processing" | "done" | "error";
  created_at: string;
}

interface Flashcard {
  front: string;
  back: string;
}

export default function MaterialsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [materialsList, setMaterialsList] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");

  // Flashcards state
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [activeCards, setActiveCards] = useState<Flashcard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<any[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});

  // Fetch materials list
  const fetchMaterials = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        setMaterialsList(data as Material[]);
      }
    } catch (err: any) {
      console.error("Fetch materials error:", err);
    } finally {
      setLoadingMaterials(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Poll materials progress if any are pending or processing
  useEffect(() => {
    const needsPolling = materialsList.some(
      (m) => m.processing_status === "pending" || m.processing_status === "processing"
    );
    if (!needsPolling) return;

    const interval = setInterval(() => {
      fetchMaterials();
    }, 4000);

    return () => clearInterval(interval);
  }, [materialsList, fetchMaterials]);

  // Format file size helper
  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Determine doc type icon
  const getFileType = (filename: string, mimeType?: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf" || mimeType?.includes("pdf")) return "pdf";
    if (["png", "jpg", "jpeg", "webp"].includes(ext || "") || mimeType?.includes("image")) return "image";
    if (["doc", "docx"].includes(ext || "") || mimeType?.includes("word")) return "docx";
    return "pdf";
  };

  // Trigger browsing
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndProcessFile(file);
  };

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadAndProcessFile(file);
    }
  };

  // Upload to storage & trigger API
  const uploadAndProcessFile = async (file: File) => {
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds the 10MB limit.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to upload materials.");

      // 1. Upload to Supabase Storage Bucket
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const storagePath = `${user.id}/${Date.now()}_${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // 2. Register material in DB table
      const { data: material, error: insertError } = await supabase
        .from("materials")
        .insert({
          user_id: user.id,
          filename: file.name,
          storage_path: storagePath,
          file_size_bytes: file.size,
          mime_type: file.type,
          processing_status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to list immediately
      setMaterialsList((prev) => [material as Material, ...prev]);
      toast.loading("Parsing document and generating AI flashcards/quizzes...", { id: toastId });

      // 3. Trigger processing API
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: material.id }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to process material");

      toast.success(`${file.name} successfully parsed!`, { id: toastId });
      confetti({
        particleCount: 50,
        spread: 40,
        colors: ["#14b8a6", "#6366f1"],
      });

      fetchMaterials();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload file", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle pasted text submission
  const handleTextSubmit = async () => {
    if (!pasteTitle.trim()) {
      toast.error("Please enter a title for your notes.");
      return;
    }
    if (!pasteText.trim() || pasteText.trim().length < 50) {
      toast.error("Please paste at least 50 characters of study notes.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Uploading notes: ${pasteTitle}...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to upload materials.");

      // Convert text to a Blob/File representation
      const cleanTitle = pasteTitle.trim().replace(/[^a-zA-Z0-9.]/g, "_");
      const filename = cleanTitle.toLowerCase().endsWith(".txt") ? cleanTitle : `${cleanTitle}.txt`;
      const storagePath = `${user.id}/${Date.now()}_${filename}`;

      const textBlob = new Blob([pasteText], { type: "text/plain" });
      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(storagePath, textBlob);

      if (uploadError) throw uploadError;

      // Register material in DB table
      const { data: material, error: insertError } = await supabase
        .from("materials")
        .insert({
          user_id: user.id,
          filename: filename,
          storage_path: storagePath,
          file_size_bytes: textBlob.size,
          mime_type: "text/plain",
          processing_status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to list immediately
      setMaterialsList((prev) => [material as Material, ...prev]);
      toast.loading("Parsing notes and generating AI flashcards/quizzes...", { id: toastId });

      // Trigger processing API
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: material.id }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to process material");

      toast.success(`"${filename}" successfully parsed!`, { id: toastId });
      confetti({
        particleCount: 50,
        spread: 40,
        colors: ["#14b8a6", "#6366f1"],
      });

      // Reset fields
      setPasteTitle("");
      setPasteText("");
      fetchMaterials();
    } catch (err: any) {
      console.error("Text processing error:", err);
      toast.error(err.message || "Failed to process text", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete material
  const handleDeleteFile = async (id: string, storagePath: string) => {
    if (!confirm("Are you sure you want to delete this document? This will remove all associated flashcards and quizzes.")) return;
    
    const toastId = toast.loading("Deleting material...");
    try {
      // Remove from storage
      await supabase.storage.from("materials").remove([storagePath]);

      // Remove DB record
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;

      setMaterialsList((prev) => prev.filter((m) => m.id !== id));
      toast.success("Material deleted successfully", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document", { id: toastId });
    }
  };

  // Open Flashcards
  const handleViewFlashcards = async (materialId: string) => {
    const toastId = toast.loading("Loading flashcards...");
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("material_id", materialId);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("No flashcards found for this document.", { id: toastId });
        return;
      }

      const formatted = data.map((fc: any) => ({
        front: fc.question,
        back: fc.answer,
      }));

      setActiveCards(formatted);
      setCurrentCardIdx(0);
      setIsFlipped(false);
      setShowFlashcards(true);
      toast.dismiss(toastId);
    } catch (err: any) {
      toast.error(err.message || "Failed to load flashcards", { id: toastId });
    }
  };

  // Open Quiz
  const handleViewQuiz = async (materialId: string) => {
    const toastId = toast.loading("Loading quiz...");
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("material_id", materialId)
        .maybeSingle();

      if (error) throw error;

      if (!data || !data.questions_json || !Array.isArray(data.questions_json) || data.questions_json.length === 0) {
        toast.error("No quiz found for this document.", { id: toastId });
        return;
      }

      const formatted = data.questions_json.map((q: any) => ({
        q: q.question,
        options: q.options,
        correct: q.options[q.correct],
      }));

      setActiveQuizQuestions(formatted);
      setQuizAnswers({});
      setQuizScore(null);
      setShowQuiz(true);
      toast.dismiss(toastId);
    } catch (err: any) {
      toast.error(err.message || "Failed to load quiz", { id: toastId });
    }
  };

  const handleSelectQuizAnswer = (qIdx: number, val: string) => {
    setQuizAnswers({ ...quizAnswers, [qIdx]: val });
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    activeQuizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        score++;
      }
    });
    setQuizScore(score);
    if (score === activeQuizQuestions.length) {
      confetti({
        particleCount: 100,
        spread: 60,
        colors: ["#10b981", "#14b8a6"]
      });
    }
  };

  return (
    <AppLayout>
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
        style={{ display: "none" }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Study Materials & Parser
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload text, images, or slides. AI instantly parses concepts to generate interactive cards and quizzes.
          </p>
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Upload Zone */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800/80 rounded-xl">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload Document
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste Text
            </button>
          </div>

          {activeTab === "file" ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`glass-panel rounded-3xl p-6 border transition-all shadow-xl flex flex-col items-center text-center justify-center min-h-[250px] relative overflow-hidden ${
                isDragging ? "border-indigo-500 bg-indigo-950/15" : "border-slate-800/80"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 pointer-events-none" />
              
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                  <span className="text-xs font-bold text-white block">AI Parsing Document...</span>
                  <p className="text-[10px] text-slate-500 mt-1 animate-pulse">Extracting concepts & definitions</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="p-4 rounded-full bg-slate-900 border border-slate-850 text-indigo-400 mb-4 hover:scale-110 transition-transform">
                    <UploadCloud size={28} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 block">Drag & drop files here</span>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-normal">
                    Supports PDF, DOCX, PNG, JPG (Max 10MB)
                  </p>
                  <button
                    onClick={handleBrowseClick}
                    className="mt-5 px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-xs font-bold text-white border border-indigo-500/30 glow-btn transition-all cursor-pointer"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl flex flex-col gap-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  Notes Title
                </label>
                <input
                  type="text"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="e.g. NumPy Arrays, History Lecture 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  Paste Study Text
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste your syllabus, textbook pages, or lecture notes here (minimum 50 characters)..."
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  disabled={isUploading}
                />
                <span className="text-[9px] text-slate-500 mt-1 block">
                  {pasteText.length} characters (recommended 100 - 15,000)
                </span>
              </div>

              <button
                onClick={handleTextSubmit}
                disabled={isUploading}
                className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-xs font-bold text-white border border-indigo-500/30 glow-btn transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Text...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                    <span>Generate Study Material</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-indigo-950/15 border border-indigo-900/20 flex gap-3 text-xs leading-normal text-slate-350 text-left">
            <AlertCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">How to use parsing:</span>
              <p className="text-[11px] mt-1 text-slate-400">
                Simply upload study notes or lecture slides. The AI reads content, structures key terms, and enables flashcard learning.
              </p>
            </div>
          </div>
        </div>

        {/* Files Inventory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Uploaded Library</span>
            </h3>

            {loadingMaterials ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-400 font-semibold">Loading library...</span>
              </div>
            ) : materialsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                <FileText className="w-10 h-10 text-slate-700 mb-3" />
                <span className="text-xs text-slate-500 font-bold">No documents uploaded yet</span>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[220px] text-center leading-normal">
                  Upload your study guides above, and AI will generate study aids for them.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {materialsList.map((file) => {
                  const fileType = getFileType(file.filename, file.mime_type);
                  const isProcessing = file.processing_status === "pending" || file.processing_status === "processing";
                  const isError = file.processing_status === "error";

                  return (
                    <div
                      key={file.id}
                      className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-slate-850 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex gap-3 items-center min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-950/45 border border-slate-900 text-indigo-400 shrink-0">
                          {fileType === "image" ? <ImageIcon size={18} /> : <FileText size={18} />}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">
                              {file.filename}
                            </span>
                            {/* Processing Badge */}
                            {isProcessing && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-550/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-wider animate-pulse">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                Parsing...
                              </span>
                            )}
                            {isError && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-550/10 border border-red-500/20 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                                Failed
                              </span>
                            )}
                            {!isProcessing && !isError && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-550/10 border border-teal-500/20 text-[9px] font-bold text-teal-400 uppercase tracking-wider">
                                Ready
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                            {formatBytes(file.file_size_bytes)} • Uploaded {new Date(file.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions Drawer */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          disabled={isProcessing || isError}
                          onClick={() => handleViewFlashcards(file.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/10 hover:bg-indigo-650/25 border border-indigo-500/25 hover:border-indigo-500/50 text-indigo-400 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Sparkles size={11} />
                          <span>Flashcards</span>
                        </button>
                        <button
                          disabled={isProcessing || isError}
                          onClick={() => handleViewQuiz(file.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-650/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <HelpCircle size={11} />
                          <span>Practice Quiz</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id, file.storage_path)}
                          className="p-1.5 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Interactive Flashcards Viewer */}
      {showFlashcards && activeCards.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-800/80 shadow-2xl p-6 lg:p-8 relative flex flex-col items-center">
            {/* Close */}
            <button
              onClick={() => setShowFlashcards(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-slate-200 font-bold text-xs cursor-pointer"
            >
              Close
            </button>

            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Generated Study Flashcards</span>
            </h3>

            {/* Flashcard Body */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-52 bg-slate-900/40 border border-slate-850 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-center items-center text-center cursor-pointer transition-all relative overflow-hidden shadow-inner select-none"
            >
              <div className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                {isFlipped ? "Answer" : "Question"}
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-250 leading-relaxed max-w-sm">
                {isFlipped ? activeCards[currentCardIdx].back : activeCards[currentCardIdx].front}
              </p>
              <span className="text-[10px] text-slate-600 font-bold mt-4 block uppercase tracking-widest animate-pulse">
                Click to Flip
              </span>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center w-full mt-6">
              <span className="text-xs text-slate-500 font-bold">
                Card {currentCardIdx + 1} of {activeCards.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentCardIdx === 0}
                  onClick={() => {
                    setCurrentCardIdx((prev) => prev - 1);
                    setIsFlipped(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-850 disabled:opacity-40 text-xs font-bold text-slate-350 hover:text-white cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentCardIdx === activeCards.length - 1}
                  onClick={() => {
                    setCurrentCardIdx((prev) => prev + 1);
                    setIsFlipped(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-xs font-bold text-white border border-indigo-500/20 disabled:opacity-40 cursor-pointer"
                >
                  Next Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Practice Quiz Viewer */}
      {showQuiz && activeQuizQuestions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-800/80 shadow-2xl p-6 lg:p-8 relative flex flex-col text-left">
            {/* Close */}
            <button
              onClick={() => setShowQuiz(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-slate-200 font-bold text-xs cursor-pointer"
            >
              Close
            </button>

            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle size={14} className="text-purple-400" />
              <span>Practice Revision Quiz</span>
            </h3>

            {/* Quiz Questions */}
            <div className="space-y-6 max-h-[350px] overflow-y-auto pr-1">
              {activeQuizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="space-y-2.5 pb-4 border-b border-slate-900/60 last:border-b-0">
                  <h4 className="text-xs font-bold text-slate-200 leading-snug">
                    {qIdx + 1}. {q.q}
                  </h4>
                  <div className="space-y-1.5">
                    {q.options.map((opt: string, optIdx: number) => {
                      const isSelected = quizAnswers[qIdx] === opt;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectQuizAnswer(qIdx, opt)}
                          disabled={quizScore !== null}
                          className={`w-full p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                              : "bg-slate-950/20 border-slate-900 hover:border-slate-850 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quiz Footer Controls */}
            <div className="flex justify-between items-center w-full mt-6 pt-4 border-t border-slate-900/60">
              {quizScore !== null ? (
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                  <CheckCircle size={16} />
                  <span>Score: {quizScore} / {activeQuizQuestions.length} Correct!</span>
                </div>
              ) : (
                <div />
              )}
              
              {quizScore !== null ? (
                <button
                  onClick={() => {
                    setQuizScore(null);
                    setQuizAnswers({});
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Retake Quiz
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length < activeQuizQuestions.length}
                  className="px-4 py-2 rounded-xl bg-purple-650 hover:bg-purple-600 text-xs font-bold text-white border border-purple-500/35 disabled:opacity-40 transition-all cursor-pointer"
                >
                  Submit Answers
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
