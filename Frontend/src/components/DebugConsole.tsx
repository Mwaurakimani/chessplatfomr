import React, { useState, useEffect } from 'react';
import debugService from '@/services/debugService';

const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update logs every second when visible
    let interval: NodeJS.Timeout;
    if (isVisible) {
      interval = setInterval(() => {
        setLogs(debugService.getLogs());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded text-xs z-50"
      >
        Show Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-64 bg-black text-green-400 p-2 rounded border text-xs overflow-hidden z-50 font-mono">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-bold">Payment Debug Console</span>
        <div className="space-x-2">
          <button
            onClick={() => {
              debugService.clearLogs();
              setLogs([]);
            }}
            className="text-red-400 hover:text-red-300"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="overflow-y-auto h-48 scrollbar-thin scrollbar-thumb-gray-600">
        {logs.map((log, index) => (
          <div key={index} className="mb-1 break-words">
            {log}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500">No logs yet...</div>
        )}
      </div>
    </div>
  );
};

export default DebugConsole;