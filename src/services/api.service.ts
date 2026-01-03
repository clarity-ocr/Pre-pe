/**
 * API Service - Abstract layer for all external API calls
 * 
 * IMPORTANT: This service uses placeholder endpoints.
 * To connect to KwikApi or any other provider:
 * 1. Update the environment variables in your .env file
 * 2. The system will automatically use the new endpoints
 * 
 * No code changes required when switching providers!
 */

import type { ApiResponse } from '@/types/recharge.types';

// API Configuration - Replace with real API when ready
const API_CONFIG = {
  // Replace with real API base URL via environment variable
  baseUrl: import.meta.env.VITE_RECHARGE_API_BASE_URL || 'https://api.placeholder.com',
  // These would be set in edge functions for security
  // apiKey: process.env.RECHARGE_API_KEY
  // apiSecret: process.env.RECHARGE_API_SECRET
};

/**
 * Generic API request handler
 * All external API calls go through this function
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // API Key would be added in edge function
        ...options.headers,
      },
    });

    if (!response.ok) {
      return {
        status: 'FAILED',
        transaction_id: '',
        message: `API Error: ${response.statusText}`,
        data: {} as T,
      };
    }

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('API Request Error:', error);
    return {
      status: 'FAILED',
      transaction_id: '',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {} as T,
    };
  }
}

export { apiRequest, API_CONFIG };
