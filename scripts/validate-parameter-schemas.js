#!/usr/bin/env node

/**
 * Parameter Schema Validator
 *
 * Validates that the React frontend's parameterSchemas.ts matches the OpenAPI specification.
 * This ensures that Click2Endpoint presents the correct parameters for each endpoint.
 *
 * Usage: node scripts/validate-parameter-schemas.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Paths
const OPENAPI_SPEC_PATH = path.join(__dirname, '../frontend/data/reference/c2mapiv2-openapi-spec-final.yaml');
const PARAMETER_SCHEMAS_PATH = path.join(__dirname, '../frontend/src/data/parameterSchemas.ts');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ParameterValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
    this.openApiSpec = null;
    this.parameterSchemas = null;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  addIssue(endpoint, message) {
    this.issues.push({ endpoint, message });
  }

  addWarning(endpoint, message) {
    this.warnings.push({ endpoint, message });
  }

  addSuccess(endpoint, message) {
    this.successes.push({ endpoint, message });
  }

  loadOpenApiSpec() {
    try {
      const specContent = fs.readFileSync(OPENAPI_SPEC_PATH, 'utf8');
      this.openApiSpec = yaml.parse(specContent);
      this.log('✓ Loaded OpenAPI specification', 'green');
      return true;
    } catch (error) {
      this.log(`✗ Failed to load OpenAPI spec: ${error.message}`, 'red');
      return false;
    }
  }

  loadParameterSchemas() {
    try {
      const content = fs.readFileSync(PARAMETER_SCHEMAS_PATH, 'utf8');

      // Extract the parameterSchemas object - simple parsing
      const match = content.match(/export const parameterSchemas[^=]*=\s*(\{[\s\S]*?\n\};)/);

      if (!match) {
        throw new Error('Could not find parameterSchemas export in file');
      }

      // Store the raw content for manual parsing
      this.parameterSchemasRaw = content;
      this.log('✓ Loaded parameter schemas file', 'green');

      return true;
    } catch (error) {
      this.log(`✗ Failed to load parameter schemas: ${error.message}`, 'red');
      return false;
    }
  }

  extractUISchemaForEndpoint(endpoint) {
    // Extract the schema definition for a specific endpoint
    // This is a simplified parser - looks for the endpoint key and extracts its array
    const regex = new RegExp(`'${endpoint.replace(/\//g, '\\/')}':\\s*\\[((?:[^\\[\\]]|\\[(?:[^\\[\\]]|\\[[^\\]]*\\])*\\])*)\\]`, 's');
    const match = this.parameterSchemasRaw.match(regex);

    if (!match) {
      return null;
    }

    // Parse the field definitions manually
    // Look for field objects with name, type, required properties
    const fields = [];
    const fieldMatches = match[1].matchAll(/\{\s*name:\s*['"]([^'"]*)['"]/g);

    for (const fieldMatch of fieldMatches) {
      const fieldName = fieldMatch[1];

      // Extract field details
      const fieldStartIndex = fieldMatch.index;
      const fieldText = this.extractFieldObject(match[1], fieldStartIndex);

      const field = {
        name: fieldName,
        required: /required:\s*true/.test(fieldText),
        type: this.extractFieldType(fieldText),
        isOneOf: /type:\s*['"]oneOf['"]/.test(fieldText),
        isArray: /type:\s*['"]array['"]/.test(fieldText),
        isObject: /type:\s*['"]object['"]/.test(fieldText)
      };

      // Extract oneOf options if present
      if (field.isOneOf) {
        field.oneOfVariants = this.extractOneOfVariants(fieldText);
      }

      // Extract nested fields for objects/arrays
      if (field.isObject || field.isArray) {
        field.hasNestedFields = /fields:\s*\[/.test(fieldText);
      }

      fields.push(field);
    }

    return fields;
  }

  extractFieldObject(text, startIndex) {
    // Extract a complete field object by counting braces
    let braceCount = 0;
    let inString = false;
    let stringChar = null;
    let i = startIndex;

    while (i < text.length) {
      const char = text[i];

      if (!inString) {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        } else if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            return text.substring(startIndex, i + 1);
          }
        }
      } else {
        if (char === stringChar && text[i - 1] !== '\\') {
          inString = false;
          stringChar = null;
        }
      }
      i++;
    }

    return text.substring(startIndex);
  }

  extractFieldType(fieldText) {
    const typeMatch = fieldText.match(/type:\s*['"]([^'"]+)['"]/);
    return typeMatch ? typeMatch[1] : 'unknown';
  }

  extractOneOfVariants(fieldText) {
    // Extract oneOfOptions array
    const variants = [];
    const optionsMatch = fieldText.match(/oneOfOptions:\s*\[([\s\S]*?)\]/);

    if (!optionsMatch) {
      return variants;
    }

    // Count each variant (each is an object with label, value, fields)
    const variantMatches = optionsMatch[1].matchAll(/\{\s*label:/g);

    for (const match of variantMatches) {
      variants.push({ found: true });
    }

    return variants;
  }

  extractRequestBodySchema(endpoint, method) {
    const pathItem = this.openApiSpec.paths[endpoint];
    if (!pathItem) {
      return null;
    }

    const operation = pathItem[method.toLowerCase()];
    if (!operation) {
      return null;
    }

    const requestBody = operation.requestBody;
    if (!requestBody || !requestBody.content || !requestBody.content['application/json']) {
      return null;
    }

    return requestBody.content['application/json'].schema;
  }

  resolveSchemaRef(ref) {
    if (!ref || !ref.startsWith('#/')) {
      return null;
    }

    const parts = ref.substring(2).split('/');
    let current = this.openApiSpec;

    for (const part of parts) {
      if (!current[part]) {
        return null;
      }
      current = current[part];
    }

    return current;
  }

  extractSchemaProperties(schema, parentPath = []) {
    if (!schema) {
      return [];
    }

    // Handle $ref
    if (schema.$ref) {
      const resolved = this.resolveSchemaRef(schema.$ref);
      return this.extractSchemaProperties(resolved, parentPath);
    }

    const properties = [];

    // Handle object with properties
    if (schema.type === 'object' && schema.properties) {
      const required = schema.required || [];

      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const fullPath = [...parentPath, propName];

        properties.push({
          path: fullPath,
          name: propName,
          required: required.includes(propName),
          type: propSchema.type,
          schema: propSchema,
          description: propSchema.description
        });

        // Handle nested objects
        if (propSchema.type === 'object' || propSchema.$ref) {
          const nested = this.extractSchemaProperties(propSchema, fullPath);
          properties.push(...nested);
        }

        // Handle oneOf
        if (propSchema.oneOf) {
          properties.push({
            path: fullPath,
            name: propName,
            required: required.includes(propName),
            type: 'oneOf',
            oneOfOptions: propSchema.oneOf,
            description: propSchema.description
          });
        }
      }
    }

    // Handle oneOf at the root level
    if (schema.oneOf) {
      return schema.oneOf.map((option, index) => ({
        path: parentPath,
        name: `oneOf_variant_${index}`,
        type: 'oneOf',
        schema: option,
        description: schema.description
      }));
    }

    return properties;
  }

  validateEndpoint(endpointPath) {
    this.log(`\n${'='.repeat(80)}`, 'cyan');
    this.log(`Validating: ${endpointPath}`, 'cyan');
    this.log('='.repeat(80), 'cyan');

    // Get OpenAPI schema
    const schema = this.extractRequestBodySchema(endpointPath, 'POST');

    if (!schema) {
      this.addIssue(endpointPath, 'No request body schema found in OpenAPI spec');
      return;
    }

    // Get UI schema
    const uiFields = this.extractUISchemaForEndpoint(endpointPath);

    if (!uiFields || uiFields.length === 0) {
      this.addWarning(endpointPath, 'No UI schema found in parameterSchemas.ts (endpoint may not be implemented yet)');
      return;
    }

    // Extract all properties from OpenAPI
    const openApiProperties = this.extractSchemaProperties(schema);

    // Create lookup maps for easier comparison
    const openApiFieldNames = new Set(openApiProperties.map(p => p.name));
    const uiFieldNames = new Set(uiFields.filter(f => f.name).map(f => f.name));

    this.log(`\n📊 Comparison Summary:`, 'cyan');
    this.log(`  OpenAPI properties: ${openApiProperties.length}`, 'blue');
    this.log(`  UI schema fields: ${uiFields.length}`, 'blue');

    // Check for missing fields in UI
    const missingInUI = [];
    for (const prop of openApiProperties) {
      if (prop.name && !uiFieldNames.has(prop.name)) {
        missingInUI.push(prop);
      }
    }

    // Check for extra fields in UI
    const extraInUI = [];
    for (const field of uiFields) {
      if (field.name && !openApiFieldNames.has(field.name)) {
        extraInUI.push(field);
      }
    }

    // Check oneOf variants
    const oneOfIssues = this.validateOneOfFields(openApiProperties, uiFields);

    // Report results
    if (missingInUI.length > 0) {
      this.log(`\n❌ Missing in UI (${missingInUI.length} fields):`, 'red');
      missingInUI.forEach(prop => {
        const requiredFlag = prop.required ? '[REQUIRED]' : '[OPTIONAL]';
        this.log(`  ${requiredFlag} ${prop.name} (${prop.type})`, 'red');
        this.addIssue(endpointPath, `Missing required field in UI: ${prop.name}`);
      });
    }

    if (extraInUI.length > 0) {
      this.log(`\n⚠️  Extra in UI (${extraInUI.length} fields not in OpenAPI):`, 'yellow');
      extraInUI.forEach(field => {
        const requiredFlag = field.required ? '[REQUIRED]' : '[OPTIONAL]';
        this.log(`  ${requiredFlag} ${field.name} (${field.type})`, 'yellow');
        this.addWarning(endpointPath, `Extra field in UI not in spec: ${field.name}`);
      });
    }

    if (oneOfIssues.length > 0) {
      this.log(`\n⚠️  oneOf Structure Issues (${oneOfIssues.length}):`, 'yellow');
      oneOfIssues.forEach(issue => {
        this.log(`  ${issue}`, 'yellow');
        this.addWarning(endpointPath, issue);
      });
    }

    if (missingInUI.length === 0 && extraInUI.length === 0 && oneOfIssues.length === 0) {
      this.log(`\n✅ All fields match!`, 'green');
      this.addSuccess(endpointPath, 'UI schema matches OpenAPI specification');
    } else {
      this.log(`\n⚠️  Found ${missingInUI.length + extraInUI.length + oneOfIssues.length} discrepancies`, 'yellow');
    }

    // Detailed breakdown
    this.log(`\n📋 Field Details:`, 'cyan');
    this.log(`  OpenAPI properties:`, 'blue');
    openApiProperties.slice(0, 10).forEach(prop => {
      const requiredFlag = prop.required ? '[REQ]' : '[OPT]';
      const pathStr = prop.path.join('.');
      this.log(`    ${requiredFlag} ${pathStr} (${prop.type})`, 'blue');
    });
    if (openApiProperties.length > 10) {
      this.log(`    ... and ${openApiProperties.length - 10} more`, 'blue');
    }

    this.log(`  UI schema fields:`, 'blue');
    uiFields.slice(0, 10).forEach(field => {
      const requiredFlag = field.required ? '[REQ]' : '[OPT]';
      const oneOfInfo = field.isOneOf ? ` (${field.oneOfVariants?.length || 0} variants)` : '';
      this.log(`    ${requiredFlag} ${field.name} (${field.type})${oneOfInfo}`, 'blue');
    });
    if (uiFields.length > 10) {
      this.log(`    ... and ${uiFields.length - 10} more`, 'blue');
    }
  }

  validateOneOfFields(openApiProperties, uiFields) {
    const issues = [];

    // Find oneOf fields in both schemas
    const openApiOneOf = openApiProperties.filter(p => p.type === 'oneOf' || p.oneOfOptions);
    const uiOneOf = uiFields.filter(f => f.isOneOf);

    // Check each UI oneOf field
    for (const uiField of uiOneOf) {
      const openApiField = openApiOneOf.find(p => p.name === uiField.name);

      if (!openApiField) {
        issues.push(`UI has oneOf field "${uiField.name}" but OpenAPI doesn't`);
        continue;
      }

      // Compare variant counts
      const openApiVariantCount = openApiField.oneOfOptions?.length || 0;
      const uiVariantCount = uiField.oneOfVariants?.length || 0;

      if (openApiVariantCount !== uiVariantCount) {
        issues.push(`Field "${uiField.name}": OpenAPI has ${openApiVariantCount} variants, UI has ${uiVariantCount}`);
      }
    }

    // Check for oneOf fields in OpenAPI that aren't in UI
    for (const openApiField of openApiOneOf) {
      const uiField = uiOneOf.find(f => f.name === openApiField.name);
      if (!uiField) {
        issues.push(`OpenAPI has oneOf field "${openApiField.name}" but UI doesn't`);
      }
    }

    return issues;
  }

  validateAllEndpoints() {
    const endpoints = [
      '/jobs/single-doc-job-template',
      '/jobs/single-pdf-address-capture',
      '/jobs/single-pdf-split',
      '/jobs/multi-docs-job-template',
      '/jobs/multi-doc-merge-job-template',
      '/jobs/multi-pdf-address-capture',
      '/jobs/submit-multi-doc-with-template',
      '/jobs/split-pdf-with-capture',
      '/jobs/merge-multi-doc-with-template'
    ];

    for (const endpoint of endpoints) {
      this.validateEndpoint(endpoint);
    }
  }

  generateReport() {
    this.log('\n\n' + '='.repeat(80), 'magenta');
    this.log('VALIDATION REPORT', 'magenta');
    this.log('='.repeat(80), 'magenta');

    if (this.successes.length > 0) {
      this.log(`\n✓ Successes (${this.successes.length}):`, 'green');
      this.successes.forEach(({ endpoint, message }) => {
        this.log(`  ${endpoint}: ${message}`, 'green');
      });
    }

    if (this.warnings.length > 0) {
      this.log(`\n⚠ Warnings (${this.warnings.length}):`, 'yellow');
      this.warnings.forEach(({ endpoint, message }) => {
        this.log(`  ${endpoint}: ${message}`, 'yellow');
      });
    }

    if (this.issues.length > 0) {
      this.log(`\n✗ Issues (${this.issues.length}):`, 'red');
      this.issues.forEach(({ endpoint, message }) => {
        this.log(`  ${endpoint}: ${message}`, 'red');
      });
    }

    this.log('\n' + '='.repeat(80), 'magenta');

    const totalIssues = this.issues.length + this.warnings.length;
    if (totalIssues === 0) {
      this.log('✓ ALL VALIDATIONS PASSED!', 'green');
      return 0;
    } else {
      this.log(`✗ VALIDATION FAILED: ${this.issues.length} errors, ${this.warnings.length} warnings`, 'red');
      return 1;
    }
  }

  run() {
    this.log('Parameter Schema Validator', 'cyan');
    this.log('='.repeat(80), 'cyan');

    if (!this.loadOpenApiSpec()) {
      return 1;
    }

    if (!this.loadParameterSchemas()) {
      return 1;
    }

    this.validateAllEndpoints();

    return this.generateReport();
  }
}

// Run the validator
const validator = new ParameterValidator();
const exitCode = validator.run();
process.exit(exitCode);
