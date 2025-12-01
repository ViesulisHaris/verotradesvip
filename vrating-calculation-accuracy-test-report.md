# VRating Calculation Accuracy Test Report

**Date:** 19/11/2025, 18:48:55
**Success Rate:** 75.0% (6/8)

## Summary

- ✅ **Passed:** 6
- ❌ **Failed:** 2
- 📊 **Total:** 8

## Test Results

### Test 1: High Performer Test

**Description:** Should score 9.0-10.0 for profitability

**Results:**
- Overall: 6.56
- Profitability: 9.90
- Risk Management: 2.76
- Consistency: 2.00
- Emotional Discipline: 10.00
- Journaling Adherence: 10.00

**Expected Ranges:**
- profitability: 9-10
- overall: 7-10

**Status:** ✅ PASSED


### Test 2: Poor Performer Test

**Description:** Should score 1.0-1.9 for profitability

**Results:**
- Overall: 3.97
- Profitability: 1.90
- Risk Management: 2.00
- Consistency: 2.00
- Emotional Discipline: 10.00
- Journaling Adherence: 10.00

**Expected Ranges:**
- profitability: 1-1.9
- overall: 1-3

**Status:** ✅ PASSED


### Test 3: Low Risk Test

**Description:** Should score 8.0-10.0 for risk management

**Results:**
- Overall: 8.40
- Profitability: 10.00
- Risk Management: 10.00
- Consistency: 2.00
- Emotional Discipline: 10.00
- Journaling Adherence: 10.00

**Expected Ranges:**
- riskManagement: 8-10
- overall: 6-10

**Status:** ✅ PASSED


### Test 4: High Risk Test

**Description:** Should score 2.0-3.9 for risk management

**Results:**
- Overall: 3.40
- Profitability: 0.00
- Risk Management: 2.00
- Consistency: 2.00
- Emotional Discipline: 10.00
- Journaling Adherence: 10.00

**Expected Ranges:**
- riskManagement: 2-3.9
- overall: 1-5

**Status:** ✅ PASSED


### Test 5: High Emotional Discipline Test

**Description:** Should score 8.0-10.0 for emotional discipline

**Results:**
- Overall: 6.61
- Profitability: 10.00
- Risk Management: 2.84
- Consistency: 2.00
- Emotional Discipline: 10.00
- Journaling Adherence: 10.00

**Expected Ranges:**
- emotionalDiscipline: 8-10
- overall: 6-10

**Status:** ✅ PASSED


### Test 6: Low Emotional Discipline Test

**Description:** Should score 2.0-3.9 for emotional discipline

**Results:**
- Overall: 2.77
- Profitability: 1.90
- Risk Management: 2.00
- Consistency: 2.00
- Emotional Discipline: 2.00
- Journaling Adherence: 10.00

**Expected Ranges:**
- emotionalDiscipline: 2-3.9
- overall: 1-5

**Status:** ✅ PASSED


### Test 7: Excellent Journaling Test

**Description:** Should score 8.0-10.0 for journaling adherence

**Results:**
- Overall: 10.00
- Profitability: 10.00
- Risk Management: 10.00
- Consistency: 10.00
- Emotional Discipline: 10.00
- Journaling Adherence: 10.00

**Expected Ranges:**
- journalingAdherence: 8-10
- overall: 6-10

**Status:** ✅ PASSED


### Test 8: Empty Trades Test

**Description:** Should handle empty array gracefully

**Results:**
- Overall: 0.00
- Profitability: 0.00
- Risk Management: 0.00
- Consistency: 0.00
- Emotional Discipline: 0.00
- Journaling Adherence: 0.00

**Expected Ranges:**
- overall: 0-0
- profitability: 0-0
- riskManagement: 0-0
- consistency: 0-0
- emotionalDiscipline: 0-0
- journalingAdherence: 0-0

**Status:** ✅ PASSED



## Conclusion

⚠️ **Some tests failed.** The VRating calculation system may need adjustments.

Please review the failed tests and address the issues before deploying to production.

