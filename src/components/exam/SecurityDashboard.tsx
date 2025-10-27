import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  User, 
  FileText,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';

interface SecurityViolationRecord {
  id: string;
  exam_session_id: string;
  violation_type: string;
  violation_details: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  created_at: string;
  exam_session?: {
    exam_token: string;
    candidate?: {
      name: string;
      email: string;
    };
    job_description?: {
      title: string;
    };
  };
}

interface SecurityDashboardProps {
  examSessionId?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ examSessionId }) => {
  const [violations, setViolations] = useState<SecurityViolationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    severity?: 'low' | 'medium' | 'high';
    type?: string;
    dateRange?: { start: string; end: string };
  }>({});

  useEffect(() => {
    loadViolations();
  }, [examSessionId, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadViolations = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('exam_security_violations')
        .select(`
          *,
          exam_session:exam_sessions(
            exam_token,
            candidate:candidates(name, email),
            job_description:job_descriptions(title)
          )
        `)
        .order('timestamp', { ascending: false });

      // Apply filters
      if (examSessionId) {
        query = query.eq('exam_session_id', examSessionId);
      }

      if (filter.severity) {
        query = query.eq('severity', filter.severity);
      }

      if (filter.type) {
        query = query.eq('violation_type', filter.type);
      }

      if (filter.dateRange?.start) {
        query = query.gte('timestamp', filter.dateRange.start);
      }

      if (filter.dateRange?.end) {
        query = query.lte('timestamp', filter.dateRange.end);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setViolations(data || []);
    } catch (err) {
      console.error('Error loading security violations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load violations');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'key_press': return '⌨️';
      case 'tab_switch': return '🔄';
      case 'window_resize': return '📏';
      case 'context_menu': return '🖱️';
      case 'dev_tools': return '🔧';
      default: return '⚠️';
    }
  };

  const getViolationTypeLabel = (type: string) => {
    switch (type) {
      case 'key_press': return 'Disabled Key Press';
      case 'tab_switch': return 'Tab Switch/Minimize';
      case 'window_resize': return 'Window Resize';
      case 'context_menu': return 'Right-Click Menu';
      case 'dev_tools': return 'Developer Tools';
      default: return type;
    }
  };

  const exportViolations = () => {
    const csvContent = [
      ['Timestamp', 'Candidate', 'Exam Token', 'Violation Type', 'Severity', 'Details'].join(','),
      ...violations.map(v => [
        new Date(v.timestamp).toLocaleString(),
        v.exam_session?.candidate?.name || 'Unknown',
        v.exam_session?.exam_token || 'N/A',
        getViolationTypeLabel(v.violation_type),
        v.severity,
        `"${v.violation_details.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-violations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const violationStats = violations.reduce((acc, v) => {
    acc.total++;
    acc[v.severity]++;
    acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
    return acc;
  }, {
    total: 0,
    high: 0,
    medium: 0,
    low: 0
  } as any);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading security violations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security Violations</h2>
            <p className="text-sm text-gray-600">Monitor exam security and anti-cheating measures</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadViolations}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportViolations}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Violations</p>
              <p className="text-2xl font-semibold text-gray-900">{violationStats.total}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Severity</p>
              <p className="text-2xl font-semibold text-red-600">{violationStats.high}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">!</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Medium Severity</p>
              <p className="text-2xl font-semibold text-yellow-600">{violationStats.medium}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold">!</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Severity</p>
              <p className="text-2xl font-semibold text-green-600">{violationStats.low}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <select
            value={filter.severity || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value as any || undefined }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filter.type || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value || undefined }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            <option value="key_press">Key Press</option>
            <option value="tab_switch">Tab Switch</option>
            <option value="window_resize">Window Resize</option>
            <option value="context_menu">Context Menu</option>
            <option value="dev_tools">Developer Tools</option>
          </select>
        </div>
      </div>

      {/* Violations List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {violations.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Violations Found</h3>
            <p className="text-gray-600">No security violations have been detected for the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Violation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {violations.map((violation) => (
                  <tr key={violation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{new Date(violation.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{violation.exam_session?.candidate?.name || 'Unknown'}</div>
                          <div className="text-gray-500">{violation.exam_session?.candidate?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{violation.exam_session?.job_description?.title || 'Unknown Job'}</div>
                          <div className="text-gray-500 text-xs">{violation.exam_session?.exam_token || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getViolationIcon(violation.violation_type)}</span>
                        <span>{getViolationTypeLabel(violation.violation_type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                        {violation.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={violation.violation_details}>
                        {violation.violation_details}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
