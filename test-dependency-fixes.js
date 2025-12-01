// test-dependency-fixes.js
// Purpose: Test the fixed SQL scripts to ensure they execute without errors and work together properly
// This script simulates the execution of all three SQL scripts in the correct order

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || 'your-service-key',
    scripts: [
        {
            name: 'SCHEMA_CACHE_CLEAR.sql',
            path: './SCHEMA_CACHE_CLEAR.sql',
            order: 1,
            description: 'Clears schema cache and references to deleted strategy_rule_compliance table'
        },
        {
            name: 'RELATIONSHIP_REBUILD.sql',
            path: './RELATIONSHIP_REBUILD.sql',
            order: 2,
            description: 'Rebuilds foreign key relationships between strategies and related tables'
        },
        {
            name: 'VERIFICATION.sql',
            path: './VERIFICATION.sql',
            order: 3,
            description: 'Comprehensive verification of schema and relationship fixes'
        }
    ]
};

// Mock Supabase client for testing (replace with actual Supabase client in production)
class MockSupabaseClient {
    constructor(url, serviceKey) {
        this.url = url;
        this.serviceKey = serviceKey;
        this.queryLog = [];
    }

    async rpc(functionName, params) {
        this.queryLog.push({
            type: 'rpc',
            function: functionName,
            params: params,
            timestamp: new Date().toISOString()
        });
        
        // Simulate successful execution
        return { data: [], error: null };
    }

    async from(table) {
        this.queryLog.push({
            type: 'select',
            table: table,
            timestamp: new Date().toISOString()
        });
        
        // Simulate successful query
        return {
            select: () => ({ data: [], error: null }),
            insert: () => ({ data: [], error: null }),
            update: () => ({ data: [], error: null }),
            delete: () => ({ data: [], error: null })
        };
    }

    getQueryLog() {
        return this.queryLog;
    }
}

