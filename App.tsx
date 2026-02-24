
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Search, Filter, Volume2, Loader2, RefreshCw, Mic, Upload, X, Star, Settings, Library, Trash2, Lock, Key, LogOut, User, Database, CheckCircle2, Download, History, FileJson, ChevronRight, ChevronDown, Edit2, Check, Plus } from 'lucide-react';
import { APP_NAME, AUTHOR_TAG, VOICES, STORAGE_KEYS, PRICE_PER_MILLION } from './constants';
import { AudioPart, UsageStats, Voice, SubscriptionInfo, ApiUsageResponse, AdminKey, UserInfo } from './types';
import { splitTextIntoChunks, estimateStats } from './utils/textUtils';
import { logUsage, getUsageStats, getCreditInfo } from './services/usageService';

const App: React.FC = () => {
  const [text, setText] = useState<string>(localStorage.getItem(STORAGE_KEYS.TEXT) || '');
  const [voices, setVoices] = useState<Voice[]>(VOICES);
  const [voiceSearch, setVoiceSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [selectedVoice, setSelectedVoice] = useState(localStorage.getItem(STORAGE_KEYS.VOICE) || VOICES[1].id); // Default to Bella
  const [selectedModel, setSelectedModel] = useState('eleven_multilingual_v2');
  const [status, setStatus] = useState('Idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFetchingVoices, setIsFetchingVoices] = useState(false);
  const [isFetchingSubscription, setIsFetchingSubscription] = useState(false);
  const [isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);
  const [isFetchingUsage, setIsFetchingUsage] = useState(false);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [apiUsage, setApiUsage] = useState<ApiUsageResponse | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneLanguage, setCloneLanguage] = useState('en-US');
  const [cloneTags, setCloneTags] = useState('');
  const [cloneDescription, setCloneDescription] = useState('');
  const [removeBackgroundNoise, setRemoveBackgroundNoise] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [audioParts, setAudioParts] = useState<AudioPart[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]')));
  const [customVoices, setCustomVoices] = useState<Voice[]>(JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_VOICES) || '[]'));
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'all' | 'favorites' | 'custom'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [importVoiceId, setImportVoiceId] = useState('');
  const [importVoiceName, setImportVoiceName] = useState('');

  // History State
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPageSize, setHistoryPageSize] = useState(50);
  const [historyVoiceFilter, setHistoryVoiceFilter] = useState('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Admin State
  const [envKeys, setEnvKeys] = useState<{ index: number, label: string }[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!localStorage.getItem('admin_token'));
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTierFilter, setAdminTierFilter] = useState<string>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('all');
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const [addKeyFeedback, setAddKeyFeedback] = useState<{ message: string; type: 'success' | 'error' }[]>([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [adminKeyDetails, setAdminKeyDetails] = useState<Record<number, AdminKey>>({});
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [keysPool, setKeysPool] = useState<{ id: string, key: string, label: string, addedAt: string, enabled?: boolean }[]>([]);
  const [poolKeyDetails, setPoolKeyDetails] = useState<Record<string, any>>({});
  const [isFetchingPoolDetails, setIsFetchingPoolDetails] = useState<Record<string, boolean>>({});
  const [adminTab, setAdminTab] = useState<'slots' | 'pool'>('slots');
  const [newPoolKey, setNewPoolKey] = useState('');
  const [newPoolLabel, setNewPoolLabel] = useState('');
  const [isAddingToPool, setIsAddingToPool] = useState(false);
  const [poolFeedback, setPoolFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const fetchKeysPool = async () => {
    try {
      const response = await fetch('/api/admin/pool');
      if (response.ok) {
        setKeysPool(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch keys pool:', error);
    }
  };

  const handleAddToPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoolKey.trim()) return;
    setIsAddingToPool(true);
    setPoolFeedback(null);
    try {
      const response = await fetch('/api/admin/pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newPoolKey, label: newPoolLabel })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewPoolKey('');
        setNewPoolLabel('');
        setPoolFeedback({ message: 'API Key validated and added successfully!', type: 'success' });
        fetchKeysPool();
        // Clear success message after 5 seconds
        setTimeout(() => setPoolFeedback(null), 5000);
      } else {
        setPoolFeedback({ message: data.error || 'Failed to validate API Key', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to add to pool:', error);
      setPoolFeedback({ message: 'Network error. Failed to add key.', type: 'error' });
    } finally {
      setIsAddingToPool(false);
    }
  };

  const handleDeleteFromPool = async (id: string) => {
    if (!window.confirm('Remove this key from pool?')) return;
    try {
      const response = await fetch(`/api/admin/pool/${id}`, { method: 'DELETE' });
      if (response.ok) fetchKeysPool();
    } catch (error) {
      console.error('Failed to delete from pool:', error);
    }
  };

  const handleTogglePoolKey = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/pool/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (response.ok) fetchKeysPool();
    } catch (error) {
      console.error('Failed to toggle pool key:', error);
    }
  };

  const fetchPoolKeyDetails = async (poolKey: any) => {
    setIsFetchingPoolDetails(prev => ({ ...prev, [poolKey.id]: true }));
    try {
      const details = await fetchKeyDetails(poolKey.key);
      if (details) {
        setPoolKeyDetails(prev => ({ ...prev, [poolKey.id]: details }));
      }
    } catch (error) {
      console.error('Failed to fetch pool key details:', error);
    } finally {
      setIsFetchingPoolDetails(prev => ({ ...prev, [poolKey.id]: false }));
    }
  };

  const handleAssignToSlot = async (slotIndex: number, apiKey: string, label: string) => {
    try {
      const response = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotIndex, apiKey, label })
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        // Refresh config and details
        const configRes = await fetch('/api/admin/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          setEnvKeys(configData.keys || []);
        }
        refreshKeyDetails(slotIndex);
      }
    } catch (error) {
      console.error('Failed to assign to slot:', error);
    }
  };

  const filteredAdminKeys = (Object.values(adminKeyDetails) as AdminKey[]).filter(key => {
    const matchesTier = adminTierFilter === 'all' || (key.subscription?.tier === adminTierFilter);
    const matchesStatus = adminStatusFilter === 'all' || (key.subscription?.status === adminStatusFilter);
    return matchesTier && matchesStatus;
  });

  const allPartBlobsRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredHistoryItems = historyItems.filter(item => {
    const matchesVoice = historyVoiceFilter === 'all' || item.voice_name === historyVoiceFilter;
    const matchesSearch = !historySearchQuery || 
      item.text.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      item.voice_name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      item.model_id.toLowerCase().includes(historySearchQuery.toLowerCase());
    
    const itemDate = new Date(item.date_unix * 1000);
    const matchesDateFrom = !historyDateFrom || itemDate >= new Date(historyDateFrom);
    const matchesDateTo = !historyDateTo || itemDate <= new Date(historyDateTo + 'T23:59:59');
    
    return matchesVoice && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const uniqueVoicesInHistory = Array.from(new Set(historyItems.map(item => item.voice_name))).sort();

  // Helper to get headers for API calls
  const getHeaders = useCallback((indexOrKey?: string | number) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (indexOrKey !== undefined) {
      const val = indexOrKey.toString();
      // If it looks like an index (0-9), use X-Account-Index
      // We check if it's a single or double digit number string
      if (/^\d+$/.test(val) && val.length <= 2) {
        headers['X-Account-Index'] = val;
      } else {
        // Otherwise assume it's a direct API key
        headers['X-API-Key'] = val;
      }
      return headers;
    }

    headers['X-Account-Index'] = selectedAccountIndex.toString();
    return headers;
  }, [selectedAccountIndex]);

  // Validate selected voice against available voices
  useEffect(() => {
    console.log('VOICES constant length:', VOICES.length);
    console.log('Current voices state length:', voices.length);
    if (voices.length > 0) {
      const isValid = voices.some(v => v.id === selectedVoice);
      if (!isValid) {
        // If current selection is invalid (e.g. old Inworld ID), reset to first available voice
        const defaultVoice = voices[0]?.id;
        if (defaultVoice) {
          console.log(`Resetting invalid voice ID ${selectedVoice} to ${defaultVoice}`);
          setSelectedVoice(defaultVoice);
        }
      }
    }
  }, [voices, selectedVoice]);

  // Fetch env keys on mount
  useEffect(() => {
    const fetchEnvConfig = async () => {
      try {
        const response = await fetch('/api/admin/config');
        if (response.ok) {
          const data = await response.json();
          setEnvKeys(data.keys || []);
          // If current selected index is not in env keys, select the first one
          if (data.keys?.length > 0 && !data.keys.some((k: any) => k.index === selectedAccountIndex)) {
            setSelectedAccountIndex(data.keys[0].index);
          }
        }
      } catch (error) {
        console.error('Failed to fetch env config:', error);
      }
    };
    fetchEnvConfig();
  }, []);

  // Update stats periodically or on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEXT, text);
    localStorage.setItem(STORAGE_KEYS.VOICE, selectedVoice);
  }, [text, selectedVoice]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_VOICES, JSON.stringify(customVoices));
  }, [customVoices]);

  // Auto-refresh all keys every 5 minutes
  useEffect(() => {
    if (isAdminLoggedIn && envKeys.length > 0) {
      const interval = setInterval(() => {
        console.log('Periodic check: Refreshing all API keys...');
        envKeys.forEach(k => refreshKeyDetails(k.index));
      }, 300000); 
      return () => clearInterval(interval);
    }
  }, [isAdminLoggedIn, envKeys]);

  // Merge custom voices into voices list
  useEffect(() => {
    setVoices(prev => {
      const existingIds = new Set(prev.map(v => v.id));
      const uniqueCustom = customVoices.filter(v => !existingIds.has(v.id));
      return [...prev, ...uniqueCustom];
    });
  }, [customVoices]);

  // Reset voice when account changes to avoid cross-account ID errors
  useEffect(() => {
    setSelectedVoice(VOICES[1].id); // Reset to Ashley (default)
    setVoices(VOICES); // Reset to base voices
    fetchVoices(); // Re-fetch for the new account
    fetchSubscription(); // Fetch subscription for the new account
    fetchUserInfo(); // Fetch user info for the new account
    fetchUsage(); // Fetch usage for the new account
  }, [selectedAccountIndex]);

  const fetchUsage = async () => {
    setIsFetchingUsage(true);
    setApiUsage(null); // Reset before fetching
    try {
      const response = await fetch(`/api/usage?days=30`, {
        headers: getHeaders()
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const msg = data.error || data.detail?.message || `Failed to fetch usage: ${response.status}`;
        console.error('Usage Fetch Error Details:', data);
        throw new Error(msg);
      }
      
      setApiUsage(data);
    } catch (error: any) {
      console.error('Usage Fetch Error:', error);
      // If it's a 422, maybe try with fewer days?
      if (error.message.includes('422')) {
         setStatus('Usage stats range too large, trying 7 days...');
         // We could retry here, but for now let's just log it
      }
    } finally {
      setIsFetchingUsage(false);
    }
  };

  const fetchSubscription = async () => {
    setIsFetchingSubscription(true);
    setSubscription(null); // Reset before fetching
    try {
      const response = await fetch('/api/subscription', {
        headers: getHeaders()
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch subscription');
      
      setSubscription(data);
    } catch (error) {
      console.error('Subscription Fetch Error:', error);
    } finally {
      setIsFetchingSubscription(false);
    }
  };

  const fetchUserInfo = async () => {
    setIsFetchingUserInfo(true);
    setUserInfo(null);
    try {
      const response = await fetch('/api/user', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch user info');
      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error('User Info Fetch Error:', error);
    } finally {
      setIsFetchingUserInfo(false);
    }
  };

  const handleClearText = () => {
    setText('');
  };

  const safeJson = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text.slice(0, 100)}`);
    }
  };

  const fetchVoices = async () => {
    setIsFetchingVoices(true);
    setStatus('Fetching voices from ElevenLabs...');
    try {
      const response = await fetch('/api/voices', {
        headers: getHeaders()
      });
      if (!response.ok) {
        let errorMessage = `Failed to fetch voices: ${response.status} ${response.statusText}`;
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail && errorData.detail.message) {
            errorMessage = `Failed to fetch voices: ${errorData.detail.message}`;
          } else if (errorData.error) {
             try {
               const nested = JSON.parse(errorData.error);
               if (nested.detail && nested.detail.message) {
                 errorMessage = `Failed to fetch voices: ${nested.detail.message}`;
               } else {
                 errorMessage = `Failed to fetch voices: ${errorData.error}`;
               }
             } catch {
               errorMessage = `Failed to fetch voices: ${errorData.error}`;
             }
          }
        } catch (e) {
           errorMessage = `${errorMessage}: ${errorText.slice(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
      const data = await safeJson(response);
      
      let voicesList: any[] = [];
      if (data.voices && Array.isArray(data.voices)) {
        voicesList = data.voices;
      }
      
      if (voicesList.length > 0) {
        const newVoices: Voice[] = voicesList
          .map((v: any) => {
            const name = v.name || v.voice_id;
            const gender = v.labels?.gender || 'other';
            return {
              id: v.voice_id,
              label: name,
              gender: gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other'
            };
          });
        
        setVoices(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueNew = newVoices.filter(v => !existingIds.has(v.id));
          return [...prev, ...uniqueNew];
        });
        setStatus(`Fetched ${newVoices.length} voices.`);
      } else {
        setStatus('No voices found in API response.');
      }
    } catch (error: any) {
      console.error(error);
      setStatus(`Fetch Error: ${error.message}. Using local list.`);
    } finally {
      setIsFetchingVoices(false);
    }
  };

  const filteredVoices = voices.filter(v => {
    const label = v.label || '';
    const id = v.id || '';
    const search = (voiceSearch || '').toLowerCase();
    const matchesSearch = label.toLowerCase().includes(search) || 
                         id.toLowerCase().includes(search);
    const matchesGender = genderFilter === 'all' || v.gender === genderFilter;
    const matchesFavorite = !showFavoritesOnly || favorites.has(v.id);
    return matchesSearch && matchesGender && matchesFavorite;
  });

  const handlePreview = async () => {
    if (isPreviewing) return;
    setIsPreviewing(true);
    try {
      const previewTexts = [
        "The strange thing about silence is that it never feels empty; it feels like something is waiting to be discovered.",
        "Every decision you make today quietly reshapes the person you will become tomorrow, whether you realize it or not.",
        "Somewhere in the world right now, someone is beginning a journey that will completely change their life forever.",
        "Technology moves fast, but human curiosity moves faster, pulling us toward questions we didn’t even know existed.",
        "There is a moment, just before everything changes, when the world holds its breath and nothing feels certain anymore."
      ];
      const previewText = previewTexts[Math.floor(Math.random() * previewTexts.length)];
      
      const part = await generateSinglePart(previewText, 0);
      const audio = new Audio(part.url);
      audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(part.url);
        setIsPreviewing(false);
      };
    } catch (error: any) {
      console.error(error);
      setStatus(`Preview Error: ${error.message}`);
      setIsPreviewing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data:audio/xxx;base64, prefix
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleCloneVoice = async () => {
    if (!cloneName.trim() || cloneFiles.length === 0) {
      setStatus('Please provide a name and at least one audio sample.');
      return;
    }

    if (!legalConsent) {
      setStatus('You must certify that you have legal rights to clone this voice.');
      return;
    }

    setIsCloning(true);
    setStatus('Cloning voice...');
    try {
      const audioSamples = await Promise.all(cloneFiles.map(async (file) => ({
        content: await fileToBase64(file)
      })));

      const response = await fetch('/api/voices/clone', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: cloneName,
          files: audioSamples,
          description: cloneDescription,
          labels: JSON.stringify({
            "gender": "other",
            "accent": "american",
            "language": cloneLanguage
          })
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to clone voice';
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail && errorData.detail.message) {
             errorMessage = errorData.detail.message;
          } else if (errorData.error) {
             try {
               const nested = JSON.parse(errorData.error);
               if (nested.detail && nested.detail.message) {
                 errorMessage = nested.detail.message;
               } else {
                 errorMessage = errorData.error;
               }
             } catch {
               errorMessage = errorData.error;
             }
          }
        } catch (e) {
           errorMessage = `${errorMessage}: ${errorText.slice(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await safeJson(response);
      const voiceId = data.voice_id;
      
      const newVoice: Voice = {
        id: voiceId,
        label: `Clone: ${cloneName}`,
        gender: 'other',
        isCustom: true
      };

      setCustomVoices(prev => [newVoice, ...prev]);
      setSelectedVoice(voiceId);
      setStatus(`Voice cloned successfully: ${cloneName}`);
      setShowCloneModal(false);
      // Reset form
      setCloneName('');
      setCloneLanguage('en-US');
      setCloneTags('');
      setCloneDescription('');
      setRemoveBackgroundNoise(false);
      setLegalConsent(false);
      setCloneFiles([]);
    } catch (error: any) {
      console.error(error);
      setStatus(`Cloning Error: ${error.message}`);
    } finally {
      setIsCloning(false);
    }
  };

  const toggleFavorite = (voiceId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(voiceId)) {
        next.delete(voiceId);
      } else {
        next.add(voiceId);
      }
      return next;
    });
  };

  const deleteCustomVoice = (voiceId: string) => {
    if (window.confirm('Are you sure you want to delete this custom voice?')) {
      setCustomVoices(prev => prev.filter(v => v.id !== voiceId));
      setVoices(prev => prev.filter(v => v.id !== voiceId));
      if (selectedVoice === voiceId) {
        setSelectedVoice(VOICES[1].id);
      }
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_token', data.token);
        setIsAdminLoggedIn(true);
        setAdminUsername('');
        setAdminPassword('');
        fetchKeysPool();
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      alert('Login error');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdminLoggedIn(false);
  };

  const fetchKeyDetails = async (index: number) => {
    try {
      // Use X-Account-Index to fetch details for the specific key on the server
      const headers = { 'X-Account-Index': index.toString() };
      const userRes = await fetch('/api/user', { headers });
      if (!userRes.ok) return null;

      const [subRes, voicesRes, historyRes] = await Promise.all([
        fetch('/api/subscription', { headers }),
        fetch('/api/voices', { headers }),
        fetch('/api/history?page_size=100', { headers })
      ]);

      const userData = await userRes.json().catch(() => ({}));
      const subData = await subRes.json().catch(() => ({}));
      const voicesData = await voicesRes.json().catch(() => ({}));
      const historyData = await historyRes.json().catch(() => ({}));

      return {
        email: userData.email || 'Unknown',
        firstName: userData.first_name || '',
        subscription: subRes.ok ? subData : undefined,
        voicesCount: voicesData.voices ? voicesData.voices.length : 0,
        historyCount: historyData.history ? historyData.history.length : 0
      };
    } catch (error) {
      console.error('Error fetching key details:', error);
      return null;
    }
  };

  const refreshKeyDetails = async (index: number) => {
    const envKey = envKeys.find(k => k.index === index);
    if (!envKey) return;

    const details = await fetchKeyDetails(index);
    if (details) {
      setAdminKeyDetails(prev => ({
        ...prev,
        [index]: {
          id: index.toString(),
          key: '', // Don't expose key to client
          label: envKey.label,
          email: details.email,
          firstName: details.firstName,
          subscription: details.subscription,
          voicesCount: details.voicesCount,
          historyCount: details.historyCount,
          isValid: true
        }
      }));
    } else {
      setAdminKeyDetails(prev => ({
        ...prev,
        [index]: {
          id: index.toString(),
          key: '',
          label: envKey.label,
          isValid: false
        }
      }));
    }
  };

  const refreshAllKeys = async () => {
    setIsRefreshingAll(true);
    await Promise.all(envKeys.map(k => refreshKeyDetails(k.index)));
    setIsRefreshingAll(false);
  };

  useEffect(() => {
    if (isAdminLoggedIn && envKeys.length > 0) {
      refreshAllKeys();
      fetchKeysPool();
    }
  }, [isAdminLoggedIn, envKeys]);

  const fetchHistory = async (customKey?: string) => {
    setIsFetchingHistory(true);
    try {
      const response = await fetch(`/api/history?page_size=${historyPageSize}`, {
        headers: getHeaders(customKey || historyKey || undefined)
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistoryItems(data.history || []);
    } catch (error) {
      console.error('History Fetch Error:', error);
      setStatus('Failed to fetch history.');
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const downloadHistoryItem = async (historyItemId: string, fileName: string, customKey?: string) => {
    try {
      const response = await fetch(`/api/history/${historyItemId}/audio`, {
        headers: getHeaders(customKey || historyKey || undefined)
      });
      if (!response.ok) throw new Error('Failed to download audio');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download Error:', error);
      alert('Failed to download audio.');
    }
  };

  // Auto-refresh admin keys every 5 minutes when in admin mode
  useEffect(() => {
    if (!isAdminMode || !isAdminLoggedIn || envKeys.length === 0) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing admin keys...');
      envKeys.forEach(k => refreshKeyDetails(k.index));
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAdminMode, isAdminLoggedIn, envKeys.length]);

  const handleImportVoice = () => {
    if (!importVoiceId.trim() || !importVoiceName.trim()) {
      setStatus('Please provide both Voice ID and Name.');
      return;
    }

    const newVoice: Voice = {
      id: importVoiceId.trim(),
      label: importVoiceName.trim(),
      gender: 'other',
      isCustom: true
    };

    setCustomVoices(prev => [newVoice, ...prev]);
    setImportVoiceId('');
    setImportVoiceName('');
    setStatus(`Voice imported: ${newVoice.label}`);
  };

  const generateSinglePart = async (chunkText: string, partNumber: number): Promise<AudioPart> => {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        text: chunkText,
        voiceId: selectedVoice,
        modelId: selectedModel
      })
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        
        // Handle ElevenLabs specific error structure
        if (errorData.detail) {
          const detail = errorData.detail;
          
          if (detail.status === "payment_required" || detail.code === "paid_plan_required") {
             throw new Error("Plan Limit Reached: This feature requires a paid ElevenLabs plan or you have exceeded your quota.");
          }
          
          if (detail.status === "invalid_request" || detail.code === "bad_request") {
             // Often "You need to be on a paid plan..." comes here too
             if (detail.message && detail.message.toLowerCase().includes("paid plan")) {
                throw new Error("Plan Limit Reached: " + detail.message);
             }
             throw new Error(`Invalid Request: ${detail.message}`);
          }

          if (detail.message) {
            errorMessage = `API Error: ${detail.message}`;
          }
        } else if (errorData.error) {
           // Fallback if server returned { error: "string" }
           // Try to parse nested JSON string if it exists
           try {
             const nested = JSON.parse(errorData.error);
             if (nested.detail && nested.detail.message) {
               errorMessage = `API Error: ${nested.detail.message}`;
             } else {
               errorMessage = `API Error: ${errorData.error}`;
             }
           } catch {
             errorMessage = `API Error: ${errorData.error}`;
           }
        }
      } catch (e) {
        // If response.json() fails, fall back to text
        // (This might happen if server didn't return JSON)
      }
      
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    return { partNumber, url, blob, text: chunkText };
  };

  const generateAllAudio = async () => {
    if (!text.trim()) {
      setStatus('Error: No text entered');
      return;
    }

    const chunks = splitTextIntoChunks(text);
    setAudioParts([]);
    allPartBlobsRef.current = [];
    setIsGenerating(true);
    setStatus(`Preparing ${chunks.length} parts...`);

    let totalCharsProcessed = 0;

    try {
      for (let i = 0; i < chunks.length; i++) {
        setStatus(`Generating part ${i + 1} of ${chunks.length}...`);
        const part = await generateSinglePart(chunks[i], i + 1);
        
        setAudioParts(prev => [...prev, part]);
        allPartBlobsRef.current.push(part.blob);
        totalCharsProcessed += chunks[i].length;
      }

      logUsage(totalCharsProcessed, selectedAccountIndex);
      fetchSubscription(); // Refresh subscription after generation
      fetchUsage(); // Refresh usage after generation
      setStatus(`Done ✓ Generated ${chunks.length} parts.`);
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFullAudio = () => {
    if (allPartBlobsRef.current.length === 0) return;
    const fullBlob = new Blob(allPartBlobsRef.current, { type: "audio/mpeg" });
    const url = URL.createObjectURL(fullBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Zaheer-11Labs-full-audio.mp3";
    a.click();
    URL.revokeObjectURL(url);
  };

  const { chars, words, estimatedMin } = estimateStats(text);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navbar */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{isAdminMode ? 'ADMIN PANEL' : APP_NAME}</h1>
          <p className="text-sm text-gray-400 font-medium">{isAdminMode ? 'Manage API Keys & Accounts' : 'Professional Production Suite'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">{AUTHOR_TAG}</p>
        </div>
      </header>

      {isAdminMode ? (
        <div className="max-w-4xl mx-auto">
          {!isAdminLoggedIn ? (
            <div className="bg-gray-900 border border-gray-800 rounded-[24px] p-8 shadow-2xl max-w-md mx-auto">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-white mb-6">Admin Login</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                  <input 
                    type="password" 
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20"
                >
                  Access Panel
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Admin Dashboard */}
              <div className="flex justify-between items-center bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Logged in as</p>
                    <p className="text-sm font-bold text-white">Administrator</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 mr-4">
                    <button 
                      onClick={() => setAdminTab('slots')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        adminTab === 'slots' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Active Slots
                    </button>
                    <button 
                      onClick={() => setAdminTab('pool')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        adminTab === 'pool' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Key Management
                    </button>
                  </div>
                  <button 
                    onClick={handleAdminLogout}
                    className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>

              {adminTab === 'slots' ? (
                <div className="space-y-6">
                  {/* Slots View (Original filteredAdminKeys view) */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight">Active Environment Slots</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Tier:</span>
                        <select 
                          value={adminTierFilter}
                          onChange={(e) => setAdminTierFilter(e.target.value)}
                          className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
                        >
                          <option value="all">All Tiers</option>
                          {Array.from(new Set((Object.values(adminKeyDetails) as AdminKey[]).map(k => k.subscription?.tier).filter(Boolean))).map(tier => (
                            <option key={tier} value={tier}>{tier}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Status:</span>
                        <select 
                          value={adminStatusFilter}
                          onChange={(e) => setAdminStatusFilter(e.target.value)}
                          className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                      {(adminTierFilter !== 'all' || adminStatusFilter !== 'all') && (
                        <button 
                          onClick={() => {
                            setAdminTierFilter('all');
                            setAdminStatusFilter('all');
                          }}
                          className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase"
                        >
                          Clear
                        </button>
                      )}
                      <div className="h-4 w-px bg-gray-800 mx-1 hidden md:block"></div>
                      {envKeys.length > 0 && (
                        <button 
                          onClick={refreshAllKeys}
                          disabled={isRefreshingAll}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                          Refresh All
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {filteredAdminKeys.length === 0 ? (
                      <p className="text-center py-8 text-gray-600 italic">No keys match the current filters or not yet loaded.</p>
                    ) : (
                      filteredAdminKeys.map((keyObj: AdminKey) => (
                        <div key={keyObj.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-grow">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white">{keyObj.label}</h4>
                                {keyObj.isValid === true && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                {keyObj.isValid === false && <X className="w-4 h-4 text-red-500" />}
                              </div>
                              <div className="mt-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-gray-500" />
                                  <p className="text-xs text-gray-400 font-medium">Name: {keyObj.firstName || 'Unknown'}</p>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-600 font-mono mt-1">Slot: {parseInt(keyObj.id) + 1}</p>
                              
                              {keyObj.subscription && (
                                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                  <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Left</p>
                                    <p className="text-xs font-bold text-blue-400">
                                      {keyObj.subscription.remaining_characters?.toLocaleString() || '0'}
                                    </p>
                                  </div>
                                  <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Used</p>
                                    <p className="text-xs font-bold text-purple-400">
                                      {keyObj.subscription.character_count?.toLocaleString() || '0'}
                                    </p>
                                  </div>
                                  <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Total</p>
                                    <p className="text-xs font-bold text-emerald-400 truncate">
                                      {keyObj.subscription.character_limit?.toLocaleString() || '0'}
                                    </p>
                                  </div>
                                  <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Tier</p>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase truncate">
                                      {keyObj.subscription.tier}
                                    </p>
                                  </div>
                                  <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Status</p>
                                    <p className={`text-[10px] font-bold uppercase truncate ${
                                      keyObj.subscription.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                                    }`}>
                                      {keyObj.subscription.status}
                                    </p>
                                  </div>
                                  <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Items</p>
                                    <p className="text-xs font-bold text-orange-400">
                                      {keyObj.historyCount || 0}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setHistoryKey(keyObj.id);
                                      setShowHistoryModal(true);
                                      fetchHistory(keyObj.id);
                                    }}
                                    className="bg-orange-500/10 hover:bg-orange-500/20 p-2 rounded-lg border border-orange-500/30 transition-all flex flex-col items-center justify-center group"
                                  >
                                    <History className="w-3 h-3 text-orange-500 group-hover:scale-110 transition-transform" />
                                    <p className="text-[10px] font-bold text-orange-400 uppercase mt-1">History</p>
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => refreshKeyDetails(parseInt(keyObj.id))}
                                className="p-2 text-gray-600 hover:text-blue-400 transition-colors"
                                title="Refresh Stats"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key Management Tab */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-blue-500" />
                      Add New API Key to Pool
                    </h3>
                    <form onSubmit={handleAddToPool} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">API Key</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                              type="password" 
                              placeholder="sk_..."
                              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              value={newPoolKey}
                              onChange={(e) => setNewPoolKey(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Label (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Personal Account"
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={newPoolLabel}
                            onChange={(e) => setNewPoolLabel(e.target.value)}
                          />
                        </div>
                      </div>
                      {poolFeedback && (
                        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          poolFeedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {poolFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          {poolFeedback.message}
                        </div>
                      )}
                      <button 
                        type="submit"
                        disabled={isAddingToPool}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {isAddingToPool ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Validate & Add Key
                      </button>
                    </form>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Library className="w-5 h-5 text-purple-500" />
                      API Key Pool ({keysPool.length})
                    </h3>
                    <div className="space-y-4">
                      {keysPool.length === 0 ? (
                        <p className="text-center py-8 text-gray-600 italic">The pool is empty. Add your first key above.</p>
                      ) : (
                        keysPool.map((poolKey) => (
                          <div key={poolKey.id} className={`bg-gray-950 border rounded-xl p-4 transition-all ${poolKey.enabled === false ? 'opacity-60 grayscale border-gray-800' : 'border-gray-800 hover:border-gray-700'}`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-grow">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-bold text-white">{poolKey.label}</h4>
                                  <button 
                                    onClick={() => handleTogglePoolKey(poolKey.id, poolKey.enabled !== false ? false : true)}
                                    className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all ${
                                      poolKey.enabled !== false ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500 border border-gray-700'
                                    }`}
                                  >
                                    {poolKey.enabled !== false ? 'Enabled' : 'Disabled'}
                                  </button>
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono mt-1">
                                  {poolKey.key.slice(0, 8)}...{poolKey.key.slice(-6)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => fetchPoolKeyDetails(poolKey)}
                                  disabled={isFetchingPoolDetails[poolKey.id]}
                                  className="p-2 text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-50"
                                  title="Check Subscription"
                                >
                                  <RefreshCw className={`w-4 h-4 ${isFetchingPoolDetails[poolKey.id] ? 'animate-spin' : ''}`} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteFromPool(poolKey.id)}
                                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                  title="Remove from Pool"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {poolKeyDetails[poolKey.id] && (
                              <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[8px] font-bold text-gray-500 uppercase">Left</p>
                                  <p className="text-[10px] font-bold text-blue-400">
                                    {poolKeyDetails[poolKey.id].subscription?.remaining_characters?.toLocaleString() || '0'}
                                  </p>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[8px] font-bold text-gray-500 uppercase">Tier</p>
                                  <p className="text-[8px] font-bold text-purple-400 uppercase truncate">
                                    {poolKeyDetails[poolKey.id].subscription?.tier}
                                  </p>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[8px] font-bold text-gray-500 uppercase">Voices</p>
                                  <p className="text-[10px] font-bold text-emerald-400">
                                    {poolKeyDetails[poolKey.id].voicesCount}
                                  </p>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[8px] font-bold text-gray-500 uppercase">History</p>
                                  <p className="text-[10px] font-bold text-orange-400">
                                    {poolKeyDetails[poolKey.id].historyCount}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            <div className="pt-3 border-t border-gray-800">
                              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                <Database className="w-3 h-3" />
                                Assign to Active Slot
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {[0, 1, 2, 3, 4].map((idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleAssignToSlot(idx, poolKey.key, poolKey.label)}
                                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-[10px] font-bold text-gray-300 transition-all flex items-center gap-1"
                                  >
                                    Slot {idx + 1}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* History Modal */}
              {showHistoryModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="bg-gray-900 border border-gray-800 rounded-[24px] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <History className="w-6 h-6 text-orange-500" />
                          Audio Output History
                        </h2>
                        <p className="text-sm text-gray-500">View and download your past generations</p>
                      </div>
                      <button 
                        onClick={() => {
                          setShowHistoryModal(false);
                          setHistoryKey(null);
                        }}
                        className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                      {isFetchingHistory ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                          <p className="text-gray-400 font-medium">Fetching history from ElevenLabs...</p>
                        </div>
                      ) : historyItems.length === 0 ? (
                        <div className="text-center py-20">
                          <p className="text-gray-500 italic">No history items found for this account.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-4 mb-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                              <div className="flex-grow relative min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                  type="text"
                                  placeholder="Search history text, voice or model..."
                                  className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                  value={historySearchQuery}
                                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Voice:</span>
                                <select 
                                  value={historyVoiceFilter}
                                  onChange={(e) => setHistoryVoiceFilter(e.target.value)}
                                  className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                >
                                  <option value="all">All Voices</option>
                                  {uniqueVoicesInHistory.map(voice => (
                                    <option key={voice} value={voice}>{voice}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">From:</span>
                                <input 
                                  type="date"
                                  value={historyDateFrom}
                                  onChange={(e) => setHistoryDateFrom(e.target.value)}
                                  className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">To:</span>
                                <input 
                                  type="date"
                                  value={historyDateTo}
                                  onChange={(e) => setHistoryDateTo(e.target.value)}
                                  className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  setHistorySearchQuery('');
                                  setHistoryVoiceFilter('all');
                                  setHistoryDateFrom('');
                                  setHistoryDateTo('');
                                }}
                                className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase"
                              >
                                Reset
                              </button>
                            </div>

                            <div className="flex justify-between items-center mb-4 px-2">
                              <p className="text-sm text-gray-400 font-medium">
                                Showing <span className="text-blue-400">{filteredHistoryItems.length}</span> of <span className="text-gray-300">{historyItems.length}</span> outputs
                              </p>
                              <button 
                                onClick={() => fetchHistory()}
                                className="text-xs font-bold text-blue-400 flex items-center gap-1 hover:text-blue-300 transition-colors"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Refresh
                              </button>
                            </div>
                            {filteredHistoryItems.map((item) => (
                              <div key={item.history_item_id} className="bg-gray-950 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group/item">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-grow min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                        {item.voice_name}
                                      </span>
                                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                        {item.model_id}
                                      </span>
                                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                        {(item.character_count_change_to - item.character_count_change_from)?.toLocaleString() || item.character_count_change?.toLocaleString() || 0} chars
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-mono ml-auto">
                                        {new Date(item.date_unix * 1000).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-300 line-clamp-3 italic bg-gray-900/30 p-3 rounded-lg border border-gray-800/50 group-hover/item:border-gray-700 transition-colors">"{item.text}"</p>
                                  </div>
                                <button 
                                  onClick={() => downloadHistoryItem(item.history_item_id, `ElevenLabs-${item.voice_name}-${item.history_item_id}`)}
                                  className="p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-blue-400 transition-all group"
                                  title="Download Audio"
                                >
                                  <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-800 bg-gray-950/50 flex justify-center">
                      <button 
                        onClick={() => {
                          setShowHistoryModal(false);
                          setHistoryKey(null);
                        }}
                        className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
                      >
                        Close History
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Managed Keys List */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <h3 className="text-lg font-bold text-white">Environment API Keys</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">({filteredAdminKeys.length} / {envKeys.length})</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Tier:</span>
                      <select 
                        value={adminTierFilter}
                        onChange={(e) => setAdminTierFilter(e.target.value)}
                        className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
                      >
                        <option value="all">All Tiers</option>
                        {Array.from(new Set((Object.values(adminKeyDetails) as AdminKey[]).map(k => k.subscription?.tier).filter(Boolean))).map(tier => (
                          <option key={tier} value={tier}>{tier}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Status:</span>
                      <select 
                        value={adminStatusFilter}
                        onChange={(e) => setAdminStatusFilter(e.target.value)}
                        className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="trialing">Trialing</option>
                        <option value="past_due">Past Due</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </div>
                    {(adminTierFilter !== 'all' || adminStatusFilter !== 'all') && (
                      <button 
                        onClick={() => {
                          setAdminTierFilter('all');
                          setAdminStatusFilter('all');
                        }}
                        className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase"
                      >
                        Clear
                      </button>
                    )}
                    <div className="h-4 w-px bg-gray-800 mx-1 hidden md:block"></div>
                    {envKeys.length > 0 && (
                      <button 
                        onClick={refreshAllKeys}
                        disabled={isRefreshingAll}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                        Refresh All
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  {filteredAdminKeys.length === 0 ? (
                    <p className="text-center py-8 text-gray-600 italic">No keys match the current filters or not yet loaded.</p>
                  ) : (
                    filteredAdminKeys.map((keyObj: AdminKey) => (
                      <div key={keyObj.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white">{keyObj.label}</h4>
                              {keyObj.isValid === true && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                              {keyObj.isValid === false && <X className="w-4 h-4 text-red-500" />}
                            </div>
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-gray-500" />
                                <p className="text-xs text-gray-400 font-medium">Name: {keyObj.firstName || 'Unknown'}</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-600 font-mono mt-1">Index: {keyObj.id}</p>
                            
                            {keyObj.subscription && (
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Left</p>
                                  <p className="text-xs font-bold text-blue-400">
                                    {keyObj.subscription.remaining_characters?.toLocaleString() || '0'}
                                  </p>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Used</p>
                                  <p className="text-xs font-bold text-purple-400">
                                    {keyObj.subscription.character_count?.toLocaleString() || '0'}
                                  </p>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Total</p>
                                  <p className="text-xs font-bold text-emerald-400 truncate">
                                    {keyObj.subscription.character_limit?.toLocaleString() || '0'}
                                  </p>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Tier</p>
                                  <p className="text-[10px] font-bold text-blue-400 uppercase truncate">
                                    {keyObj.subscription.tier}
                                  </p>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Status</p>
                                  <p className={`text-[10px] font-bold uppercase truncate ${
                                    keyObj.subscription.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                                  }`}>
                                    {keyObj.subscription.status}
                                  </p>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Items</p>
                                  <p className="text-xs font-bold text-orange-400">
                                    {keyObj.historyCount || 0}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setHistoryKey(keyObj.id);
                                    setShowHistoryModal(true);
                                    fetchHistory(keyObj.id);
                                  }}
                                  className="bg-orange-500/10 hover:bg-orange-500/20 p-2 rounded-lg border border-orange-500/30 transition-all flex flex-col items-center justify-center group"
                                >
                                  <History className="w-3 h-3 text-orange-500 group-hover:scale-110 transition-transform" />
                                  <p className="text-[10px] font-bold text-orange-400 uppercase mt-1">History</p>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => refreshKeyDetails(parseInt(keyObj.id))}
                              className="p-2 text-gray-600 hover:text-blue-400 transition-colors"
                              title="Refresh Stats"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script Input */}
        <section className="lg:col-span-7">
          <div className="bg-gray-900 border border-gray-800 rounded-[18px] p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-100">Script Input</h2>
              <button 
                onClick={handleClearText}
                className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors uppercase tracking-wider"
              >
                Clear Text
              </button>
            </div>
            <textarea
              id="tts-text"
              className="w-full h-[500px] bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono text-sm leading-relaxed"
              placeholder="Paste your YouTube script or type narration text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-400 font-medium">
              <div className="bg-gray-800/50 px-3 py-1 rounded-full">Words: <span className="text-blue-400">{words}</span></div>
              <div className="bg-gray-800/50 px-3 py-1 rounded-full">Chars: <span className="text-blue-400">{chars}</span></div>
              <div className="bg-gray-800/50 px-3 py-1 rounded-full">Estimated: <span className="text-blue-400">{estimatedMin} min</span></div>
            </div>
          </div>
        </section>

        {/* Right Column */}
        <aside className="lg:col-span-5 space-y-6">
          {/* Credits Remaining Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-[18px] p-6 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-300">
                  Quota ({envKeys.find(k => k.index === selectedAccountIndex)?.label || `Account ${selectedAccountIndex + 1}`})
                </h2>
                {userInfo && (
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                    {userInfo.first_name || 'User'}
                  </p>
                )}
              </div>
              {isFetchingSubscription && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            </div>
            
            {subscription ? (
              <>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-white tabular-nums">
                    {subscription.remaining_characters?.toLocaleString() || '0'}
                  </span>
                  <span className="text-gray-500 ml-2 font-medium">chars left</span>
                </div>
                <div className="text-sm text-gray-400 mb-4 flex justify-between">
                  <span>Used: <span className="text-blue-400">{subscription.character_count?.toLocaleString() || '0'}</span></span>
                  <span>Limit: <span className="text-gray-300">{subscription.character_limit?.toLocaleString() || '0'}</span></span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden mb-2">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(subscription.remaining_characters / subscription.character_limit) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                  <span>Tier: <span className="text-purple-400">{subscription.tier}</span></span>
                  <span>Status: <span className={subscription.status === 'active' ? 'text-green-400' : 'text-yellow-400'}>{subscription.status}</span></span>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-gray-600 italic text-sm">
                {isFetchingSubscription ? 'Loading quota...' : 'Quota info unavailable'}
              </div>
            )}
          </div>

          {/* Voice & Settings Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-[18px] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-400" />
              Voice & Settings <span className="text-xs text-gray-500 font-normal">({filteredVoices.length} available)</span>
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key Slots</span>
                  <div className="flex gap-1">
                    {envKeys.map((k) => (
                      <button
                        key={k.index}
                        onClick={() => setSelectedAccountIndex(k.index)}
                        className={`px-2 h-8 flex items-center justify-center rounded-md text-[10px] font-bold transition-all ${
                          selectedAccountIndex === k.index ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                        }`}
                        title={k.label}
                      >
                        {k.index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="voice-search"
                  type="text"
                  placeholder="Search voices or enter code..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchVoices}
                  disabled={isFetchingVoices}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-gray-950 border-gray-800 text-blue-400 hover:border-blue-500/50 flex items-center justify-center gap-1"
                >
                  {isFetchingVoices ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Refresh
                </button>
                <button
                  onClick={() => setShowLibraryModal(true)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-gray-950 border-gray-800 text-purple-400 hover:border-purple-500/50 flex items-center justify-center gap-1"
                >
                  <Library className="w-3 h-3" />
                  Library
                </button>
                <button
                  onClick={() => setShowCloneModal(true)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-gray-950 border-gray-800 text-emerald-400 hover:border-emerald-500/50 flex items-center justify-center gap-1"
                >
                  <Mic className="w-3 h-3" />
                  Clone
                </button>
              </div>

              <div className="flex gap-2">
                {(['all', 'male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                      genderFilter === g
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1 ${
                    showFavoritesOnly
                      ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
                      : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}
                >
                  <Star className={`w-3 h-3 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                  Favs
                </button>
              </div>
              
              <div className="flex gap-2">
                <select
                  id="voice-select"
                  className="flex-grow bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none cursor-pointer"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  {filteredVoices.map(v => (
                    <option key={v.id} value={v.id}>
                      {favorites.has(v.id) ? '★ ' : ''}
                      {v.gender === 'male' ? '♂ ' : v.gender === 'female' ? '♀ ' : ''}
                      {v.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => toggleFavorite(selectedVoice)}
                  title="Toggle Favorite"
                  className={`p-2 rounded-lg border transition-all ${
                    favorites.has(selectedVoice)
                      ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500'
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Star className={`w-5 h-5 ${favorites.has(selectedVoice) ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handlePreview}
                  disabled={isPreviewing}
                  title="Preview Voice"
                  className={`p-2 rounded-lg border transition-all ${
                    isPreviewing
                      ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600/10 border-blue-500/50 text-blue-400 hover:bg-blue-600/20'
                  }`}
                >
                  {isPreviewing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 fill-current" />
                  )}
                </button>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4 pt-2 border-t border-gray-800">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Model</label>
                  <select
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none cursor-pointer"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option value="eleven_multilingual_v2">Eleven Multilingual v2</option>
                    <option value="eleven_flash_v2_5">Eleven Flash v2.5</option>
                    <option value="eleven_turbo_v2_5">Eleven Turbo v2.5</option>
                  </select>
                </div>
              </div>

              <button
                id="generate-btn"
                disabled={isGenerating}
                onClick={generateAllAudio}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  isGenerating 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 active:scale-[0.98]'
                }`}
              >
                {isGenerating ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                ) : null}
                Generate Voice
              </button>

              <div id="status" className={`text-center text-sm font-medium ${status.includes('Error') ? 'text-red-400' : status.includes('Done') ? 'text-green-400' : 'text-blue-400'}`}>
                {status}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Audio Output Container */}
      <section className="mt-8">
        <div className="bg-gray-900 border border-gray-800 rounded-[18px] p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-100">Audio Outputs</h2>
            <button
              id="download-full"
              disabled={audioParts.length === 0 || isGenerating}
              onClick={downloadFullAudio}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                audioParts.length > 0 && !isGenerating
                  ? 'bg-green-600 hover:bg-green-500 border-green-500 text-white active:scale-95'
                  : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Download Full Audio (All Parts)
            </button>
          </div>

          <div id="audio-list" className="space-y-4">
            {audioParts.length === 0 ? (
              <div className="text-center py-12 text-gray-600 font-medium italic">
                No audio parts generated yet.
              </div>
            ) : (
              audioParts.map((part) => (
                <div key={part.partNumber} className="flex flex-col md:flex-row items-center gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800 hover:border-blue-900/50 transition-colors">
                  <div className="flex-shrink-0 w-24">
                    <span className="text-xs font-black text-blue-500 uppercase">Part {part.partNumber}</span>
                  </div>
                  <div className="flex-grow w-full">
                    <audio controls src={part.url} className="w-full h-8" />
                  </div>
                  <div className="flex-shrink-0">
                    <a
                      href={part.url}
                      download={`mahtab-i2-part-${part.partNumber}.mp3`}
                      className="text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors border border-gray-700"
                    >
                      Download MP3
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      </>
      )}

      <footer className="mt-12 text-center text-gray-600 text-sm font-medium border-t border-gray-800 pt-8 pb-4">
        <div className="flex flex-col items-center gap-2">
          <span>{APP_NAME} (For my own YouTube work)</span>
          <button 
            onClick={() => setIsAdminMode(!isAdminMode)}
            className="text-[10px] text-gray-700 hover:text-blue-500 transition-colors uppercase tracking-widest"
          >
            {isAdminMode ? 'Back to Main' : 'Admin Access'}
          </button>
        </div>
      </footer>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2 flex items-center justify-between z-50">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className={`w-2 h-2 rounded-full ${status.includes('Error') ? 'bg-red-500' : status.includes('...') ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          {status}
        </div>
        <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
          {AUTHOR_TAG}
        </div>
      </div>

      {/* Voice Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setShowLibraryModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                <Library className="w-6 h-6 text-purple-400" />
                Voice Library
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {(['all', 'favorites', 'custom'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setLibraryTab(tab)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                        libraryTab === tab
                          ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                          : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 items-end bg-gray-950 p-3 rounded-xl border border-gray-800">
                  <div className="flex-grow space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Import by ID</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Voice ID" 
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none"
                        value={importVoiceId}
                        onChange={(e) => setImportVoiceId(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Display Name" 
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none"
                        value={importVoiceName}
                        onChange={(e) => setImportVoiceName(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleImportVoice}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {voices
                .filter(v => {
                  if (libraryTab === 'favorites') return favorites.has(v.id);
                  if (libraryTab === 'custom') return v.isCustom;
                  return true;
                })
                .filter(v => {
                  const search = voiceSearch.toLowerCase();
                  return v.label.toLowerCase().includes(search) || v.id.toLowerCase().includes(search);
                })
                .map((v) => (
                  <div 
                    key={v.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      selectedVoice === v.id 
                        ? 'bg-purple-600/10 border-purple-500/50' 
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleFavorite(v.id)}
                        className={`transition-colors ${favorites.has(v.id) ? 'text-yellow-500' : 'text-gray-700 hover:text-gray-500'}`}
                      >
                        <Star className={`w-5 h-5 ${favorites.has(v.id) ? 'fill-current' : ''}`} />
                      </button>
                      <div>
                        <div className="text-sm font-bold text-gray-100 flex items-center gap-2">
                          {v.label}
                          {v.isCustom && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Custom</span>}
                        </div>
                        <div className="text-[10px] text-gray-600 font-mono">{v.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedVoice(v.id);
                          setShowLibraryModal(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                          selectedVoice === v.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                        }`}
                      >
                        {selectedVoice === v.id ? 'Selected' : 'Select'}
                      </button>
                      {v.isCustom && (
                        <button
                          onClick={() => deleteCustomVoice(v.id)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              
              {voices.filter(v => {
                if (libraryTab === 'favorites') return favorites.has(v.id);
                if (libraryTab === 'custom') return v.isCustom;
                return true;
              }).length === 0 && (
                <div className="text-center py-12 text-gray-600 italic">
                  No voices found in this category.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Cloning Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowCloneModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
              <Mic className="w-6 h-6 text-emerald-400" />
              Clone New Voice
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Name
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. My Custom Voice"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    value={cloneName}
                    onChange={(e) => setCloneName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Language
                  </label>
                  <select 
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    value={cloneLanguage}
                    onChange={(e) => setCloneLanguage(e.target.value)}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="it-IT">Italian</option>
                    <option value="pt-BR">Portuguese</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tags (Optional)
                </label>
                <input 
                  type="text"
                  placeholder="e.g. energetic, young, professional"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  value={cloneTags}
                  onChange={(e) => setCloneTags(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <input 
                  type="text"
                  placeholder="Describe the voice character..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  value={cloneDescription}
                  onChange={(e) => setCloneDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Samples
                </label>
                <p className="text-[10px] text-gray-500 mb-2">
                  Add up to 3 samples, and we'll pick the best one to create your voice.
                </p>
                <div className="relative">
                  <input 
                    type="file"
                    multiple
                    accept=".wav,.mp3,.webm"
                    className="hidden"
                    id="clone-files"
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files).slice(0, 3);
                        setCloneFiles(files);
                      }
                    }}
                  />
                  <label 
                    htmlFor="clone-files"
                    className="w-full bg-gray-950 border border-dashed border-gray-800 rounded-lg px-4 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500/30 transition-all group"
                  >
                    <Upload className="w-6 h-6 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-sm text-gray-500 text-center">
                      {cloneFiles.length > 0 
                        ? `${cloneFiles.length} files selected` 
                        : 'Drag and drop or browse to upload files'}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      Accepts: wav, mp3, webm. Max 3 files.
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox"
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-800 bg-gray-950 checked:bg-emerald-600 checked:border-emerald-600 transition-all"
                      checked={removeBackgroundNoise}
                      onChange={(e) => setRemoveBackgroundNoise(e.target.checked)}
                    />
                    <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Remove background noise</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    <input 
                      type="checkbox"
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-800 bg-gray-950 checked:bg-emerald-600 checked:border-emerald-600 transition-all"
                      checked={legalConsent}
                      onChange={(e) => setLegalConsent(e.target.checked)}
                    />
                    <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-[10px] leading-tight text-gray-500 group-hover:text-gray-400 transition-colors">
                    By using voice cloning, you certify that you have all legal consents/rights to clone these voice samples and that you will not use anything generated for illegal or harmful purposes.
                  </span>
                </label>
              </div>

              <button
                onClick={handleCloneVoice}
                disabled={isCloning || !cloneName || cloneFiles.length === 0 || !legalConsent}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-900/20"
              >
                {isCloning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    Continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
