/**
 * AuraSync — Supabase Service
 */
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'
);

async function getOrCreateProfile(userId, metadata = {}) {
  const { data: existing } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
  if (existing) return existing;
  const { data, error } = await supabase.from('profiles').insert({
    user_id: userId, display_name: metadata.displayName || 'AuraSync User',
    resilience_score: 70, current_streak: 0, total_check_ins: 0,
    subscription_tier: 'free', trial_start_date: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data;
}

async function updateResilienceScore(userId, scoreDelta) {
  const profile = await getOrCreateProfile(userId);
  const newScore = Math.max(0, Math.min(100, profile.resilience_score + scoreDelta));
  const newStreak = profile.current_streak + 1;
  const newCheckIns = profile.total_check_ins + 1;
  const { data, error } = await supabase.from('profiles').update({ 
    resilience_score: newScore,
    current_streak: newStreak,
    total_check_ins: newCheckIns
  }).eq('user_id', userId).select().single();
  if (error) throw error;
  return data;
}

async function logStressEvent(userId, eventData) {
  const { data, error } = await supabase.from('stress_events').insert({
    user_id: userId, stress_level: eventData.stressLevel, stress_state: eventData.stressState,
    typing_cadence: eventData.typingCadence, scroll_speed: eventData.scrollSpeed,
    app_switch_freq: eventData.appSwitchFreq, day_of_week: new Date().getDay(),
    hour_of_day: new Date().getHours(), created_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data;
}

async function getStressTriggers(userId) {
  const { data } = await supabase.from('stress_events').select('stress_state, day_of_week, hour_of_day')
    .eq('user_id', userId).in('stress_state', ['STRESSED', 'SPIRALING']).order('created_at', { ascending: false }).limit(100);
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const map = {};
  (data || []).forEach(e => { const k = `${e.day_of_week}-${e.hour_of_day}`; map[k] = (map[k]||0)+1; });
  return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,5).map(([key, count]) => {
    const [day, hour] = key.split('-').map(Number);
    const h = hour > 12 ? hour-12 : hour; const ampm = hour >= 12 ? 'PM' : 'AM';
    return { day: dayNames[day], hour, timeLabel: `${h}${ampm}`, frequency: count, description: `${dayNames[day]}s at ${h}${ampm}` };
  });
}

async function logNudge(userId, nudgeData) {
  const { data, error } = await supabase.from('nudge_history').insert({
    user_id: userId, nudge_type: nudgeData.type, nudge_content: nudgeData.content,
    stress_state_at_time: nudgeData.stressState, was_opened: false,
  }).select().single();
  if (error) throw error;
  return data;
}

async function getWeeklyData(userId) {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const { data } = await supabase.from('stress_events').select('*').eq('user_id', userId)
    .gte('created_at', weekAgo.toISOString()).order('created_at', { ascending: true });
  return data || [];
}

module.exports = { supabase, getOrCreateProfile, updateResilienceScore, logStressEvent, getStressTriggers, logNudge, getWeeklyData };
