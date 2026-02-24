
import { Voice } from './types';

export const APP_NAME = "ElevenLabs TTS";
export const AUTHOR_TAG = "ZAHEER AHMAD Master YouTube Automation";

export const VOICES: Voice[] = [
  { id: "hpp4J3VqNfWAUOO0d1Us", label: "Bella - Professional, Bright, Warm", gender: "female" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", label: "Roger - Laid-Back, Casual, Resonant", gender: "male" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah - Mature, Reassuring, Confident", gender: "female" },
  { id: "FGY2WhTYpPnrIDTdsKH5", label: "Laura - Enthusiast, Quirky Attitude", gender: "female" },
  { id: "IKne3meq5aSn9XLyUdCD", label: "Charlie - Deep, Confident, Energetic", gender: "male" },
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George - Warm, Captivating Storyteller", gender: "male" },
  { id: "N2lVS1w4EtoT3dr4eOWO", label: "Callum - Husky Trickster", gender: "male" },
  { id: "SAz9YHcvj6GT2YYXdXww", label: "River - Relaxed, Neutral, Informative", gender: "female" },
  { id: "SOYHLrjzK2X1ezoPC6cr", label: "Harry - Fierce Warrior", gender: "male" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", label: "Liam - Energetic, Social Media Creator", gender: "male" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice - Clear, Engaging Educator", gender: "female" },
  { id: "XrExE9yKIg1WjnnlVkGX", label: "Matilda - Knowledgable, Professional", gender: "female" },
  { id: "bIHbv24MWmeRgasZH58o", label: "Will - Relaxed Optimist", gender: "male" },
  { id: "cgSgspJ2msm6clMCkdW9", label: "Jessica - Playful, Bright, Warm", gender: "female" },
  { id: "cjVigY5qzO86Huf0OWal", label: "Eric - Smooth, Trustworthy", gender: "male" },
  { id: "iP95p4xoKVk53GoZ742B", label: "Chris - Charming, Down-to-Earth", gender: "male" },
  { id: "nPczCjzI2devNBz1zQrb", label: "Brian - Deep, Resonant and Comforting", gender: "male" },
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel - Steady Broadcaster", gender: "male" },
  { id: "pFZP5JQG7iQjIQuC4Bku", label: "Lily - Velvety Actress", gender: "female" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam - Dominant, Firm", gender: "male" },
  { id: "pqHfZKP75CvOlQylNhV4", label: "Bill - Wise, Mature, Balanced", gender: "male" },
];

export const STORAGE_KEYS = {
  TEXT: "zaheer_11labs_text",
  VOICE: "zaheer_11labs_voice",
  USAGE_LOG: "zaheer_11labs_usage_log",
  USAGE_LOG_SECONDARY: "zaheer_11labs_usage_log_secondary",
  USAGE_LOG_THIRD: "zaheer_11labs_usage_log_third",
  USAGE_LOG_FOURTH: "zaheer_11labs_usage_log_fourth",
  USAGE_LOG_FIFTH: "zaheer_11labs_usage_log_fifth",
  FAVORITES: "zaheer_11labs_favorites",
  CUSTOM_VOICES: "zaheer_11labs_custom_voices",
  ADMIN_KEYS: "zaheer_11labs_admin_keys",
  ACTIVE_ADMIN_KEYS: "zaheer_11labs_active_admin_keys"
};

export const PRICE_PER_MILLION = 220;
export const TOTAL_CREDITS_CHARS = 10000;
export const WORDS_PER_MINUTE = 150;

export const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";
// Keys should be set in environment variables or passed from the server
export const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY; 
export const ELEVENLABS_API_KEY_SECONDARY = process.env.ELEVENLABS_API_KEY_SECONDARY;
export const ELEVENLABS_API_KEY_THIRD = process.env.ELEVENLABS_API_KEY_THIRD;
export const ELEVENLABS_API_KEY_FOURTH = process.env.ELEVENLABS_API_KEY_FOURTH;
export const ELEVENLABS_API_KEY_FIFTH = process.env.ELEVENLABS_API_KEY_FIFTH;