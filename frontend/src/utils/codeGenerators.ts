import type { EndpointInfo } from '../data/endpointMap';

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || "https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth";
const DEFAULT_MOCK_URL = import.meta.env.VITE_DEFAULT_MOCK_URL || "https://cd140b74-ed23-4980-834b-a966ac3393c1.mock.pstmn.io";

export interface CodeGenerationOptions {
  endpoint: EndpointInfo;
  mockServerUrl?: string;
  includeAuth?: boolean;
  customParameters?: any;
  clientId?: string;
  clientSecret?: string;
}

// Helper function to process parameters and handle oneOf structures
function processParametersForPayload(params: any): any {
  if (!params || typeof params !== 'object') {
    return params;
  }

  // Create a deep copy to avoid modifying the original
  const processed = JSON.parse(JSON.stringify(params));

  // Recursively process the object
  function processObject(obj: any): any {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        // Check if this is a documentSourceIdentifier oneOf structure
        if (key === 'documentSourceIdentifier' && ('documentId' in obj[key] || 'externalUrl' in obj[key])) {
          // Keep only the non-empty field
          if (obj[key].documentId && obj[key].externalUrl) {
            // If both are present, remove the empty one
            if (!obj[key].documentId || obj[key].documentId === '') {
              delete obj[key].documentId;
            } else if (!obj[key].externalUrl || obj[key].externalUrl === '') {
              delete obj[key].externalUrl;
            }
          }
        }
        
        // For recipientAddressSource arrays, ensure proper structure
        if (key === 'recipientAddressSource' && Array.isArray(obj[key])) {
          obj[key] = obj[key].map((item: any) => {
            // Clean up the structure - keep only the non-empty option
            const cleaned: any = {};
            if (item.recipientAddress && Object.keys(item.recipientAddress).length > 0) {
              cleaned.recipientAddress = item.recipientAddress;
            } else if (item.addressListId && item.addressListId !== '') {
              cleaned.addressListId = item.addressListId;
            } else if (item.addressId && item.addressId !== '') {
              cleaned.addressId = item.addressId;
            }
            return Object.keys(cleaned).length > 0 ? cleaned : item;
          });
        }
        
        // Handle paymentDetails oneOf structure
        if (key === 'paymentDetails' && typeof obj[key] === 'object') {
          // Flatten the payment structure based on EBNF
          const payment = obj[key];
          const processed: any = {};
          
          // Find which payment type is being used
          if (payment.CREDIT_CARD && payment.creditCardDetails) {
            processed.CREDIT_CARD = payment.CREDIT_CARD;
            processed.creditCardDetails = payment.creditCardDetails;
          } else if (payment.INVOICE && payment.invoiceDetails) {
            processed.INVOICE = payment.INVOICE;
            processed.invoiceDetails = payment.invoiceDetails;
          } else if (payment.ACH && payment.achDetails) {
            processed.ACH = payment.ACH;
            processed.achDetails = payment.achDetails;
          } else if (payment.USER_CREDIT && payment.creditAmount) {
            processed.USER_CREDIT = payment.USER_CREDIT;
            processed.creditAmount = payment.creditAmount;
          }
          
          obj[key] = processed;
        }
        
        // Process nested objects and arrays
        if (Array.isArray(obj[key])) {
          obj[key] = obj[key].map((item: any) => 
            typeof item === 'object' ? processObject(item) : item
          );
        } else {
          processObject(obj[key]);
        }
      }
    }
    return obj;
  }

  return processObject(processed);
}

