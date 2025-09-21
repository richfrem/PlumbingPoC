// packages/frontend/src/components/RealtimeDebugger.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface RealtimeEvent {
  timestamp: string;
  eventType: string;
  table: string;
  old?: any;
  new?: any;
}

export function RealtimeDebugger() {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('initializing');

  useEffect(() => {
    console.log('🐛 DEBUGGER: Setting up simplified real-time logger');

    // Use a single channel for all tables
    const channel = supabase.channel('debug-all-tables');

    // Listen to both quotes and requests
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, (payload) => {
        console.log('🐛 DEBUGGER: Quote event:', payload);
        setEvents(prev => [{
          timestamp: new Date().toISOString(),
          eventType: payload.eventType,
          table: 'quotes',
          old: payload.old,
          new: payload.new
        }, ...prev.slice(0, 9)]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        console.log('🐛 DEBUGGER: Request event:', payload);
        setEvents(prev => [{
          timestamp: new Date().toISOString(),
          eventType: payload.eventType,
          table: 'requests',
          old: payload.old,
          new: payload.new
        }, ...prev.slice(0, 9)]);
      })
      .subscribe((status) => {
        console.log('🐛 DEBUGGER: Connection status:', status);
        setConnectionStatus(status);
        
        // Add status to events
        setEvents(prev => [{
          timestamp: new Date().toISOString(),
          eventType: `STATUS_${status}`,
          table: 'connection',
          new: { status }
        }, ...prev.slice(0, 9)]);
      });

    return () => {
      console.log('🐛 DEBUGGER: Cleaning up');
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      left: '10px', 
      width: '400px', 
      backgroundColor: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: '15px', 
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4ade80' }}>
        🐛 Real-time Debugger 
        <span style={{ 
          color: connectionStatus === 'SUBSCRIBED' ? '#10b981' : '#ef4444',
          fontSize: '10px',
          marginLeft: '10px'
        }}>
          [{connectionStatus}]
        </span>
      </h3>
      
      <button 
        onClick={() => {
          console.log('🐛 DEBUGGER: Manual test triggered');
          const testEvent: RealtimeEvent = {
            timestamp: new Date().toISOString(),
            eventType: 'TEST',
            table: 'manual',
            new: { test: 'Manual test at ' + new Date().toLocaleTimeString() }
          };
          setEvents(prev => [testEvent, ...prev.slice(0, 9)]);
        }}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          marginBottom: '10px',
          cursor: 'pointer'
        }}
      >
        Test Debugger
      </button>
      
      {events.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Waiting for real-time events...</p>
      ) : (
        events.map((event, index) => (
          <div key={index} style={{ 
            marginBottom: '10px', 
            padding: '8px', 
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '4px'
          }}>
            <div style={{ color: '#60a5fa' }}>
              {event.eventType} on {event.table}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '10px' }}>
              {new Date(event.timestamp).toLocaleTimeString()}
            </div>
            {event.eventType === 'UPDATE' && (
              <div style={{ marginTop: '5px' }}>
                <div style={{ color: '#fbbf24' }}>Old: {JSON.stringify(event.old)}</div>
                <div style={{ color: '#34d399' }}>New: {JSON.stringify(event.new)}</div>
              </div>
            )}
            {event.eventType === 'INSERT' && (
              <div style={{ color: '#34d399', marginTop: '5px' }}>
                New: {JSON.stringify(event.new)}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}