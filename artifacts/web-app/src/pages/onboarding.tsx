import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ChevronRight } from "lucide-react";

interface Question {
  id: string;
  type: string;
  question: string;
  hint?: string;
  field?: string;
  options?: { value: string; label: string }[];
}

interface Session {
  id: string;
  current_step: string;
  status: string;
  next_question: Question | null;
  progress_percent: number;
}

export default function OnboardingPage() {
  const { refetchMerchant } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        let s: Session;
        try {
          const data = await apiFetch("/onboarding/session");
          s = data;
        } catch {
          const data = await apiFetch("/onboarding/session", { method: "POST" });
          s = data;
        }
        setSession(s);
        if (s.status === "approved") {
          await refetchMerchant();
          navigate(`${base}/dashboard`);
        }
      } catch {
        toast({ title: "Error", description: "Failed to load onboarding", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.next_question) return;
    setSubmitting(true);
    try {
      const data = await apiFetch("/onboarding/session/step", {
        method: "POST",
        body: JSON.stringify({ step_id: session.next_question.id, answer }),
      });
      setSession(data);
      setAnswer({});
      if (data.status === "submitted" || data.status === "approved") {
        await refetchMerchant();
        setTimeout(() => navigate(`${base}/dashboard`), 1500);
      }
    } catch {
      toast({ title: "Error", description: "Failed to save answer", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (q: Question) => {
    const update = (key: string, val: string) => setAnswer((prev) => ({ ...prev, [key]: val }));

    switch (q.type) {
      case "select":
        return (
          <div className="grid gap-2">
            {q.options?.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAnswer({ [q.field || q.id]: opt.value })}
                data-testid={`option-${opt.value}`}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  answer[q.field || q.id] === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            value={answer[q.field || q.id] || ""}
            onChange={(e) => update(q.field || q.id, e.target.value)}
            required
            data-testid="input-date"
          />
        );
      case "otp":
        return (
          <Input
            type="text"
            maxLength={6}
            placeholder="123456"
            value={answer[q.field || q.id] || ""}
            onChange={(e) => update(q.field || q.id, e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-widest font-mono"
            required
            data-testid="input-otp"
          />
        );
      case "tel":
        return (
          <Input
            type="tel"
            placeholder="+44 7700 900000"
            value={answer[q.field || q.id] || ""}
            onChange={(e) => update(q.field || q.id, e.target.value)}
            required
            data-testid="input-phone"
          />
        );
      case "address":
        return (
          <div className="space-y-3">
            <Input placeholder="Address line 1" onChange={(e) => update("address_line1", e.target.value)} data-testid="input-address1" />
            <Input placeholder="City" onChange={(e) => update("city", e.target.value)} data-testid="input-city" />
            <Input placeholder="Postcode / ZIP" onChange={(e) => update("postcode", e.target.value)} data-testid="input-postcode" />
          </div>
        );
      case "name":
        return (
          <div className="space-y-3">
            <Input placeholder="First name" onChange={(e) => update("first_name", e.target.value)} data-testid="input-first-name" />
            <Input placeholder="Last name" onChange={(e) => update("last_name", e.target.value)} data-testid="input-last-name" />
          </div>
        );
      case "bank_details":
        return (
          <div className="space-y-3">
            <Input placeholder="Sort code (e.g. 20-00-00)" onChange={(e) => update("bank_sort_code", e.target.value)} data-testid="input-sort-code" />
            <Input placeholder="Account number" onChange={(e) => update("bank_account_number", e.target.value)} data-testid="input-account-number" />
          </div>
        );
      case "document_upload":
      case "liveness_check":
        return (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">{q.type === "liveness_check" ? "📷" : "📄"}</div>
            <p className="text-sm text-muted-foreground mb-3">
              {q.type === "liveness_check" ? "Take a selfie to verify identity" : "Upload your document"}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => update(q.field || q.id, "MOCK_DATA_UPLOADED")}
              data-testid="button-upload"
            >
              {answer[q.field || q.id] ? "Uploaded" : "Simulate upload"}
            </Button>
          </div>
        );
      case "review":
        return (
          <div className="space-y-2">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">All your information has been collected. Click submit to complete your application.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
                onChange={(e) => update("accepted_terms", e.target.checked ? "true" : "")}
                data-testid="checkbox-terms"
              />
              <span className="text-sm text-muted-foreground">I agree to the Terms of Service and Privacy Policy</span>
            </label>
          </div>
        );
      case "info":
        return <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">{q.hint || "Continue to the next step"}</div>;
      default:
        return (
          <Input
            placeholder="Enter your answer"
            value={answer[q.field || q.id] || ""}
            onChange={(e) => update(q.field || q.id, e.target.value)}
            required
            data-testid="input-answer"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (session?.status === "submitted" || session?.status === "approved") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Application submitted</h1>
          <p className="text-muted-foreground text-sm">We're verifying your identity. You'll be redirected shortly.</p>
        </div>
      </div>
    );
  }

  const q = session?.next_question;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full bg-muted/30 border-b border-border">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">P</span>
              </div>
              <span className="font-semibold text-sm">PayOS</span>
            </div>
            <span className="text-xs text-muted-foreground" data-testid="text-progress">{session?.progress_percent ?? 0}% complete</span>
          </div>
          <Progress value={session?.progress_percent ?? 0} className="h-1.5" data-testid="progress-bar" />
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 pt-12">
        <div className="w-full max-w-lg">
          {q ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1" data-testid="text-question">{q.question}</h2>
                {q.hint && <p className="text-sm text-muted-foreground">{q.hint}</p>}
              </div>
              <div>{renderField(q)}</div>
              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
                data-testid="button-continue"
              >
                {submitting ? "Saving..." : (
                  <span className="flex items-center gap-2">
                    {q.type === "review" ? "Submit application" : "Continue"}
                    <ChevronRight size={16} />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">Processing...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
