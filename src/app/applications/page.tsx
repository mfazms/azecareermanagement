"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ApplicationTable from "@/components/applications/ApplicationTable";
import ApplicationModal from "@/components/applications/ApplicationModal";
import type { Application, Evaluation } from "@/types";
import {
  getApplications,
  addApplication,
  updateApplication,
  updateEvaluation,
  deleteApplication,
} from "@/lib/firestore";
import { fileToBase64 } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    try {
      const apps = await getApplications(user.uid);
      setApplications(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchApplications();
  }, [user, fetchApplications]);

  const handleSave = async (
    data: Omit<Application, "id" | "dateUpdated">,
    cvFile?: File
  ) => {
    if (!user) return;
    try {
      let cvFileUrl = (data as Record<string, unknown>).cvFileUrl as string || "";
      let cvFileName = (data as Record<string, unknown>).cvFileName as string || "";

      if (cvFile) {
        if (cvFile.size > 900 * 1024) {
          toast.error("CV file must be under 900KB");
          return;
        }
        cvFileUrl = await fileToBase64(cvFile);
        cvFileName = cvFile.name;
      }

      const saveData = { ...data, cvFileUrl, cvFileName };

      if (editingApp) {
        await updateApplication(user.uid, editingApp.id, saveData);
        toast.success(`${data.company} updated`);
      } else {
        await addApplication(user.uid, saveData as Omit<Application, "id">);
        toast.success(`${data.company} added`);
      }
      await fetchApplications();
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application");
    }
  };

  const handleSaveEvaluation = async (applicationId: string, evaluation: Evaluation) => {
    if (!user) return;
    try {
      await updateEvaluation(user.uid, applicationId, evaluation);
      toast.success("Evaluation saved");
      await fetchApplications();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("Failed to save evaluation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const app = applications.find((a) => a.id === id);
    if (!confirm(`Delete application for ${app?.company}?`)) return;
    try {
      await deleteApplication(user.uid, id);
      toast.success("Application deleted");
      await fetchApplications();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F]">Applications</h1>
          <p className="text-sm text-[#86868B] mt-1">Manage all your job applications in one place</p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
          </div>
        ) : (
          <ApplicationTable
            applications={applications}
            onAdd={() => { setEditingApp(null); setModalOpen(true); }}
            onEdit={(app) => { setEditingApp(app); setModalOpen(true); }}
            onDelete={handleDelete}
          />
        )}
        <ApplicationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          application={editingApp}
          onSave={handleSave}
          onSaveEvaluation={handleSaveEvaluation}
        />
      </main>
    </div>
  );
}
