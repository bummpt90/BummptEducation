/**
 * BummptEducation — Data-Access Layer Verification Test Suite
 * 
 * Verifies database client initialization, connection pooling,
 * parameterized queries, transaction commit/rollback, error handling,
 * and base repository pattern.
 */

import 'dotenv/config';
import { 
  getDatabasePool, 
  query, 
  withTransaction, 
  checkDatabaseHealth, 
  academicSessionRepository,
  closeDatabasePool,
  DatabaseQueryError,
  DatabaseConnectionError
} from '../index';

export async function runDalTestSuite(): Promise<{
  allPassed: boolean;
  results: Record<string, 'PASS' | 'FAIL'>;
  details: any;
}> {
  const results: Record<string, 'PASS' | 'FAIL'> = {};
  const details: any = {};

  try {
    // 1. Health check & Pool Initialization
    const health = await checkDatabaseHealth();
    details.health = health;
    if (health.status === 'connected') {
      results.healthCheck = 'PASS';
    } else {
      results.healthCheck = 'FAIL';
    }

    // 2. Safe Parameterized SELECT
    const selectRes = await query<{ test_msg: string; current_time: string }>(
      'SELECT $1::text as test_msg, NOW()::text as current_time',
      ['DAL_VERIFIED']
    );
    const firstRow = selectRes.rows[0];
    if (firstRow && firstRow.test_msg === 'DAL_VERIFIED') {
      results.parameterizedSelect = 'PASS';
      details.selectResult = firstRow;
    } else {
      results.parameterizedSelect = 'FAIL';
    }

    // 3. Repository Pattern Verification
    const sessionCount = await academicSessionRepository.count();
    const sessions = await academicSessionRepository.findMany('', [], { limit: 5 });
    results.repositoryPattern = 'PASS';
    details.repository = { count: sessionCount, sampleRows: sessions.length };

    // 4. Transaction & Rollback Verification
    let rollbackVerified = false;
    try {
      await withTransaction(async (client) => {
        const txStatus = await client.query('SELECT current_setting($1) as isolation', ['transaction_isolation']);
        details.txIsolation = txStatus.rows[0]?.isolation;
        // Deliberately trigger rollback
        throw new Error('SIMULATED_TRANSACTION_ROLLBACK');
      });
    } catch (err: any) {
      if (err.message.includes('SIMULATED_TRANSACTION_ROLLBACK') || err.name === 'DatabaseTransactionError') {
        rollbackVerified = true;
      }
    }
    results.transactionRollback = rollbackVerified ? 'PASS' : 'FAIL';

    // 5. Transaction Commit Verification
    const commitResult = await withTransaction(async (client) => {
      const res = await client.query('SELECT 40 + 60 as continuous_assessment_scale');
      return res.rows[0].continuous_assessment_scale;
    });
    if (commitResult === 100) {
      results.transactionCommit = 'PASS';
      details.transactionCommitResult = commitResult;
    } else {
      results.transactionCommit = 'FAIL';
    }

    // 6. SQL Error Classification & Sanitization
    let errorClassified = false;
    try {
      await query('SELECT * FROM non_existent_table_for_error_test_xyz;');
    } catch (err: any) {
      if (err instanceof DatabaseQueryError && err.code === '42P01') {
        errorClassified = true;
        details.errorClassification = { code: err.code, name: err.name };
      }
    }
    results.errorClassification = errorClassified ? 'PASS' : 'FAIL';

  } finally {
    await closeDatabasePool();
  }

  const allPassed = Object.values(results).every((r) => r === 'PASS');
  return { allPassed, results, details };
}

// Execute when invoked directly
if (process.argv[1]?.includes('dal.test')) {
  runDalTestSuite()
    .then((summary) => {
      console.log('=== TEST RESULTS ===');
      console.log(JSON.stringify(summary, null, 2));
      process.exit(summary.allPassed ? 0 : 1);
    })
    .catch((e) => {
      console.error('FATAL TEST ERROR:', e);
      process.exit(1);
    });
}
