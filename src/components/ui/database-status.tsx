'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Database, CheckCircle2, XCircle } from 'lucide-react';

export function DatabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'initializing' | 'error'>('checking');
  const [message, setMessage] = useState<string>('Checking system status...');
  const statusRef = useRef(status);

  // Keep ref in sync with status
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    async function checkDatabaseStatus() {
      try {
        setStatus('checking');
        const response = await fetch('/api/system/health');
        
        if (!response.ok) {
          setStatus('error');
          setMessage('System health check failed');
          return;
        }
        
        const data = await response.json();
        
        // Parse the new health API response format
        if (data.status === 'healthy') {
          setStatus('ready');
          setMessage('System ready');
        } else if (data.status === 'degraded') {
          setStatus('initializing');
          setMessage('System degraded - some services may be slow');
        } else if (data.status === 'unhealthy') {
          setStatus('error');
          // Find the specific issue causing unhealthy status
          const unhealthyChecks = [];
          if (data.checks?.database?.status === 'unhealthy') {
            unhealthyChecks.push('database');
          }
          if (data.checks?.memory?.status === 'unhealthy') {
            unhealthyChecks.push('memory');
          }
          if (data.checks?.services?.status === 'unhealthy') {
            unhealthyChecks.push('services');
          }
          if (data.checks?.environment?.status === 'unhealthy') {
            unhealthyChecks.push('environment');
          }
          
          if (unhealthyChecks.length > 0) {
            setMessage(`System unhealthy: ${unhealthyChecks.join(', ')} issues`);
          } else {
            setMessage('System unhealthy - check logs');
          }
        } else {
          setStatus('error');
          setMessage('System status unknown');
        }
      } catch (error) {
        console.error('Error checking system health:', error);
        setStatus('error');
        setMessage('Cannot connect to system');
      }
    }
    
    // Initial check
    checkDatabaseStatus();
    
    // Check again after 30 seconds if status is not ready
    const interval = setInterval(() => {
      if (statusRef.current !== 'ready') {
        checkDatabaseStatus();
      }
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
    
  }, []); // Empty dependencies - only run once on mount

  if (status === 'ready') {
    return (
      <div className="flex items-center text-green-600 text-sm">
        <CheckCircle2 className="h-4 w-4 mr-1" />
        <span>System ready</span>
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center text-blue-600 text-sm">
        <Database className="h-4 w-4 mr-1 animate-pulse" />
        <span>Checking system...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center text-red-600 text-sm">
        <XCircle className="h-4 w-4 mr-1" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-yellow-600 text-sm">
      <AlertTriangle className="h-4 w-4 mr-1" />
      <span>System initializing...</span>
    </div>
  );
} 