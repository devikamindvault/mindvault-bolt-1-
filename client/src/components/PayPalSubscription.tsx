import { useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import fetchApi from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// PayPal script is loaded in the component to avoid loading it on every page
declare global {
  interface Window {
    paypal?: any;
  }
}

export function PayPalSubscription() {
  const paypalButtonContainerRef = useRef(null);
  const { toast } = useToast();
  
  // Check if the user is already subscribed
  const isSubscribed = 
    user?.subscriptionTier === 'premium' || 
    user?.subscriptionTier === 'paid';
  
  // Calculate days remaining in trial
  const daysRemaining = user?.trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  
  const isTrialActive = daysRemaining > 0;
  
  // Mutation to update subscription status
  const { mutate: updateSubscription, isPending: isUpdating } = useMutation({
    mutationFn: async (subscriptionData: { 
      subscriptionId: string, 
      subscriptionTier: string 
    }) => {
      return fetchApi('/api/user/subscription', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Subscription updated",
        description: "Your subscription has been successfully updated",
      });
      // Refresh user data
      refetchUser();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update subscription: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Don't load PayPal if user is already subscribed
    if (isSubscribed) return;
    
    // Load the PayPal SDK
    const loadPayPalScript = () => {
      // Clean up any existing script to avoid duplicates
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Use the exact PayPal script from the user's working code
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AeFRWtvONwA0gppTo5v9q8ki3I5KA_weuMS16nF-6Cg2VGPUnmYiO-83Fnr_bvAMOrQfw6oXyjtlc2dp&vault=true&intent=subscription';
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      script.async = true;
      
      script.onload = () => {
        if (window.paypal && paypalButtonContainerRef.current) {
          window.paypal.Buttons({
            style: {
              shape: 'pill',
              color: 'black',
              layout: 'horizontal',
              label: 'subscribe'
            },
            createSubscription: function(data: any, actions: any) {
              console.log("Creating subscription with plan ID: P-0YA91281H3907300WNAGMCBY");
              // Use the exact code provided by the user that works with their PayPal account
              return actions.subscription.create({
                /* Creates the subscription */
                plan_id: 'P-0YA91281H3907300WNAGMCBY',
                quantity: 1 // The quantity of the product for a subscription
              });
            },
            onApprove: function(data: any, actions: any) {
              console.log("PayPal subscription approved:", data);
              
              // Get the subscription ID directly as shown in the working code
              const subscriptionId = data.subscriptionID;
              console.log("Using subscription ID:", subscriptionId);
              
              // Update the user's subscription in the database
              updateSubscription({
                subscriptionId: subscriptionId,
                subscriptionTier: 'premium'
              });
              
              toast({
                title: "Subscription Successful!",
                description: "Your premium subscription has been activated.",
              });
            },
            onCancel: function() {
              console.log("PayPal subscription canceled by user");
              toast({
                title: "Subscription Canceled",
                description: "You canceled the subscription process.",
              });
            },
            onError: (err: any) => {
              console.error("PayPal Error Details:", err);
              console.error("Error name:", err?.name);
              console.error("Error message:", err?.message);
              console.error("Error stack:", err?.stack);
              console.error("Error details:", err?.details);
              
              // Check if error has a message
              const errorMessage = err?.message || "Unknown error occurred";
              
              toast({
                title: "Payment Error",
                description: `Error: ${errorMessage}. Please try again.`,
                variant: "destructive",
              });
              
              // Also try a direct call to create a subscription for debugging
              try {
                console.log("Testing direct subscription creation...");
                if (window.paypal && window.paypal.Buttons) {
                  const testActions = window.paypal.Buttons().createSubscription({
                    plan_id: 'P-0YA91281H3907300WNAGMCBY'
                  });
                  console.log("Direct subscription test:", testActions);
                }
              } catch (directError) {
                console.error("Direct subscription test error:", directError);
              }
            }
          }).render(paypalButtonContainerRef.current);
        }
      };
      
      document.body.appendChild(script);
    };
    
    loadPayPalScript();
    
    // Cleanup function
    return () => {
      const paypalScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (paypalScript) {
        paypalScript.remove();
      }
    };
  }, [isSubscribed, updateSubscription]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Subscription Plan</CardTitle>
        <CardDescription>
          {isSubscribed 
            ? "You have an active premium subscription" 
            : isTrialActive 
              ? `Your free trial is active - ${daysRemaining} days remaining` 
              : "Your trial has ended - Subscribe to continue using premium features"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="p-4 bg-green-50 text-green-900 rounded-md">
            <h3 className="font-semibold">Active Premium Subscription</h3>
            <p className="text-sm mt-2">You have access to all premium features.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isTrialActive && (
              <div className="p-4 bg-blue-50 text-blue-900 rounded-md">
                <h3 className="font-semibold">Free Trial Active</h3>
                <p className="text-sm mt-2">You have {daysRemaining} days left in your free trial. 
                Subscribe now to ensure uninterrupted access to premium features.</p>
              </div>
            )}
            
            <div className="border p-4 rounded-md">
              <h3 className="font-semibold">Premium Plan - $3/month</h3>
              <ul className="text-sm mt-2 space-y-1">
                <li>✓ Unlimited voice transcription</li>
                <li>✓ Advanced goal tracking</li>
                <li>✓ AI-powered insights</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
            
            {isUpdating ? (
              <div className="flex justify-center">
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div ref={paypalButtonContainerRef} className="mt-4"></div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  {isTrialActive ? 
                    "You can subscribe now even while your free trial is active" : 
                    "Your free trial has ended. Subscribe now to regain access to premium features"}
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-gray-500">
        <p>Secure payment processing by PayPal</p>
        {isSubscribed && (
          <Button 
            variant="link" 
            className="text-xs p-0 h-auto"
            onClick={() => window.open('https://www.paypal.com/myaccount/autopay/', '_blank')}
          >
            Manage subscription
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}