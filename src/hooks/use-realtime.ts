"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtime() {
  const [isSuspended, setIsSuspended] = useState(false);
  const [currentAction, setCurrentAction] = useState<any>(null);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'session_suspended')
        .single();
      
      if (settings) setIsSuspended(settings.value === true);

      const { data: action } = await supabase
        .from('actions')
        .select('*')
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (action) setCurrentAction(action);
    };

    fetchData();

    // Settings subscription
    const settingsSub = supabase
      .channel('settings_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, payload => {
        if (payload.new.key === 'session_suspended') {
          setIsSuspended(payload.new.value === true);
        }
      })
      .subscribe();

    // Actions subscription
    const actionsSub = supabase
      .channel('actions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'actions' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setCurrentAction(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSub);
      supabase.removeChannel(actionsSub);
    };
  }, []);

  return { isSuspended, currentAction };
}