export function generatePythonCode(options: CodeGenerationOptions): string {
  const { 
    endpoint, 
    mockServerUrl = DEFAULT_MOCK_URL, 
    includeAuth = true, 
    customParameters,
    clientId = 'test-client-123',
    clientSecret = 'test-secret-456'
  } = options;
  const timestamp = new Date().toISOString();
  
  // Use custom parameters if provided, otherwise use the example payload
  const rawPayload = customParameters || endpoint.payloadExample;
  const payload = processParametersForPayload(rawPayload);
  
  return `#!/usr/bin/env python3
"""
C2M API - ${endpoint.path}
Generated: ${timestamp}
Description: ${endpoint.description}
"""
import json
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any

# Configuration
API_BASE_URL = "${mockServerUrl}"  # Mock server or production API endpoint
AUTH_BASE_URL = "${AUTH_BASE_URL}"  # C2M Auth service

# Note: Using test credentials for the mock server
CLIENT_ID = "${clientId}"  # Replace with your client ID
CLIENT_SECRET = "${clientSecret}"  # Replace with your client secret

def make_request(method: str, url: str, headers: Dict, body: Any = None) -> tuple:
    """Make HTTP request and return (data, headers, status_code)"""
    print("\\n" + "="*60)
    print("REQUEST")
    print("="*60)
    print(f"{method} {url}")
    print("\\nHeaders:")
    for key, value in headers.items():
        print(f"  {key}: {value}")
    if body:
        print("\\nBody:")
        print(json.dumps(body, indent=2))
    
    data_bytes = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read()
            status = response.status
            headers_dict = dict(response.headers)
    except urllib.error.HTTPError as e:
        data = e.read()
        status = e.code
        headers_dict = dict(e.headers)
    
    # Print response
    print("\\n" + "="*60)
    print("RESPONSE")
    print("="*60)
    print(f"Status: {status}")
    print("\\nHeaders:")
    for key, value in headers_dict.items():
        print(f"  {key}: {value}")
    if data:
        print("\\nBody:")
        try:
            response_json = json.loads(data.decode('utf-8'))
            print(json.dumps(response_json, indent=2))
        except:
            print(data.decode('utf-8'))
    
    return data, headers_dict, status

${includeAuth ? `def get_access_token(client_id: str, client_secret: str) -> str:
    """Exchange client credentials for JWT access token"""
    print("\\n🔐 AUTHENTICATION FLOW")
    print("="*60)
    
    # Step 1: Get long-term token
    print("\\n1. Getting long-term token...")
    url = f"{AUTH_BASE_URL}/auth/tokens/long"
    
    payload = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret
    }
    
    headers = {"Content-Type": "application/json"}
    data, _, status = make_request("POST", url, headers, payload)
    
    if status not in [200, 201]:
        raise Exception(f"Failed to get long-term token: {data.decode('utf-8')}")
    
    response_json = json.loads(data.decode('utf-8'))
    long_term_token = response_json["access_token"]
    print("\\n✅ Long-term token obtained")
    
    # Step 2: Exchange for short-term token
    print("\\n2. Exchanging for short-term token...")
    url = f"{AUTH_BASE_URL}/auth/tokens/short"
    
    headers = {
        "Authorization": f"Bearer {long_term_token}",
        "Content-Type": "application/json"
    }
    
    payload = {"grant_type": "token_exchange"}
    data, _, status = make_request("POST", url, headers, payload)
    
    if status not in [200, 201]:
        raise Exception(f"Failed to get short-term token: {data.decode('utf-8')}")
    
    response_json = json.loads(data.decode('utf-8'))
    short_term_token = response_json["access_token"]
    print("\\n✅ Short-term token obtained")
    
    return short_term_token

` : ''}def submit_request(token: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Submit API request to ${endpoint.path}"""
    url = f"{API_BASE_URL}${endpoint.path}"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\\n📤 SUBMITTING REQUEST TO ${endpoint.path}")
    print("="*60)
    
    data, _, status = make_request("${endpoint.method}", url, headers, payload)
    
    if status >= 400:
        raise Exception(f"Request failed with status {status}: {data.decode('utf-8')}")
    
    return json.loads(data.decode('utf-8')) if data else {}

# Main execution
if __name__ == "__main__":
    try:
        # Authenticate
        ${includeAuth ? 'token = get_access_token(CLIENT_ID, CLIENT_SECRET)' : 'token = "YOUR_ACCESS_TOKEN"  # Replace with your token'}
        
        # Prepare payload
        payload = ${JSON.stringify(payload, null, 8).split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n')}
        
        # Submit request
        result = submit_request(token, payload)
        
        print("\\n✅ SUCCESS!")
        print("="*60)
        print("Result saved to response.json")
        
        # Save response
        with open("response.json", "w") as f:
            json.dump(result, f, indent=2)
            
    except Exception as e:
        print(f"\\n❌ ERROR: {str(e)}")
        exit(1)
`;
}

