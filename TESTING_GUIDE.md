# Click2Endpoint Testing Guide - Field Name Fix Verification

**Dev Server**: http://localhost:5179/
**Status**: ✅ Build successful, dev server running

---

## Step-by-Step Testing Instructions

### Step 1: Open the Application

1. Open your browser
2. Navigate to: **http://localhost:5179/**
3. You should see the Click2Endpoint welcome screen

---

### Step 2: Navigate to Test Endpoint

1. Click **"Start Wizard"** button
2. Answer the wizard questions to reach an endpoint that uses recipients
   - **Recommended endpoint**: `/jobs/single-doc-job-template`
   - This endpoint has the `recipientAddressSources` field we just fixed

**OR** skip the wizard and go directly to the endpoint:
- Look for endpoint selection or URL navigation
- Select `/jobs/single-doc-job-template`

---

### Step 3: Fill Out the Parameter Form

**Expected Fields to See:**
1. ✅ **Job Template** - Fill with: `legal-template`
2. ✅ **Document Source** - Select "Document ID", fill with: `doc_123`
3. ✅ **Recipients** - This is the field we fixed!
   - Click "Add Recipient"
   - Choose "New Address"
   - Fill in:
     - First Name: `John`
     - Last Name: `Doe`
     - Street Address: `123 Main St`
     - City: `Anytown`
     - State: `NY`
     - ZIP: `12345`
     - Country: `USA`

4. ✅ **Payment Details** (if available)
   - Select "Credit Card"
   - Fill in card details (use test data)

---

### Step 4: Generate Code (Verify Field Name)

1. Click the **"Code Generator"** tab or similar button
2. You should see generated code in Python, JavaScript, or cURL

**What to Look For** (CRITICAL):
```json
{
  "jobTemplate": "legal-template",
  "documentSourceIdentifier": {
    "documentId": "doc_123"
  },
  "recipientAddressSources": [  ← CHECK THIS! Must be PLURAL
    {
      "recipientAddress": {
        "firstName": "John",
        "lastName": "Doe",
        ...
      }
    }
  ]
}
```

**✅ CORRECT**: Field name is `recipientAddressSources` (plural)
**❌ WRONG**: Field name is `recipientAddressSource` (singular)

---

### Step 5: Verify in Browser DevTools

1. **Open Chrome/Edge DevTools**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Go to the **Console** tab
3. In the console, type:
   ```javascript
   // Get the parameters from the form
   console.log(JSON.stringify(wizardAnswers, null, 2))
   ```
   OR if that doesn't work, look for any logged parameter objects

4. **Inspect the JSON** - look for the recipients field
5. **Verify**: Field name should be `recipientAddressSources` (plural)

---

### Step 6: Test Actual API Call (Most Important!)

Now let's test if the API actually accepts the request:

#### Option A: Using Execute Button (if available)

1. Click **"Execute Code"** or **"Test API"** button
2. Watch for the response in the UI

**Expected Results**:
- ✅ **Success**: API returns 200 OK with job ID
- ✅ **Success**: No field validation errors
- ❌ **Failure**: Error message mentions "recipientAddressSource" or unknown field

#### Option B: Using DevTools Network Tab

1. **Open DevTools** → **Network** tab
2. Clear existing requests (trash icon)
3. Click **"Execute Code"** or make the API call
4. Look for the API request in the Network tab
5. Click on the request to see details

**What to Check**:
1. **Request Headers** → Should show `Content-Type: application/json`
2. **Request Payload** → Click "Payload" tab
   - Verify field name is `recipientAddressSources` (plural)
   - Example:
     ```json
     {
       "jobTemplate": "legal-template",
       "recipientAddressSources": [ ... ]  ← Must be plural!
     }
     ```
3. **Response** → Click "Response" tab
   - ✅ **Success**: `{ "status": "success", "jobId": "..." }`
   - ❌ **Failure**: Error about unknown field or validation

---

### Step 7: Test Edge Cases

Test multiple scenarios to ensure robustness:

#### Test Case 1: Single Recipient
- [ ] Add 1 recipient
- [ ] Generate code
- [ ] Verify `recipientAddressSources` is an array with 1 item

#### Test Case 2: Multiple Recipients
- [ ] Add 3 recipients
- [ ] Generate code
- [ ] Verify `recipientAddressSources` is an array with 3 items

