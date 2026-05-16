"use client";

import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiSparkling2Line,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiCloseLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type PasswordStrength = "weak" | "medium" | "strong";

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return "weak";
  if (score <= 2) return "medium";
  return "strong";
}

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password],
  );
  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formDataRef.current);
  };

  const validateField = (name: string, data: typeof formData) => {
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (!data.name.trim()) newErrors.name = "Full name is required";
        else delete newErrors.name;
        break;
      case "email":
        if (!data.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(data.email))
          newErrors.email = "Please enter a valid email";
        else delete newErrors.email;
        break;
      case "password":
        if (!data.password) newErrors.password = "Password is required";
        else if (data.password.length < 8)
          newErrors.password = "Password must be at least 8 characters";
        else delete newErrors.password;
        break;
      case "confirmPassword":
        if (!data.confirmPassword)
          newErrors.confirmPassword = "Please confirm your password";
        else if (data.password !== data.confirmPassword)
          newErrors.confirmPassword = "Passwords do not match";
        else delete newErrors.confirmPassword;
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = (data: typeof formData) => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) newErrors.name = "Full name is required";
    if (!data.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email))
      newErrors.email = "Please enter a valid email";
    if (!data.password) newErrors.password = "Password is required";
    else if (data.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (!data.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (data.password !== data.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!data.terms) newErrors.terms = "You must accept the terms";

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData)) return;

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("user already exists")
        ) {
          toast.error(
            "An account with this email already exists. Try signing in.",
          );
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user && !data.session) {
        toast.success(
          "Account created! Please check your email to verify your address.",
        );
        router.push("/auth/login");
        return;
      }

      toast.success("Welcome to Invoice AI!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error("Failed to sign up with Google");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FF0A54] cherry-glow flex items-center justify-center">
              <RiSparkling2Line className="w-6 h-6 text-white" />
            </div>
            <span className="font-serif text-xl font-bold text-white">
              Invoice AI
            </span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-white">
            Get Started
          </h1>
          <p className="text-white/40 text-sm mt-2">Create your free account</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a0a0a] border border-white/8 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <Label htmlFor="name" className="text-white/60 text-sm">
                Full Name
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur("name")}
                  className={`bg-[#111] border-white/10 text-white placeholder:text-white/20 focus:border-[#FF0A54]/50 focus-visible:ring-0 ${
                    errors.name && touched.name ? "border-red-500/50" : ""
                  }`}
                />
                {formData.name && !errors.name && touched.name && (
                  <RiCheckLine className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {errors.name && touched.name && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <RiCloseLine className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-white/60 text-sm">
                Email Address
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  className={`bg-[#111] border-white/10 text-white placeholder:text-white/20 focus:border-[#FF0A54]/50 focus-visible:ring-0 ${
                    errors.email && touched.email ? "border-red-500/50" : ""
                  }`}
                />
                {formData.email && !errors.email && touched.email && (
                  <RiCheckLine className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {errors.email && touched.email && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <RiCloseLine className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-white/60 text-sm">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur("password")}
                  className={`bg-[#111] border-white/10 text-white placeholder:text-white/20 focus:border-[#FF0A54]/50 focus-visible:ring-0 pr-10 ${
                    errors.password && touched.password
                      ? "border-red-500/50"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <RiEyeOffLine className="w-4 h-4" />
                  ) : (
                    <RiEyeLine className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength === "weak"
                          ? "bg-red-500"
                          : passwordStrength === "medium"
                            ? "bg-yellow-500"
                            : "bg-emerald-500"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength === "medium"
                          ? "bg-yellow-500"
                          : passwordStrength === "strong"
                            ? "bg-emerald-500"
                            : "bg-white/10"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength === "strong"
                          ? "bg-emerald-500"
                          : "bg-white/10"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs capitalize ${
                      passwordStrength === "weak"
                        ? "text-red-400"
                        : passwordStrength === "medium"
                          ? "text-yellow-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {passwordStrength}
                  </span>
                </div>
              )}
              {errors.password && touched.password && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <RiCloseLine className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-white/60 text-sm"
              >
                Confirm Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur("confirmPassword")}
                  className={`bg-[#111] border-white/10 text-white placeholder:text-white/20 focus:border-[#FF0A54]/50 focus-visible:ring-0 pr-10 ${
                    errors.confirmPassword && touched.confirmPassword
                      ? "border-red-500/50"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirmPassword ? (
                    <RiEyeOffLine className="w-4 h-4" />
                  ) : (
                    <RiEyeLine className="w-4 h-4" />
                  )}
                </button>
                {passwordsMatch && (
                  <RiCheckLine className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <RiCloseLine className="w-3 h-3" /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={formData.terms}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      terms: checked as boolean,
                    }));
                    if (errors.terms)
                      setErrors((prev) => ({ ...prev, terms: "" }));
                  }}
                  className="border-white/20 data-[state=checked]:bg-[#FF0A54] data-[state=checked]:border-[#FF0A54] mt-0.5"
                />
                <label
                  htmlFor="terms"
                  className="text-white/40 text-sm cursor-pointer leading-tight"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-[#FF0A54] hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-[#FF0A54] hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && touched.terms && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <RiCloseLine className="w-3 h-3" /> {errors.terms}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white font-medium py-6 cherry-glow-sm transition-all hover:cherry-glow"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0a0a0a] px-3 text-white/25">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            className="w-full bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:text-white hover:border-white/20"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-white/30 mt-6">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#FF0A54] hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
