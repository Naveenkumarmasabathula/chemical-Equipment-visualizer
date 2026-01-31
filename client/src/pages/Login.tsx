import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Beaker, Eye, EyeOff, Lock } from "lucide-react";
import { loginApi, registerApi } from "@/lib/authApi";

const MIN_USERNAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 8;

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const validateSignup = (): string | null => {
    const u = username.trim();
    if (u.length < MIN_USERNAME_LENGTH) {
      return "Username must be at least 2 characters";
    }
    if (u.toLowerCase() === "admin") {
      return "The username \"admin\" is reserved. Use a different username to sign up.";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "signup") {
      const validationError = validateSignup();
      if (validationError) {
        setError(validationError);
        return;
      }
    } else {
      if (!username.trim() || !password) {
        setError("Enter username and password");
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await registerApi(username, password);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        login(username.trim(), password);
        setTimeout(() => setLocation("/"), 0);
      } else {
        const result = await loginApi(username, password);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        login(username.trim(), password);
        setTimeout(() => setLocation("/"), 0);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
    setConfirmPassword("");
  };

  const passwordField = (
    id: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    setShow: React.Dispatch<React.SetStateAction<boolean>>,
    placeholder: string,
    autoComplete: string,
    minLength?: number
  ) => (
    <div className="flex h-9 items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none">
      <span className="flex h-9 items-center pl-3 text-muted-foreground pointer-events-none" aria-hidden>
        <Lock className="h-4 w-4 shrink-0" />
      </span>
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        disabled={loading}
        minLength={minLength}
        className="flex h-8 flex-1 min-w-0 border-0 bg-transparent px-2 py-1.5 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      />
      <span className="flex h-9 shrink-0 items-center justify-center pr-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => setShow((p) => !p)}
          disabled={loading}
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 safe-area-padding">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center px-4 pt-6 sm:px-6 sm:pt-8">
          <div className="flex justify-center mb-2">
            <div className="p-3 sm:p-4 rounded-lg bg-primary/10">
              <Beaker className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Chemical Equipment Visualizer</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {mode === "signin" ? "Sign in with your credentials" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder={mode === "signin" ? "admin" : "Choose a username (min 2 characters)"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete={mode === "signin" ? "username" : "username"}
                disabled={loading}
                minLength={mode === "signup" ? MIN_USERNAME_LENGTH : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              {passwordField(
                "password",
                password,
                setPassword,
                showPassword,
                setShowPassword,
                "••••••••",
                mode === "signin" ? "current-password" : "new-password"
              )}
            </div>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                {passwordField(
                  "confirmPassword",
                  confirmPassword,
                  setConfirmPassword,
                  showConfirmPassword,
                  setShowConfirmPassword,
                  "••••••••",
                  "new-password",
                  MIN_PASSWORD_LENGTH
                )}
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full min-h-[44px] text-base sm:text-sm" disabled={loading}>
              {loading
                ? mode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "signup"
                  ? "Sign up"
                  : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={switchMode}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
          {mode === "signin" && (
            <p className="text-xs text-muted-foreground mt-2 text-center px-1">
              Default: admin / admin (change in production)
            </p>
          )}
          {mode === "signup" && username.trim().toLowerCase() === "admin" && (
            <p className="text-xs text-destructive mt-2 text-center px-1" role="alert">
              The username &quot;admin&quot; is reserved. Use a different username to sign up.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
