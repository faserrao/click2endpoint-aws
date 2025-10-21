# Click2Endpoint Parameter Validation Report

**Generated**: 2025-10-14
**Tool**: `scripts/validate-parameter-schemas.js`
**Status**: ⚠️ **CRITICAL ISSUES FOUND**

---

## Executive Summary

The validation script found **27 errors and 64 warnings** across 9 endpoints. The primary issue is a **structural mismatch** between how the OpenAPI spec defines request bodies and how the UI presents parameter forms.

### Critical Issues

1. **Root-level oneOf Structure**: OpenAPI uses oneOf at the request body level to define mutually exclusive field combinations. The UI presents all fields simultaneously.

2. **Field Naming Mismatch**: `recipientAddressSource` (UI) vs `recipientAddressSources` (OpenAPI) - **this will cause API call failures!**

3. **Missing Endpoints**: 4 endpoints have no OpenAPI schema definitions
   - `/jobs/single-pdf-address-capture`
   - `/jobs/submit-multi-doc-with-template`
   - `/jobs/split-pdf-with-capture`
   - `/jobs/merge-multi-doc-with-template`

---

## Understanding the Structural Difference

### OpenAPI Structure (Example: `/jobs/single-doc-job-template`)

```yaml
requestBody:
  content:
    application/json:
      schema:
        oneOf:
          - # Variant 0: Template + Document only
            type: object
            properties:
              jobTemplate: {...}
              documentSourceIdentifier: {...}
              paymentDetails: {...}
              tags: {...}
            required:
              - jobTemplate
              - documentSourceIdentifier

          - # Variant 1: Template + Recipients only
            type: object
            properties:
              jobTemplate: {...}
              recipientAddressSources: [...]  # PLURAL!
              paymentDetails: {...}
              tags: {...}
            required:
              - jobTemplate
              - recipientAddressSources

          - # Variant 2: Template + Document + Recipients
            type: object
            properties:
              jobTemplate: {...}
              documentSourceIdentifier: {...}
              recipientAddressSources: [...]  # PLURAL!
              paymentDetails: {...}
              tags: {...}
            required:
              - jobTemplate
              - documentSourceIdentifier
              - recipientAddressSources
```

**Interpretation**: The API expects **exactly one** of these three structures. You can't mix fields from different variants.

### UI Structure (Current Implementation)

```typescript
'/jobs/single-doc-job-template': [
  { name: 'jobTemplate', ... },
  { name: 'documentSourceIdentifier', ... },
  { name: 'recipientAddressSource', ... },  // SINGULAR!
  { name: 'paymentDetails', ... }
]
```

**Interpretation**: The UI presents ALL fields simultaneously, allowing users to fill in whatever they want.

---

## Key Differences

| Aspect | OpenAPI Spec | UI Implementation | Impact |
|--------|--------------|-------------------|--------|
| **Structure** | 3 mutually exclusive variants | Single form with all fields | Users can create invalid combinations |
| **Field Name** | `recipientAddressSources` (plural) | `recipientAddressSource` (singular) | 🔴 **API CALLS WILL FAIL** |
| **Required Fields** | Depends on variant chosen | All marked as required | May force users to fill unnecessary fields |
| **Flexibility** | Strict - must match one variant | Flexible - fill what you want | Better UX but may generate invalid requests |

---

## Detailed Findings by Endpoint

### 1. `/jobs/single-doc-job-template`

**Status**: ⚠️ Structural mismatch + naming issue

**OpenAPI**: 3 oneOf variants
- Variant 0: jobTemplate + documentSourceIdentifier (2 required)
- Variant 1: jobTemplate + recipientAddressSources (2 required)
- Variant 2: jobTemplate + documentSourceIdentifier + recipientAddressSources (3 required)

**UI Schema**: 25 total fields including:
- `jobTemplate` ✅
- `documentSourceIdentifier` ✅
- `recipientAddressSource` ❌ **SHOULD BE PLURAL: `recipientAddressSources`**
- `paymentDetails` ✅ (but missing in UI according to validation)

**Issues Found**:
- ❌ Field name mismatch: `recipientAddressSource` → should be `recipientAddressSources`
- ⚠️ UI doesn't enforce oneOf variants (allows any combination of fields)
- ⚠️ OpenAPI reports "missing" fields because validator doesn't understand the flattening

### 2. `/jobs/multi-docs-job-template`

**Status**: ⚠️ Similar structural issues

**Issues**:
- Missing `paymentDetails` field in UI
- Missing `tags` field in UI
- Similar oneOf structure not enforced

### 3. `/jobs/multi-doc-merge-job-template`

**Status**: ⚠️ Multiple missing fields

**Issues**:
- Missing `recipientAddressSource` field (but also naming mismatch)
- Missing `paymentDetails` field
- Missing `tags` field

### 4. Missing OpenAPI Schemas

**Endpoints with NO OpenAPI definitions**:
1. `/jobs/single-pdf-address-capture` ❌
2. `/jobs/submit-multi-doc-with-template` ❌
3. `/jobs/split-pdf-with-capture` ❌
4. `/jobs/merge-multi-doc-with-template` ❌

**UI Status**: These endpoints have empty arrays `[]` in `parameterSchemas.ts`

---

## Root Cause Analysis

### 1. Field Naming Convention Mismatch

**Problem**: Inconsistent singular/plural usage

| UI Field Name | OpenAPI Field Name | Status |
|---------------|-------------------|--------|
| `recipientAddressSource` | `recipientAddressSources` | ❌ MISMATCH |

**Impact**: When the UI generates an API request, it will use the wrong field name, causing the API to reject the request with a validation error.

