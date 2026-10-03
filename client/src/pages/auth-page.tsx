import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // We need to handle the redirect in useEffect to avoid React hooks issues
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const isSubmitting = loginMutation.isPending || registerMutation.isPending;

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    // Convert the identifier/password format to the expected username/password format
    await loginMutation.mutateAsync({
      identifier: values.identifier,
      password: values.password,
    });
  }

  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    console.log("Register submit values:", values);
    try {
      await registerMutation.mutateAsync(values);
    } catch (error) {
      console.error("Registration error:", error);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your credentials to access your account"
              : "Create a new account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLogin ? (
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                {/* Simple direct inputs for debugging - Login Form */}
                <div className="space-y-2">
                  <label htmlFor="login-identifier" className="text-sm font-medium">Username or Email</label>
                  <input
                    id="login-identifier"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Your username or email"
                    value={loginForm.watch("identifier")}
                    onChange={(e) => loginForm.setValue("identifier", e.target.value)}
                    onBlur={() => loginForm.trigger("identifier")}
                  />
                  {loginForm.formState.errors.identifier && (
                    <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.identifier.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pr-10"
                      placeholder="Your password"
                      value={loginForm.watch("password") || ""}
                      onChange={(e) => loginForm.setValue("password", e.target.value)}
                      onBlur={() => loginForm.trigger("password")}
                    />
                    <button
                      type="button"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowLoginPassword(!showLoginPassword);
                      }}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                {/* Simple direct inputs for debugging */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">Username</label>
                  <input
                    id="username"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Choose a username"
                    value={registerForm.watch("username")}
                    onChange={(e) => registerForm.setValue("username", e.target.value)}
                    onBlur={() => registerForm.trigger("username")}
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-sm font-medium text-destructive">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Your email address"
                    value={registerForm.watch("email")}
                    onChange={(e) => registerForm.setValue("email", e.target.value)}
                    onBlur={() => registerForm.trigger("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm font-medium text-destructive">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showRegisterPassword ? "text" : "password"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pr-10"
                      placeholder="Create a password"
                      value={registerForm.watch("password") || ""}
                      onChange={(e) => registerForm.setValue("password", e.target.value)}
                      onBlur={() => registerForm.trigger("password")}
                    />
                    <button
                      type="button"
                      aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowRegisterPassword(!showRegisterPassword);
                      }}
                    >
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm font-medium text-destructive">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            </Form>
          )}
          <div className="text-center">
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-6 hidden md:block">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            ESG Marketplace Platform
          </h2>
          <p className="text-muted-foreground">
            Connect with sustainability consultants and enhance your
            Environmental, Social, and Governance practices with our
            comprehensive marketplace.
          </p>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Why join our platform?</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Access to verified sustainability experts</li>
              <li>Personalized ESG consultation services</li>
              <li>Training resources for your organization</li>
              <li>Connect with industry leaders</li>
              <li>Track your sustainability progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}