#### Test Case 3: Address List ID (instead of full address)
- [ ] Select "Address List ID" option
- [ ] Enter list ID: `list_clients_2024`
- [ ] Generate code
- [ ] Verify structure:
   ```json
   "recipientAddressSources": [
     { "addressListId": "list_clients_2024" }
   ]
   ```

#### Test Case 4: Saved Address ID
- [ ] Select "Saved Address ID" option
- [ ] Enter address ID: `addr_456`
- [ ] Generate code
- [ ] Verify structure:
   ```json
   "recipientAddressSources": [
     { "addressId": "addr_456" }
   ]
   ```

---

## Expected Results Summary

### ✅ All Tests Pass If:

1. **UI displays correctly**: "Recipients" field shows and works
2. **Field name is plural**: All generated code uses `recipientAddressSources`
3. **Array structure correct**: Recipients wrapped in array `[...]`
4. **API accepts request**: No validation errors about field names
5. **Response is successful**: API returns job ID or success status

### ❌ Tests Fail If:

1. **Field name is singular**: Shows `recipientAddressSource` anywhere
2. **API rejects request**: Error mentions unknown field
3. **Code generation broken**: No code generated or errors shown
4. **UI doesn't display**: Recipients field missing or broken

---

## Troubleshooting

### Issue: "recipientAddressSource" (singular) still appears

**Cause**: Browser cache or build cache
**Fix**:
```bash
# Clear browser cache
- Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- Or use incognito/private window

# Rebuild if needed
npm run build
```

### Issue: API returns validation error

**Error Example**: `Unknown field: recipientAddressSource`

**Debugging**:
1. Check DevTools Network tab → Request payload
2. Verify field name in JSON
3. If still singular, check if changes were saved
4. Run: `grep -r "recipientAddressSource[^s]" src/`

### Issue: Can't find the endpoint

**Solution**: Navigate directly:
- Look for URL routing or endpoint selector
- Or modify URL to include endpoint path
- Check console for any navigation errors

---

## Success Criteria

**MUST PASS** (Critical):
- ✅ Field name is `recipientAddressSources` (plural) in all generated code
- ✅ API accepts the request without field validation errors

**SHOULD PASS** (Important):
- ✅ Multiple recipients work correctly
- ✅ Different recipient types work (address, list ID, saved ID)

**NICE TO HAVE** (Optional):
- ✅ Generated code is readable and properly formatted
- ✅ UI provides good user experience

---

## Verification Checklist

Before marking this fix as complete:

- [ ] Opened http://localhost:5179/ successfully
- [ ] Navigated to `/jobs/single-doc-job-template` endpoint
- [ ] Filled out form including at least 1 recipient
- [ ] Generated code and verified field name is `recipientAddressSources` (plural)
- [ ] Checked DevTools Console - no errors related to field names
- [ ] Checked DevTools Network tab - request payload uses plural field name
- [ ] Made actual API call (if possible) - API accepted the request
- [ ] Tested edge cases: multiple recipients, address list ID, saved address ID
- [ ] No errors in browser console
- [ ] UI displays and functions correctly

---

## Next Steps After Testing

### If Tests Pass ✅

1. **Commit the changes**:
   ```bash
   git add frontend/src/data/parameterSchemas.ts
   git add frontend/src/components/ParameterCollector.tsx
   git add frontend/src/utils/codeGenerators.ts
   git commit -m "fix: correct field name from recipientAddressSource to recipientAddressSources

   - Updated parameterSchemas.ts (5 occurrences)
   - Updated ParameterCollector.tsx (3 occurrences)
   - Updated codeGenerators.ts (2 occurrences)
   - Matches OpenAPI specification field naming
   - Fixes API validation errors"
   ```

2. **Deploy to staging** (if available)
3. **Test in staging** with real API
4. **Deploy to production** after validation

### If Tests Fail ❌

1. **Document the failure** in FIXES_APPLIED.md
2. **Check which test failed** and why
3. **Run validation script again**: `node scripts/validate-parameter-schemas.js`
4. **Review the error messages** in browser console
5. **Verify field name** in source files: `grep -r "recipientAddressSource" src/`

---

**Testing Started**: [Add timestamp when you start]
**Testing Completed**: [Add timestamp when you finish]
**Result**: [✅ PASS / ❌ FAIL]
**Notes**: [Add any observations or issues found]
