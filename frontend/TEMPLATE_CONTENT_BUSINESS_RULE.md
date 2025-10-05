# Template Content Business Rule

## Business Rule

When a job template is employed:
1. **Job options are ALWAYS specified in the template** (this is given)
2. **Address list can be in template OR document can be in template, but NOT both** (mutually exclusive)

### Implications

If a user states that recipient addresses will be provided by an address list in the template:
- They should **NOT** be asked to provide an address list source
- The `addressListId` parameter should be **hidden** from parameter collection

If a user states that a document will be provided in the template:
- They should **NOT** be asked to provide a document source
- The `documentSourceIdentifier` parameter should be **hidden** from parameter collection

---

## Implementation Changes

### 1. Added New Question: `templateContent`

**File**: `src/data/questions.ts`

**Question**: "What is stored in your job template?"

**Options**:
- **Address list** - Template contains recipient addresses (you will provide documents)
- **Document** - Template contains the document (you will provide addresses)
- **Neither** - Template only contains job options (you provide both)

**Location in Decision Tree**: Asked immediately after `templateUsage === 'true'` and before `recipientStyle`

**Logic**:
```typescript
// If using a template, ask what's stored in it BEFORE asking about recipient style
if (templateUsage === 'true' && !templateContent) {
  return 'templateContent';
}
```

---

### 2. Updated Decision Tree Flow

**File**: `src/data/questions.ts`

**Previous Flow**:
1. Document Type
2. Template Usage
3. Recipient Style ← No clarification about template content
4. Personalization (if multi/merge)

**New Flow**:
1. Document Type
2. Template Usage
3. **Template Content** ← NEW: Only asked if using template
4. Recipient Style
5. Personalization (if multi/merge)

---

### 3. Parameter Filtering in ParameterCollector

**File**: `src/components/ParameterCollector.tsx`

**Changes**:
1. Added `wizardAnswers?: Record<string, string>` to props
2. Filter schema based on `templateContent` value

**Filtering Logic**:
```typescript
const rawSchema = parameterSchemas[endpointPath] || [];

// Filter schema based on template content
const schema = rawSchema.filter(field => {
  const { templateContent } = wizardAnswers;

  // If template contains address list, hide address list ID field
  if (templateContent === 'addressList' && field.name === 'addressListId') {
    return false;
  }

  // If template contains document, hide document source field
  if (templateContent === 'document' && field.name === 'documentSourceIdentifier') {
    return false;
  }

  return true;
});
```

---

### 4. Passed Wizard Answers to ParameterCollector

**File**: `src/components/ResultCard.tsx`

**Change**: Added `wizardAnswers={answers}` prop

```typescript
<ParameterCollector
  endpointPath={endpoint.path}
  onParametersChange={setParameters}
  wizardAnswers={answers}  // ← NEW
/>
```

---

## Example User Flows

### Example 1: Template Contains Address List

**Wizard Answers**:
- Document Type: Single document
- Template Usage: Yes - Use saved template
- **Template Content: Address list** ← NEW QUESTION
- Recipient Style: From template/mailing list

**Result**: `addressListId` parameter is **hidden** from parameter collection form

**Reasoning**: User already specified address list is in template, so asking for addressListId would be redundant

---

### Example 2: Template Contains Document

**Wizard Answers**:
- Document Type: Single document
- Template Usage: Yes - Use saved template
- **Template Content: Document** ← NEW QUESTION
- Recipient Style: Provided in API call

**Result**: `documentSourceIdentifier` parameter is **hidden** from parameter collection form

**Reasoning**: User already specified document is in template, so asking for document source would be redundant

---

### Example 3: Template Contains Neither (Only Job Options)

**Wizard Answers**:
- Document Type: Single document
- Template Usage: Yes - Use saved template
- **Template Content: Neither** ← NEW QUESTION
- Recipient Style: Provided in API call

**Result**: Both `addressListId` and `documentSourceIdentifier` parameters are **shown** (if applicable to endpoint)

**Reasoning**: User needs to provide both document and addresses since template only has job options

---

## Technical Details

### Parameter Names to Filter

| Template Content | Hidden Parameter Name         | Description |
|-----------------|-------------------------------|-------------|
| `addressList`   | `addressListId`              | Reference to saved address list |
| `document`      | `documentSourceIdentifier`   | Document source (zipId + documentName) |

### Edge Cases Handled

1. **No template used** (`templateUsage === 'false'`):
   - `templateContent` question is skipped entirely
   - All parameters shown normally

2. **PDF Split endpoint** (`docType === 'pdfSplit'`):
   - Template question is skipped
   - `templateContent` question never asked
   - Parameters shown normally

3. **Missing wizard answers**:
   - Default to showing all parameters (fail-safe)
   - `wizardAnswers` prop is optional with default `{}`

---

## Testing Checklist

- [ ] Template with address list → `addressListId` hidden
- [ ] Template with document → `documentSourceIdentifier` hidden
- [ ] Template with neither → Both parameters shown
- [ ] No template used → Both parameters shown
- [ ] PDF split endpoint → Template question skipped
- [ ] Navigate back/forward → Template content answer persists
- [ ] Code generation reflects hidden parameters correctly

---

## Related Files

- `src/data/questions.ts` - Question definitions and decision tree
- `src/components/ParameterCollector.tsx` - Parameter filtering logic
- `src/components/ResultCard.tsx` - Props passing
- `src/data/parameterSchemas.ts` - Parameter definitions
- `src/data/endpointMap.ts` - Endpoint configurations

---

## Future Enhancements

1. **Validation**: Ensure template content matches endpoint requirements
2. **Help Text**: Add tooltip explaining why certain fields are hidden
3. **API Validation**: Verify template actually contains specified content
4. **Error Handling**: Better messaging when template content doesn't match expectations

---

**Last Updated**: 2025-10-04
**Branch**: phase3-aws-backend
**Status**: Implemented and ready for testing
