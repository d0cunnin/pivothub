import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { PaymentFailedEmail } from './_templates/payment-failed.tsx';
import { DowngradeWarningEmail } from './_templates/downgrade-warning.tsx';
import { SubscriptionSuccessEmail } from './_templates/subscription-success.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, data?: any) => {
  console.log(`[BILLING-EMAIL] ${step}`, data || '');
};

interface EmailRequest {
  type: 'payment_failed' | 'downgrade_warning' | 'subscription_success';
  userId: string;
  email: string;
  userName?: string;
  subscriptionTier?: string;
  subscriptionPackage?: string;
  gracePeriodEndDate?: string;
  downgradeDate?: string;
  monthlyCredits?: number;
  nextBillingDate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting email notification');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody: EmailRequest = await req.json();
    const { type, userId, email, userName, subscriptionTier, subscriptionPackage } = requestBody;

    logStep('Email request received', { type, userId, email });

    // Get user profile for name if not provided
    let displayName = userName;
    if (!displayName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      
      displayName = profile?.display_name || email.split('@')[0];
    }

    const siteUrl = 'https://pivothub.io';
    let html = '';
    let subject = '';

    // Generate email based on type
    switch (type) {
      case 'payment_failed':
        subject = '⚠️ Payment Failed - Action Required';
        html = await renderAsync(
          React.createElement(PaymentFailedEmail, {
            userName: displayName,
            subscriptionTier: subscriptionTier || 'Premium',
            gracePeriodEndDate: requestBody.gracePeriodEndDate || 'in 7 days',
            retryPaymentUrl: `${siteUrl}/settings`,
          })
        );
        break;

      case 'downgrade_warning':
        subject = '⏰ Final Notice: Account Downgrade Tomorrow';
        html = await renderAsync(
          React.createElement(DowngradeWarningEmail, {
            userName: displayName,
            subscriptionTier: subscriptionTier || 'Premium',
            downgradeDate: requestBody.downgradeDate || 'tomorrow',
            updatePaymentUrl: `${siteUrl}/settings`,
          })
        );
        break;

      case 'subscription_success':
        subject = '🎉 Welcome to PivotHub Premium!';
        html = await renderAsync(
          React.createElement(SubscriptionSuccessEmail, {
            userName: displayName,
            subscriptionTier: subscriptionTier || 'Premium',
            subscriptionPackage: subscriptionPackage || 'All Access Pass',
            monthlyCredits: requestBody.monthlyCredits || 150,
            nextBillingDate: requestBody.nextBillingDate || 'in 1 month',
            dashboardUrl: `${siteUrl}/dashboard`,
          })
        );
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'PivotHub <notifications@pivothub.io>',
      to: [email],
      subject: subject,
      html: html,
    });

    if (error) {
      logStep('Resend error', error);
      throw error;
    }

    logStep('Email sent successfully', { emailId: data?.id });

    return new Response(
      JSON.stringify({ success: true, emailId: data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    logStep('Error sending email', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