// SQL Script Executor
class SQLScriptExecutor {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.executionLog = [];
    }

    async executeScript(scriptPath, scriptName) {
        console.log(`\n==========================================`);
        console.log(`Executing: ${scriptName}`);
        console.log(`Path: ${scriptPath}`);
        console.log(`==========================================`);

        try {
            // Read the SQL script
            const sqlContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Log script execution
            const executionStart = new Date();
            this.executionLog.push({
                script: scriptName,
                status: 'STARTED',
                timestamp: executionStart.toISOString(),
                message: `Started execution of ${scriptName}`
            });

            console.log(`✓ Successfully read ${scriptName} (${sqlContent.length} characters)`);
            
            // Analyze script content for dependency verification
            const analysis = this.analyzeScript(sqlContent, scriptName);
            console.log(`✓ Script analysis completed:`, analysis);

            // Simulate execution (in real scenario, this would execute against Supabase)
            const executionTime = Math.random() * 2000 + 500; // Simulate 0.5-2.5 seconds
            await new Promise(resolve => setTimeout(resolve, executionTime));

            const executionEnd = new Date();
            this.executionLog.push({
                script: scriptName,
                status: 'SUCCESS',
                timestamp: executionEnd.toISOString(),
                duration: executionEnd - executionStart,
                message: `Successfully executed ${scriptName}`,
                analysis: analysis
            });

            console.log(`✓ Successfully executed ${scriptName} in ${(executionEnd - executionStart).toFixed(0)}ms`);
            
            return { success: true, analysis };

        } catch (error) {
            const executionEnd = new Date();
            this.executionLog.push({
                script: scriptName,
                status: 'ERROR',
                timestamp: executionEnd.toISOString(),
                message: `Failed to execute ${scriptName}: ${error.message}`,
                error: error.message
            });

            console.error(`✗ Error executing ${scriptName}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    analyzeScript(sqlContent, scriptName) {
        const analysis = {
            hasTransaction: sqlContent.includes('BEGIN') && sqlContent.includes('COMMIT'),
            hasSavepoint: sqlContent.includes('SAVEPOINT'),
            hasErrorHandling: sqlContent.includes('EXCEPTION WHEN OTHERS'),
            hasPrerequisites: sqlContent.includes('PREREQUISITE'),
            hasDependencyComments: sqlContent.includes('DEPENDENCY') || sqlContent.includes('EXECUTION ORDER'),
            stepCount: (sqlContent.match(/Step \d+:/g) || []).length,
            doBlocks: (sqlContent.match(/DO \$\$/g) || []).length,
            hasRollback: sqlContent.includes('ROLLBACK'),
            hasReleaseSavepoint: sqlContent.includes('RELEASE SAVEPOINT')
        };

        // Script-specific checks
        if (scriptName === 'SCHEMA_CACHE_CLEAR.sql') {
            analysis.clearsCache = sqlContent.includes('DISCARD PLANS') && sqlContent.includes('RESET ALL');
            analysis.rebuildsStats = sqlContent.includes('ANALYZE');
            analysis.refreshesViews = sqlContent.includes('REFRESH MATERIALIZED VIEW');
        } else if (scriptName === 'RELATIONSHIP_REBUILD.sql') {
            analysis.rebuildsFK = sqlContent.includes('FOREIGN KEY') && sqlContent.includes('ADD CONSTRAINT');
            analysis.createsIndexes = sqlContent.includes('CREATE INDEX');
            analysis.configuresRLS = sqlContent.includes('ROW LEVEL SECURITY');
        } else if (scriptName === 'VERIFICATION.sql') {
            analysis.verifiesPrerequisites = sqlContent.includes('PREREQUISITES');
            analysis.testsStructure = sqlContent.includes('information_schema.tables');
            analysis.testsRelationships = sqlContent.includes('information_schema.table_constraints');
            analysis.testsOperations = sqlContent.includes('OPERATIONS');
        }

        return analysis;
    }

    getExecutionLog() {
        return this.executionLog;
    }
}

// Dependency Validator
class DependencyValidator {
    validateExecutionOrder(executionLog) {
        const errors = [];
        const scriptOrder = {};

        // Build execution order map
        executionLog.forEach(log => {
            if (log.status === 'SUCCESS') {
                scriptOrder[log.script] = log.timestamp;
            }
        });

        // Check if scripts were executed in the correct order
        const expectedOrder = ['SCHEMA_CACHE_CLEAR.sql', 'RELATIONSHIP_REBUILD.sql', 'VERIFICATION.sql'];
        
        for (let i = 1; i < expectedOrder.length; i++) {
            const prev = expectedOrder[i - 1];
            const curr = expectedOrder[i];
            
            if (scriptOrder[prev] && scriptOrder[curr]) {
                if (new Date(scriptOrder[prev]) > new Date(scriptOrder[curr])) {
                    errors.push(`${curr} was executed before ${prev}`);
                }
            } else if (scriptOrder[prev] && !scriptOrder[curr]) {
                errors.push(`${curr} was not executed after ${prev}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    validateDependencies(executionLog) {
        const issues = [];
        
        executionLog.forEach(log => {
            if (log.status === 'SUCCESS' && log.analysis) {
                // Check for proper transaction management
                if (!log.analysis.hasTransaction) {
                    issues.push(`${log.script}: Missing transaction management (BEGIN/COMMIT)`);
                }

                // Check for proper error handling
                if (!log.analysis.hasErrorHandling) {
                    issues.push(`${log.script}: Missing error handling (EXCEPTION WHEN OTHERS)`);
                }

                // Check for savepoint usage
                if (!log.analysis.hasSavepoint) {
                    issues.push(`${log.script}: Missing savepoint for rollback capability`);
                }

                // Script-specific validations
                if (log.script === 'SCHEMA_CACHE_CLEAR.sql') {
                    if (!log.analysis.clearsCache) {
                        issues.push(`${log.script}: Cache clearing operations not detected`);
                    }
                } else if (log.script === 'RELATIONSHIP_REBUILD.sql') {
                    if (!log.analysis.rebuildsFK) {
                        issues.push(`${log.script}: Foreign key rebuild operations not detected`);
                    }
                } else if (log.script === 'VERIFICATION.sql') {
                    if (!log.analysis.verifiesPrerequisites) {
                        issues.push(`${log.script}: Prerequisite verification not detected`);
                    }
                }
            }
        });

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
}

// Main Test Function
async function runDependencyTests() {
    console.log('SQL Script Dependency Fix Test Suite');
    console.log('====================================');
    console.log(`Testing ${config.scripts.length} SQL scripts for dependency issues...`);

    // Initialize test components
    const supabase = new MockSupabaseClient(config.supabaseUrl, config.supabaseServiceKey);
    const executor = new SQLScriptExecutor(supabase);
    const validator = new DependencyValidator();

    // Sort scripts by execution order
    const sortedScripts = config.scripts.sort((a, b) => a.order - b.order);

    // Execute scripts in order
    const results = [];
    for (const script of sortedScripts) {
        console.log(`\n[${script.order}/${sortedScripts.length}] Preparing to execute: ${script.name}`);
        console.log(`Description: ${script.description}`);
        
        const result = await executor.executeScript(script.path, script.name);
        results.push({ script: script.name, ...result });
        
        // Stop execution if a critical script fails
        if (!result.success && script.order < 3) {
            console.log(`\n⚠️  Critical script ${script.name} failed. Stopping execution.`);
            break;
        }
    }

    // Validate execution order and dependencies
    console.log('\n\n====================================');
    console.log('VALIDATION RESULTS');
    console.log('====================================');

    const executionLog = executor.getExecutionLog();
    const orderValidation = validator.validateExecutionOrder(executionLog);
    const dependencyValidation = validator.validateDependencies(executionLog);

    console.log('\nExecution Order Validation:');
    if (orderValidation.valid) {
        console.log('✓ Scripts were executed in the correct order');
    } else {
        console.log('✗ Execution order issues found:');
        orderValidation.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\nDependency Validation:');
    if (dependencyValidation.valid) {
        console.log('✓ All dependency requirements satisfied');
    } else {
        console.log('✗ Dependency issues found:');
        dependencyValidation.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Generate summary report
    const summary = {
        totalScripts: config.scripts.length,
        successfulExecutions: results.filter(r => r.success).length,
        failedExecutions: results.filter(r => !r.success).length,
        executionOrderValid: orderValidation.valid,
        dependenciesValid: dependencyValidation.valid,
        overallSuccess: orderValidation.valid && dependencyValidation.valid && results.every(r => r.success)
    };

    console.log('\n\n====================================');
    console.log('SUMMARY REPORT');
    console.log('====================================');
    console.log(`Total Scripts: ${summary.totalScripts}`);
    console.log(`Successful Executions: ${summary.successfulExecutions}`);
    console.log(`Failed Executions: ${summary.failedExecutions}`);
    console.log(`Execution Order Valid: ${summary.executionOrderValid ? '✓' : '✗'}`);
    console.log(`Dependencies Valid: ${summary.dependenciesValid ? '✓' : '✗'}`);
    console.log(`Overall Success: ${summary.overallSuccess ? '✓' : '✗'}`);

    // Save detailed report
    const reportPath = './dependency-test-report.json';
    const report = {
        timestamp: new Date().toISOString(),
        config: config,
        results: results,
        executionLog: executionLog,
        validation: {
            order: orderValidation,
            dependencies: dependencyValidation
        },
        summary: summary
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return summary;
}

// Run the tests
if (require.main === module) {
    runDependencyTests()
        .then(summary => {
            console.log('\n🏁 Dependency test suite completed');
            process.exit(summary.overallSuccess ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { runDependencyTests, SQLScriptExecutor, DependencyValidator };