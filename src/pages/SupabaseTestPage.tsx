import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { testSupabaseConnection, checkTableStructure } from '../utils/supabaseTest';
import { testJobDescriptionsTable, getJobDescriptionsTableSQL } from '../utils/jobDescriptionsTest';
import { CheckCircle, XCircle, AlertCircle, Database, Table } from 'lucide-react';

const SupabaseTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [tableStructures, setTableStructures] = useState<{[key: string]: any}>({});
  const [jobDescriptionsResult, setJobDescriptionsResult] = useState<any>(null);

  const handleTestConnection = async () => {
    setLoading(true);
    setConnectionResult(null);
    setTableStructures({});
    setJobDescriptionsResult(null);
    
    try {
      const result = await testSupabaseConnection();
      setConnectionResult(result);
      
      // If connection successful, check structure of existing tables
      if (result.success && result.existingTables) {
        const structures: {[key: string]: any} = {};
        for (const tableName of result.existingTables) {
          const structure = await checkTableStructure(tableName);
          structures[tableName] = structure;
        }
        setTableStructures(structures);
      }
    } catch (error) {
      setConnectionResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestJobDescriptions = async () => {
    setLoading(true);
    setJobDescriptionsResult(null);
    
    try {
      const result = await testJobDescriptionsTable();
      setJobDescriptionsResult(result);
    } catch (error) {
      console.error('Error testing job descriptions table:', error);
      setJobDescriptionsResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supabase Connection Test</h1>
          <p className="text-gray-600">Test your Supabase database connection and check table structure</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="primary" 
            onClick={handleTestConnection}
            loading={loading}
            disabled={loading}
          >
            <Database className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTestJobDescriptions}
            loading={loading}
            disabled={loading}
          >
            <Table className="h-4 w-4 mr-2" />
            Test Job Descriptions
          </Button>
        </div>
      </div>

      {/* Connection Test Results */}
      {connectionResult && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionResult.success)}
              <h3 className={`font-semibold ${getStatusColor(connectionResult.success)}`}>
                Connection Status: {connectionResult.success ? 'Success' : 'Failed'}
              </h3>
            </div>

            {connectionResult.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-600">{connectionResult.error}</p>
                </div>
              </div>
            )}

            {connectionResult.success && (
              <div className="space-y-4">
                {/* Available Tables */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Available Tables</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {connectionResult.availableTables?.map((table: string) => (
                      <div key={table} className="bg-gray-100 px-3 py-2 rounded-lg text-sm">
                        {table}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Existing Expected Tables */}
                {connectionResult.existingTables && connectionResult.existingTables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">✅ Expected Tables Found</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {connectionResult.existingTables.map((table: string) => (
                        <div key={table} className="bg-green-100 px-3 py-2 rounded-lg text-sm text-green-800">
                          {table}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Tables */}
                {connectionResult.missingTables && connectionResult.missingTables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">⚠️ Missing Expected Tables</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {connectionResult.missingTables.map((table: string) => (
                        <div key={table} className="bg-yellow-100 px-3 py-2 rounded-lg text-sm text-yellow-800">
                          {table}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Table Structures */}
      {Object.keys(tableStructures).length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Table className="h-5 w-5 mr-2" />
            Table Structures
          </h3>
          <div className="space-y-6">
            {Object.entries(tableStructures).map(([tableName, structure]) => (
              <div key={tableName}>
                <h4 className="font-medium text-gray-800 mb-2">{tableName}</h4>
                {structure.success ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nullable</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {structure.columns?.map((column: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{column.column_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{column.data_type}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{column.is_nullable}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{column.column_default || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">Error: {structure.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Job Descriptions Test Results */}
      {jobDescriptionsResult && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(jobDescriptionsResult.success)}
              <h3 className={`font-semibold ${getStatusColor(jobDescriptionsResult.success)}`}>
                Job Descriptions Table: {jobDescriptionsResult.success ? 'Ready' : 'Not Found'}
              </h3>
            </div>

            {jobDescriptionsResult.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-600">{jobDescriptionsResult.error}</p>
                </div>
              </div>
            )}

            {jobDescriptionsResult.success && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800">Table Status</p>
                    <p className="text-sm text-green-600">✅ Table exists and is accessible</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800">Record Count</p>
                    <p className="text-sm text-blue-600">{jobDescriptionsResult.recordCount} job descriptions</p>
                  </div>
                </div>

                {jobDescriptionsResult.missingColumns && jobDescriptionsResult.missingColumns.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Missing Columns:</h4>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {jobDescriptionsResult.missingColumns.map((column: string) => (
                        <li key={column}>{column}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {jobDescriptionsResult.columns && jobDescriptionsResult.columns.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Table Structure:</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {jobDescriptionsResult.columns.map((column: any, index: number) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{column.column_name}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{column.data_type}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{column.is_nullable}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{column.column_default || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {jobDescriptionsResult.sampleData && jobDescriptionsResult.sampleData.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sample Data:</h4>
                    <div className="space-y-2">
                      {jobDescriptionsResult.sampleData.map((job: any, index: number) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{job.title}</h5>
                              <p className="text-sm text-gray-600">{job.department} • {job.location}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              job.status === 'active' ? 'bg-green-100 text-green-800' :
                              job.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!jobDescriptionsResult.tableExists && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Table Not Found</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  The job_descriptions table does not exist. You need to create it first.
                </p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                  <pre className="text-xs">
                    <code>{getJobDescriptionsTableSQL()}</code>
                  </pre>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Copy and paste this SQL script into your Supabase SQL editor to create the table.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Instructions</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>1. Click "Test Connection" to check your Supabase database connection</p>
          <p>2. The test will show all available tables in your database</p>
          <p>3. It will identify which expected tables are present and which are missing</p>
          <p>4. For existing tables, it will show the column structure</p>
          <p>5. Click "Test Job Descriptions" to specifically check the job_descriptions table</p>
          <p>6. If the job_descriptions table doesn't exist, copy the provided SQL script to create it</p>
          <p>7. Check the browser console for detailed logs</p>
        </div>
      </Card>
    </div>
  );
};

export default SupabaseTestPage;
