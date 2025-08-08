import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessName } = await req.json();
    
    if (!businessName || businessName.trim().length === 0) {
      throw new Error('Business name is required');
    }

    // Clean up the business name for domain checking
    const cleanName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const variations = [
      cleanName,
      cleanName + 'co',
      cleanName + 'inc',
      cleanName + 'llc',
      cleanName + 'app',
      cleanName + 'online'
    ];

    // Check domain availability for common TLDs
    const tlds = ['.com', '.net', '.org', '.io', '.co'];
    const domainChecks = [];

    for (const variation of variations) {
      for (const tld of tlds) {
        const domain = variation + tld;
        try {
          // Simple DNS lookup to check if domain exists
          const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
            method: 'GET',
            headers: { 'Accept': 'application/dns-json' }
          });
          const dnsData = await response.json();
          
          domainChecks.push({
            domain,
            available: dnsData.Status !== 0 || !dnsData.Answer,
            price: '$12.99/year' // Approximate pricing
          });
        } catch (error) {
          // If DNS lookup fails, assume available (cautious approach)
          domainChecks.push({
            domain,
            available: true,
            price: '$12.99/year'
          });
        }
      }
    }

    // Check social media handles (simulated - real implementation would use APIs)
    const socialPlatforms = [
      { name: 'Instagram', baseUrl: 'https://instagram.com/' },
      { name: 'Twitter', baseUrl: 'https://twitter.com/' },
      { name: 'Facebook', baseUrl: 'https://facebook.com/' },
      { name: 'LinkedIn', baseUrl: 'https://linkedin.com/company/' },
      { name: 'YouTube', baseUrl: 'https://youtube.com/c/' },
      { name: 'TikTok', baseUrl: 'https://tiktok.com/@' }
    ];

    const socialChecks = [];
    for (const platform of socialPlatforms) {
      const handles = [cleanName, businessName.toLowerCase().replace(/\s+/g, ''), businessName.toLowerCase().replace(/\s+/g, '_')];
      
      for (const handle of handles) {
        try {
          // Simple HTTP check to see if profile exists
          const response = await fetch(platform.baseUrl + handle, {
            method: 'HEAD',
            redirect: 'manual'
          });
          
          socialChecks.push({
            platform: platform.name,
            handle,
            available: response.status === 404,
            url: platform.baseUrl + handle
          });
          break; // Only check first available handle per platform
        } catch (error) {
          socialChecks.push({
            platform: platform.name,
            handle,
            available: true, // Assume available on error
            url: platform.baseUrl + handle
          });
          break;
        }
      }
    }

    // Business name similarity check using OpenAI
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    let similarNames = [];
    
    if (openAIApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
              { 
                role: 'system', 
                content: 'You are a business name research expert. Find similar existing business names that might cause trademark conflicts.' 
              },
              { 
                role: 'user', 
                content: `Check for existing businesses similar to "${businessName}". Return up to 10 similar business names with their industries. Format as JSON array: [{"name": "Business Name", "industry": "Industry", "risk": "High/Medium/Low"}]` 
              }
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        const aiData = await response.json();
        if (response.ok) {
          try {
            similarNames = JSON.parse(aiData.choices[0].message.content);
          } catch (parseError) {
            similarNames = [];
          }
        }
      } catch (error) {
        console.error('Error checking similar names:', error);
      }
    }

    return new Response(
      JSON.stringify({
        businessName,
        domains: domainChecks.slice(0, 15), // Limit results
        socialMedia: socialChecks,
        similarBusinesses: similarNames,
        summary: {
          domainsAvailable: domainChecks.filter(d => d.available).length,
          domainsTotal: domainChecks.length,
          socialAvailable: socialChecks.filter(s => s.available).length,
          socialTotal: socialChecks.length,
          riskLevel: similarNames.length > 5 ? 'High' : similarNames.length > 2 ? 'Medium' : 'Low'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error checking name availability:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});