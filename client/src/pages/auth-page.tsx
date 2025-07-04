import { useState } from "react";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, LogIn, Mail, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
});

  email: z.string().email("Please enter a valid email address"),
});

  const [activeTab, setActiveTab] = useState<string>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const { toast } = useToast();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  // Registration form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

    defaultValues: {
      email: "",
    },
  });

  // Form submission handlers
  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsSubmitting(true);
      setError(null);
      
      loginMutation.mutate(
        {
          onSuccess: () => {
            console.log("Login successful");
            // No need for manual redirects as protected route will handle this
          },
          onError: (error) => {
            console.error("Login error:", error);
          },
          onSettled: () => {
            setIsSubmitting(false);
          }
        }
      );
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error("Login error:", err);
      setIsSubmitting(false);
    }
  }

  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    try {
      setIsSubmitting(true);
      setError(null);
      
      
      registerMutation.mutate(
        registrationData,
        {
          onSuccess: () => {
            console.log("Registration successful");
            toast({
              title: "Registration successful",
              description: "Your account has been created and you're now logged in.",
            });
          },
          onError: (error) => {
            setError(error.message || "Registration failed. Please try again.");
            console.error("Registration error:", error);
          },
          onSettled: () => {
            setIsSubmitting(false);
          }
        }
      );
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error("Registration error:", err);
      setIsSubmitting(false);
    }
  }

    try {
      setIsSubmitting(true);
      setError(null);
      
      
      // If successful, show success message
      setResetEmailSent(true);
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user) {
    return <Redirect to="/" />;
  }

    // To be removed in future update
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">
                : activeTab === "login" 
                  ? "Welcome Back" 
                  : "Create an Account"}
            </CardTitle>
            <CardDescription>
                : activeTab === "login" 
                  ? "Enter your credentials to access your account" 
                  : "Fill out the form below to create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {resetEmailSent && (
              <Alert className="mb-4">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                </AlertDescription>
              </Alert>
            )}

                  <FormField
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setError(null);
                        setResetEmailSent(false);
                      }}
                    >
                      Back to Login
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                              Logging in...
                            </>
                          ) : (
                            "Login"
                          )}
                        </Button>
                        
                        <div className="text-sm text-center mt-2">
                          <button 
                            type="button" 
                            className="text-primary hover:underline"
                            onClick={() => {
                              setError(null);
                            }}
                          >
                          </button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                              Registering...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  Replit Account
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex lg:flex-1 bg-primary text-primary-foreground">
        <div className="flex flex-col justify-center p-12">
          <h1 className="text-4xl font-bold mb-4">MindVault</h1>
          <p className="text-xl mb-6">Your personal voice-powered journal and goal management system</p>
          <ul className="space-y-4">
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Voice-to-text transcription</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Goal setting and tracking</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Comprehensive analytics</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Media recordings and attachments</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}