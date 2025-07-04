import { PayPalSubscription } from "@/components/PayPalSubscription";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function SubscriptionPage() {
  return (
    <ProtectedRoute>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Subscription Management</h1>
        <div className="mb-6">
          <p className="text-center text-gray-600 mb-8">
            Manage your subscription settings and payment information.
          </p>
          <PayPalSubscription />
        </div>
      </div>
    </ProtectedRoute>
  );
}