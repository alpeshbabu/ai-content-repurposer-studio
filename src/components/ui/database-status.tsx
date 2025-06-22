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
        
        // Parse the enhanced health API response format
        if (data.status === 'healthy') {
          setStatus('ready');
          setMessage(data.diagnostics?.overall_message || 'System ready');
        } else if (data.status === 'degraded') {
          setStatus('initializing');
          
          // Use enhanced diagnostics for more specific messaging
          if (data.diagnostics?.priority_issues?.length > 0) {
            const primaryIssue = data.diagnostics.priority_issues[0];
            setMessage(`${primaryIssue.component}: ${primaryIssue.message.replace(/[🟡🔴✅]/g, '').trim()}`);
          } else if (data.diagnostics?.overall_message) {
            setMessage(data.diagnostics.overall_message.replace(/[🟡🔴✅]/g, '').trim());
          } else {
            setMessage('System degraded - some services may be slow');
          }
        } else if (data.status === 'unhealthy') {
          setStatus('error');
          
          // Use enhanced diagnostics for specific error messaging
          if (data.diagnostics?.priority_issues?.length > 0) {
            const criticalIssue = data.diagnostics.priority_issues[0];
            const actionableStep = criticalIssue.actionable_steps?.[0] || 'Check system logs for details';
            setMessage(`${criticalIssue.component} failed: ${actionableStep.replace(/^\d+\.\s*/, '')}`);
          } else if (data.diagnostics?.overall_message) {
            setMessage(data.diagnostics.overall_message.replace(/[🟡🔴✅]/g, '').trim());
          } else {
            // Legacy fallback
            const unhealthyChecks = [];
            if (data.checks?.database?.status === 'unhealthy') {
              unhealthyChecks.push('database connection');
            }
            if (data.checks?.memory?.status === 'unhealthy') {
              unhealthyChecks.push('memory usage critical');
            }
            if (data.checks?.services?.status === 'unhealthy') {
              unhealthyChecks.push('external services');
            }
            if (data.checks?.environment?.status === 'unhealthy') {
              unhealthyChecks.push('environment config');
            }
            
            if (unhealthyChecks.length > 0) {
              setMessage(`Issues found: ${unhealthyChecks.join(', ')}`);
            } else {
              setMessage('System unhealthy - check application logs');
            }
          }
        } else {
          setStatus('error');
          setMessage('System status unknown - health check failed');
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