**Example of Generated Request (WILL FAIL)**:
```json
{
  "jobTemplate": "legal-template",
  "documentSourceIdentifier": { "documentId": "doc_123" },
  "recipientAddressSource": [  ← WRONG! Should be "recipientAddressSources"
    { "recipientAddress": { ... } }
  ]
}
```

### 2. Root-Level oneOf Not Enforced

**Problem**: The OpenAPI spec uses oneOf to define three distinct use cases, but the UI presents all fields without enforcing the mutual exclusivity.

**Design Question**: Should the UI:
- **Option A**: Enforce the oneOf structure (force users to choose one of 3 flows)
- **Option B**: Present all fields and let users fill what they want (current approach)

**Recommendation**: **Option B is better UX**, but requires:
1. Fix field naming to match OpenAPI
2. Ensure conditional validation in UI (if document provided, don't require recipients, etc.)
3. Backend must accept all variants (verify API behavior)

### 3. Nested oneOf Fields

**Problem**: Both OpenAPI and UI have nested oneOf structures (documentSourceIdentifier, paymentDetails), but the validation script doesn't compare nested structures deeply.

**Example**: `documentSourceIdentifier` has 5 variants in both schemas, but the validator can't verify if they match.

---

## Recommendations

### CRITICAL - Must Fix Immediately

1. **Fix Field Name: recipientAddressSource → recipientAddressSources**
   - Location: `frontend/src/data/parameterSchemas.ts`
   - Change all occurrences from singular to plural
   - Impact: API calls will start working correctly

2. **Add Missing OpenAPI Schemas**
   - Contact API team to add schemas for 4 missing endpoints
   - OR mark these endpoints as "not yet implemented" in UI

### HIGH PRIORITY - Fix Soon

3. **Add Missing Fields to UI Schemas**
   - Add `paymentDetails` to endpoints that are missing it
   - Add `tags` field (optional array) to endpoints that support it
   - Verify against OpenAPI spec for completeness

4. **Update ParameterCollector Logic**
   - Current conditional filtering (lines 23-41) may hide fields incorrectly
   - Review logic against OpenAPI oneOf variants
   - Ensure users can access all valid combinations

### MEDIUM PRIORITY - Improve Validation

5. **Enhance Validation Script**
   - Handle root-level oneOf structures correctly
   - Don't flag "missing" fields when they're part of oneOf variants
   - Add deep comparison for nested oneOf fields

6. **Create Integration Tests**
   - Test actual API calls with UI-generated parameters
   - Verify all oneOf variants work correctly
   - Catch naming mismatches automatically

### LOW PRIORITY - Documentation

7. **Document oneOf Mapping**
   - Create a mapping document showing how each OpenAPI oneOf variant corresponds to UI states
   - Help future developers understand the design decisions

---

## Testing Checklist

Before deploying fixes, test these scenarios:

### Scenario 1: Template + Document Only
- [ ] Fill `jobTemplate` + `documentSourceIdentifier`
- [ ] Leave `recipientAddressSource` empty
- [ ] Verify API accepts request (should match Variant 0)

### Scenario 2: Template + Recipients Only
- [ ] Fill `jobTemplate` + `recipientAddressSources` (plural!)
- [ ] Leave `documentSourceIdentifier` empty
- [ ] Verify API accepts request (should match Variant 1)

### Scenario 3: Template + Document + Recipients
- [ ] Fill all three fields
- [ ] Verify API accepts request (should match Variant 2)

### Scenario 4: Field Name Validation
- [ ] Use browser DevTools to inspect generated JSON
- [ ] Verify field name is `recipientAddressSources` (plural)
- [ ] Verify API does not return field name validation errors

---

## Next Steps

1. **IMMEDIATE**: Fix `recipientAddressSource` → `recipientAddressSources` naming
2. **TODAY**: Test actual API calls with corrected field names
3. **THIS WEEK**: Add missing fields (`paymentDetails`, `tags`)
4. **THIS WEEK**: Request OpenAPI schemas for 4 missing endpoints
5. **NEXT WEEK**: Enhance validation script to handle root-level oneOf
6. **NEXT WEEK**: Create integration test suite

---

## Validation Script Output Summary

```
✗ VALIDATION FAILED: 27 errors, 64 warnings

Errors (27):
  - 23 "missing" fields (mostly oneOf_variant_N - can be ignored)
  - 4 endpoints missing OpenAPI schemas (must add schemas)

Warnings (64):
  - 57 "extra" fields in UI (mostly nested fields - expected)
  - 7 oneOf structure mismatches (expected due to flattening)
```

**Actionable Errors**: 4 (missing OpenAPI schemas)
**Actionable Warnings**: 1 (field naming mismatch)

---

## Files to Modify

1. **frontend/src/data/parameterSchemas.ts**
   - Lines 153, 297, 857, 967, 1409, 1449: Change `recipientAddressSource` → `recipientAddressSources`
   - Add `paymentDetails` field where missing
   - Add `tags` field where missing

2. **frontend/src/components/ParameterCollector.tsx**
   - Update field name references in conditional logic
   - Review lines 23-41 for correct field names

3. **scripts/validate-parameter-schemas.js**
   - Enhance to handle root-level oneOf (future improvement)

---

## Questions for API Team

1. **Field Naming**: Is `recipientAddressSources` (plural) the correct field name?
2. **oneOf Variants**: Can the API accept ANY combination of fields, or must requests match exactly one variant?
3. **Missing Endpoints**: When will schemas be available for the 4 missing endpoints?
4. **Nested oneOf**: Should we validate that nested oneOf structures (documentSourceIdentifier, paymentDetails) match between UI and spec?

---

**Report Generated By**: `scripts/validate-parameter-schemas.js`
**Full Validation Output**: See terminal output above
**Next Review**: After implementing critical fixes
