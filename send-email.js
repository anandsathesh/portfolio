// api/send-email.js
// Secure serverless function to handle email sending
// This keeps all API keys hidden on the server

export default async function handler(req, res) {
  // Set CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get the secret keys from environment variables
    const { 
      EMAILJS_SERVICE_ID, 
      EMAILJS_TEMPLATE_ID, 
      EMAILJS_PUBLIC_KEY,
      EMAILJS_PRIVATE_KEY
    } = process.env;

    // Validate that all required environment variables are present
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
      console.error('Missing required environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get the form data from the request body
    const { name, email, message } = req.body;

    // Validate input data
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, message' });
    }

    // Prepare the data for the EmailJS REST API
    const emailData = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        name: name,
        email: email,
        message: message
      },
      accessToken: EMAILJS_PRIVATE_KEY
    };

    console.log('Sending email via EmailJS API...');

    // Send the email by calling the EmailJS REST API
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('EmailJS API Error:', response.status, responseText);
      return res.status(response.status).json({ 
        error: `EmailJS Error: ${response.status} - ${responseText}` 
      });
    }

    console.log('Email sent successfully via EmailJS');

    // Send success response back to the frontend
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully!' 
    });

  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ 
      error: 'Internal server error occurred while sending email' 
    });
  }
}
