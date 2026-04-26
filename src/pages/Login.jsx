import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/api/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";

export default function Login() {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [mode, setMode] = useState("select"); // 'select' | 'email' | 'phone'
    const [step, setStep] = useState(1); // 1 = input contact, 2 = input otp
    
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    // Redirect naturally if already logged in and fully onboarded
    React.useEffect(() => {
        if (user && user.onboarded) {
            navigate("/");
        }
    }, [user, navigate]);

    if (user && user.onboarded) {
        return null; // Safe to return after hooks
    }

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await authService.signInWithGoogle();
            // OAuth redirects externally, so we don't need to unset loading or navigate here.
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    const requestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "email") {
                await authService.signInWithEmailOTP(email);
            } else if (mode === "phone") {
                await authService.signInWithPhoneOTP(phone);
            }
            toast.success("OTP sent successfully!");
            setStep(2);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "email") {
                await authService.verifyEmailOTP(email, otp);
            } else if (mode === "phone") {
                await authService.verifyPhoneOTP(phone, otp);
            }
            // Wait for AuthContext.jsx to trigger onAuthStateChange, but we can also forcefully bounce them
            toast.success("Login successful!");
            navigate("/onboarding");
        } catch (error) {
            toast.error("Invalid or expired OTP.");
            setLoading(false);
        }
    };

    const renderSelectionMode = () => (
        <div className="space-y-3">
            <Button
                variant="outline"
                className="w-full justify-start h-12 px-5 gap-3 rounded-xl border-border bg-card hover:border-primary/40 transition-colors"
                onClick={() => setMode("email")}
            >
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-[15px]">Continue with Email</span>
            </Button>
            <Button
                variant="outline"
                className="w-full justify-start h-12 px-5 gap-3 rounded-xl border-border bg-card hover:border-primary/40 transition-colors"
                onClick={() => setMode("phone")}
            >
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-[15px]">Continue with Phone</span>
            </Button>
            <Button
                variant="outline"
                className="w-full justify-start h-12 px-5 gap-3 rounded-xl border-border bg-card hover:border-primary/40 transition-colors"
                onClick={handleGoogleLogin} disabled={loading}
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-medium text-[15px]">Continue with Google</span>
            </Button>
        </div>
    );

    const renderContactInputMode = () => (
        <form onSubmit={requestOTP} className="space-y-5">
            <div className="space-y-2">
                <Label className="text-sm font-medium">{mode === "email" ? "Email Address" : "Phone Number"}</Label>
                <Input
                    autoFocus
                    type={mode === "email" ? "email" : "tel"}
                    placeholder={mode === "email" ? "arjun@example.com" : "+91 98765 43210"}
                    value={mode === "email" ? email : phone}
                    onChange={(e) => mode === "email" ? setEmail(e.target.value) : setPhone(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-card border-border px-4"
                />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-[15px]">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Get OTP
            </Button>
            <div className="text-center mt-4">
                <button type="button" onClick={() => setMode("select")} className="text-sm text-muted-foreground hover:text-foreground">
                    &larr; Back to options
                </button>
            </div>
        </form>
    );

    const renderOTPMode = () => (
        <form onSubmit={verifyOTP} className="space-y-5">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Enter the 8-digit OTP sent to {mode === "email" ? email : phone}</Label>
                <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        autoFocus
                        type="text"
                        maxLength={8}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="00000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        className="h-12 rounded-xl bg-card border-border pl-10 tracking-[0.25em] font-mono text-center text-lg"
                    />
                </div>
            </div>
            <Button type="submit" disabled={loading || otp.length < 8} className="w-full h-12 rounded-xl text-[15px]">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Verify & Sign In
            </Button>
            <div className="text-center mt-4">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">
                    &larr; Edit {mode === "email" ? "Email" : "Phone"}
                </button>
            </div>
        </form>
    );

    return (
        <div className="min-h-[85vh] flex items-center justify-center py-16 px-5 relative isolate">
            <Toaster position="top-center" richColors />
            
            {/* Background Decor */}
            <div className="absolute inset-0 -z-10 bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-sm transform -rotate-3 hover:rotate-0 transition-transform">
                        <span className="text-primary-foreground font-display font-bold text-2xl">R</span>
                    </div>
                    <h1 className="font-display text-4xl font-semibold tracking-tight">Welcome back</h1>
                    <p className="text-muted-foreground mt-2 text-sm max-w-[250px] mx-auto">
                        Sign in to access your saved properties, messages, and listings.
                    </p>
                </div>

                {mode === "select" && renderSelectionMode()}
                {mode !== "select" && step === 1 && renderContactInputMode()}
                {mode !== "select" && step === 2 && renderOTPMode()}
            </div>
        </div>
    );
}


