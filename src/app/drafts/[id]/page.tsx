import { Button } from "@/components/ui/button";
import { Question } from "@antigravity/content-schema";
import fs from "fs/promises";
import path from "path";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  X,
  BookOpen,
  Lightbulb,
  MapPin,
  Tag,
} from "lucide-react";

export default async function ReviewPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  // Load draft
  const draftsDir = path.resolve(process.cwd(), "../../content/drafts");
  const filePath = path.join(draftsDir, `${id}.json`);

  let draft: Question;
  try {
    const data = await fs.readFile(filePath, "utf-8");
    draft = JSON.parse(data);
  } catch {
    notFound();
  }

  async function approveAction() {
    "use server";
    // Move to approved folder
    const approvedDir = path.resolve(process.cwd(), "../../content/approved");
    try {
      await fs.mkdir(approvedDir, { recursive: true });
    } catch {}

    const newPath = path.join(approvedDir, `${id}.json`);
    const currentDraftDir = path.resolve(process.cwd(), "../../content/drafts");
    const currentPath = path.join(currentDraftDir, `${id}.json`);

    // Read potentially updated data from form if we had inputs
    const data = await fs.readFile(currentPath);
    await fs.writeFile(newPath, data);
    await fs.unlink(currentPath);

    redirect("/drafts");
  }

  async function rejectAction() {
    "use server";
    const currentDraftDir = path.resolve(process.cwd(), "../../content/drafts");
    const currentPath = path.join(currentDraftDir, `${id}.json`);
    try {
      await fs.unlink(currentPath);
    } catch {}
    redirect("/drafts");
  }

  return (
    <main className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href="/drafts">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Drafts
              </Link>
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="font-mono text-xs text-muted-foreground">
              {id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <form action={rejectAction}>
              <Button variant="destructive" size="sm" type="submit">
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </form>
            <form action={approveAction}>
              <Button
                variant="default"
                size="sm"
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve & Publish
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Question Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Question Card */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 space-y-6">
                {/* Meta badges */}
                <div className="flex flex-wrap gap-2">
                  {draft.category && (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {draft.category}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                    Draft
                  </span>
                </div>

                {/* Question Text */}
                <div>
                  <h2 className="text-xl md:text-2xl font-serif font-medium leading-relaxed text-foreground">
                    {draft.text}
                  </h2>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {draft.options.map((opt, i) => {
                    const isCorrect = i === draft.correctAnswerIndex;
                    return (
                      <div
                        key={i}
                        className={`
                          relative p-4 rounded-lg border transition-all
                          ${
                            isCorrect
                              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 ring-1 ring-green-200 dark:ring-green-900"
                              : "bg-background border-input hover:bg-accent/50"
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`
                            flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0
                            ${isCorrect ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}
                          `}
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span
                            className={`text-sm ${isCorrect ? "font-medium text-green-900 dark:text-green-100" : "text-foreground"}`}
                          >
                            {opt}
                          </span>
                        </div>
                        {isCorrect && (
                          <div className="absolute top-3 right-3 text-green-600 dark:text-green-400">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Explanation Card */}
            <div className="bg-card border rounded-xl shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  Explanation
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {draft.explanation}
              </p>
            </div>
          </div>

          {/* Right Column: Context & Metadata */}
          <div className="space-y-6">
            {/* Cultural Context Widget */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <MapPin className="w-24 h-24 text-amber-900 dark:text-amber-100" />
              </div>
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Lightbulb className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Cultural Context
                  </h3>
                </div>
                <p className="text-sm text-amber-900/80 dark:text-amber-100/80 leading-relaxed">
                  {draft.culturalContext}
                </p>
              </div>
            </div>

            {/* Review Checklist (Static for now) */}
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-sm">Review Checklist</h3>
              <div className="space-y-3">
                {[
                  "Factually accurate?",
                  "Spelling & Grammar correct?",
                  "Culturally relevant?",
                  "Tone is appropriate?",
                ].map((item, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
