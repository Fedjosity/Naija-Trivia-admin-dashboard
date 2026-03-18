"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateFullPack, deployPackToFirebase } from "../actions";
import { type Pack } from "@antigravity/content-schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function UploadPage() {
  const [category, setCategory] = useState("History");
  const [difficulty, setDifficulty] = useState("beginner");
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [jsonInput, setJsonInput] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage({ type: "", text: "" });
    try {
      const pack = await generateFullPack(category, difficulty);
      if (pack) {
        setCurrentPack(pack);
        setJsonInput(JSON.stringify(pack, null, 2));
      } else {
        setMessage({ type: "error", text: "AI failed to generate pack." });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Generation error." });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeploy = async () => {
    if (!currentPack) return;
    setDeploying(true);
    try {
      const result = await deployPackToFirebase(currentPack);
      if (result.success) {
        setMessage({
          type: "success",
          text: `Pack deployed successfully! URL: ${result.url}`,
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Deployment failed.",
        });
      }
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Critical deployment error.";
      setMessage({ type: "error", text: message });
    } finally {
      setDeploying(false);
    }
  };

  const handleManualParse = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setCurrentPack(parsed);
      setMessage({
        type: "success",
        text: "JSON parsed successfully. Ready to deploy.",
      });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Invalid JSON format." });
    }
  };

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold tracking-tight">
          Pack Deployment Center
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Generator Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Category
              </label>
              <Input
                value={category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCategory(e.target.value)
                }
                placeholder="e.g. Geography"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full h-10 px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate AI Pack
            </Button>
          </CardContent>
        </Card>

        {/* Editor / Preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pack Definition (JSON)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleManualParse}>
                Parse & Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={jsonInput}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setJsonInput(e.target.value)
              }
              className="w-full h-[400px] p-4 font-mono text-xs border rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Paste pack JSON here or use the generator..."
            />
          </CardContent>
          <CardFooter className="flex justify-between border-t border-muted/20 pt-6">
            <div className="flex items-center gap-2">
              {message.text && (
                <div
                  className={`flex items-center gap-2 text-sm ${message.type === "success" ? "text-green-500" : "text-red-500"}`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {message.text}
                </div>
              )}
            </div>
            <Button
              onClick={handleDeploy}
              disabled={deploying || !currentPack}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              {deploying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Deploy to Production
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Visual Preview */}
      {currentPack && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">
            Content Preview: {currentPack.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPack.questions?.map((q, i) => (
              <div
                key={q.id || i}
                className="p-4 border rounded-lg bg-background/50"
              >
                <p className="font-semibold mb-2">
                  {i + 1}. {q.text}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-2 rounded ${idx === q.correctAnswerIndex ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-muted/50"}`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