export function generateJavaScriptCode(options: CodeGenerationOptions): string {
  const { 
    endpoint, 
    mockServerUrl = DEFAULT_MOCK_URL, 
    includeAuth = true, 
    customParameters,
    clientId = 'test-client-123',
    clientSecret = 'test-secret-456'
  } = options;
  const timestamp = new Date().toISOString();
  
  // Use custom parameters if provided, otherwise use the example payload
  const rawPayload = customParameters || endpoint.payloadExample;
  const payload = processParametersForPayload(rawPayload);
  
  return `#!/usr/bin/env node
/**
 * C2M API - ${endpoint.path}
 * Generated: ${timestamp}
 * Description: ${endpoint.description}
 */

// Configuration
const API_BASE_URL = "${mockServerUrl}"; // Mock server or production API endpoint
const AUTH_BASE_URL = "${AUTH_BASE_URL}"; // C2M Auth service

// Note: Using test credentials for the mock server
const CLIENT_ID = "${clientId}"; // Replace with your client ID
const CLIENT_SECRET = "${clientSecret}"; // Replace with your client secret

// Helper function to print requests
function printRequest(method, url, headers, body = null) {
    console.log("\\n" + "=".repeat(60));
    console.log("REQUEST");
    console.log("=".repeat(60));
    console.log(\`\${method} \${url}\`);
    console.log("\\nHeaders:");
    Object.entries(headers).forEach(([key, value]) => {
        console.log(\`  \${key}: \${value}\`);
    });
    if (body) {
        console.log("\\nBody:");
        console.log(JSON.stringify(body, null, 2));
    }
}

// Helper function to print responses
function printResponse(response, body) {
    console.log("\\n" + "=".repeat(60));
    console.log("RESPONSE");
    console.log("=".repeat(60));
    console.log(\`Status: \${response.status} \${response.statusText}\`);
    console.log("\\nHeaders:");
    response.headers.forEach((value, key) => {
        console.log(\`  \${key}: \${value}\`);
    });
    if (body) {
        console.log("\\nBody:");
        console.log(JSON.stringify(body, null, 2));
    }
}

${includeAuth ? `async function getAccessToken(clientId, clientSecret) {
    console.log("\\n🔐 AUTHENTICATION FLOW");
    console.log("=".repeat(60));
    
    // Step 1: Get long-term token
    console.log("\\n1. Getting long-term token...");
    const longTermUrl = \`\${AUTH_BASE_URL}/auth/tokens/long\`;
    
    const longTermPayload = {
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
    };
    
    const longTermHeaders = {
        "Content-Type": "application/json"
    };
    
    printRequest("POST", longTermUrl, longTermHeaders, longTermPayload);
    
    const longTermResponse = await fetch(longTermUrl, {
        method: "POST",
        headers: longTermHeaders,
        body: JSON.stringify(longTermPayload)
    });
    
    const longTermData = await longTermResponse.json();
    printResponse(longTermResponse, longTermData);
    
    if (!longTermResponse.ok) {
        throw new Error(\`Failed to get long-term token: \${JSON.stringify(longTermData)}\`);
    }
    
    const longTermToken = longTermData.access_token;
    console.log("\\n✅ Long-term token obtained");
    
    // Step 2: Exchange for short-term token
    console.log("\\n2. Exchanging for short-term token...");
    const shortTermUrl = \`\${AUTH_BASE_URL}/auth/tokens/short\`;
    
    const shortTermHeaders = {
        "Authorization": \`Bearer \${longTermToken}\`,
        "Content-Type": "application/json"
    };
    
    const shortTermPayload = {
        grant_type: "token_exchange"
    };
    
    printRequest("POST", shortTermUrl, shortTermHeaders, shortTermPayload);
    
    const shortTermResponse = await fetch(shortTermUrl, {
        method: "POST",
        headers: shortTermHeaders,
        body: JSON.stringify(shortTermPayload)
    });
    
    const shortTermData = await shortTermResponse.json();
    printResponse(shortTermResponse, shortTermData);
    
    if (!shortTermResponse.ok) {
        throw new Error(\`Failed to get short-term token: \${JSON.stringify(shortTermData)}\`);
    }
    
    const shortTermToken = shortTermData.access_token;
    console.log("\\n✅ Short-term token obtained");
    
    return shortTermToken;
}

` : ''}async function submitRequest(token, payload) {
    const url = \`\${API_BASE_URL}${endpoint.path}\`;
    
    const headers = {
        "Authorization": \`Bearer \${token}\`,
        "Content-Type": "application/json"
    };
    
    console.log(\`\\n📤 SUBMITTING REQUEST TO ${endpoint.path}\`);
    console.log("=".repeat(60));
    printRequest("${endpoint.method}", url, headers, payload);
    
    const response = await fetch(url, {
        method: "${endpoint.method}",
        headers: headers,
        body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    printResponse(response, data);
    
    if (!response.ok) {
        throw new Error(\`Request failed with status \${response.status}\`);
    }
    
    return data;
}

// Main execution
(async () => {
    try {
        // Authenticate
        ${includeAuth ? 'const token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);' : 'const token = "YOUR_ACCESS_TOKEN"; // Replace with your token'}
        
        // Prepare payload
        const payload = ${JSON.stringify(payload, null, 8).split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n')};
        
        // Submit request
        const result = await submitRequest(token, payload);
        
        console.log("\\n✅ SUCCESS!");
        console.log("=".repeat(60));
        console.log("Result saved to response.json");
        
        // Save response
        const fs = require('fs').promises;
        await fs.writeFile("response.json", JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error(\`\\n❌ ERROR: \${error.message}\`);
        process.exit(1);
    }
})();
`;
}

export function generateCurlCode(options: CodeGenerationOptions): string {
  const { 
    endpoint, 
    mockServerUrl = DEFAULT_MOCK_URL, 
    includeAuth = true, 
    customParameters,
    clientId = 'test-client-123',
    clientSecret = 'test-secret-456'
  } = options;
  const timestamp = new Date().toISOString();
  
  // Use custom parameters if provided, otherwise use the example payload
  const rawPayload = customParameters || endpoint.payloadExample;
  const payload = processParametersForPayload(rawPayload);
  
  if (includeAuth) {
    return `#!/bin/bash
# C2M API - ${endpoint.path}
# Generated: ${timestamp}
# Description: ${endpoint.description}

# Configuration
API_BASE_URL="${mockServerUrl}"  # Mock server or production API endpoint
AUTH_BASE_URL="${AUTH_BASE_URL}"  # C2M Auth service

# Note: Using test credentials for the mock server
CLIENT_ID="${clientId}"  # Replace with your client ID
CLIENT_SECRET="${clientSecret}"  # Replace with your client secret

echo "🔐 AUTHENTICATION FLOW"
echo "=========================================================="

# Step 1: Get long-term token
echo -e "\\n1. Getting long-term token..."
LONG_TERM_RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "client_credentials",
    "client_id": "'$CLIENT_ID'",
    "client_secret": "'$CLIENT_SECRET'"
  }' \\
  "$AUTH_BASE_URL/auth/tokens/long")

HTTP_CODE=$(echo "$LONG_TERM_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LONG_TERM_RESPONSE" | sed '$d')

echo "Response: $RESPONSE_BODY"
echo "Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "❌ Failed to get long-term token"
  exit 1
fi

LONG_TERM_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "✅ Long-term token obtained"

# Step 2: Exchange for short-term token
echo -e "\\n2. Exchanging for short-term token..."
SHORT_TERM_RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST \\
  -H "Authorization: Bearer $LONG_TERM_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"grant_type": "token_exchange"}' \\
  "$AUTH_BASE_URL/auth/tokens/short")

HTTP_CODE=$(echo "$SHORT_TERM_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$SHORT_TERM_RESPONSE" | sed '$d')

echo "Response: $RESPONSE_BODY"
echo "Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "❌ Failed to get short-term token"
  exit 1
fi

SHORT_TERM_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "✅ Short-term token obtained"

# Step 3: Make API request
echo -e "\\n📤 SUBMITTING REQUEST TO ${endpoint.path}"
echo "=========================================================="

RESPONSE=$(curl -s -w "\\n%{http_code}" -X ${endpoint.method} \\
  -H "Authorization: Bearer $SHORT_TERM_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}' \\
  "$API_BASE_URL${endpoint.path}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $RESPONSE_BODY"
echo "Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" -ge "400" ]; then
  echo "❌ Request failed"
  exit 1
fi

echo -e "\\n✅ SUCCESS!"
echo "=========================================================="
echo "$RESPONSE_BODY" > response.json
echo "Result saved to response.json"
`;
  } else {
    // Non-auth version
    return `#!/bin/bash
# C2M API - ${endpoint.path}
# Generated: ${timestamp}
# Description: ${endpoint.description}

# Configuration
API_BASE_URL="${mockServerUrl}"  # Mock server or production API endpoint
TOKEN="YOUR_ACCESS_TOKEN"  # Replace with your access token

echo "📤 SUBMITTING REQUEST TO ${endpoint.path}"
echo "=========================================================="

RESPONSE=$(curl -s -w "\\n%{http_code}" -X ${endpoint.method} \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}' \\
  "$API_BASE_URL${endpoint.path}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $RESPONSE_BODY"
echo "Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" -ge "400" ]; then
  echo "❌ Request failed"
  exit 1
fi

echo -e "\\n✅ SUCCESS!"
echo "=========================================================="
echo "$RESPONSE_BODY" > response.json
echo "Result saved to response.json"
`;
  }
}