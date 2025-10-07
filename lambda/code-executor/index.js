const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Lambda handler for code execution
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Parse request body
  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const { code, language } = body;

  // Validate input
  if (!code || !language) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Code and language are required' })
    };
  }

  // Generate unique filename
  const fileId = crypto.randomBytes(8).toString('hex');
  const tmpDir = '/tmp';
  let filename, command;

  try {
    switch (language) {
      case 'python':
        filename = path.join(tmpDir, `${fileId}.py`);
        fs.writeFileSync(filename, code);
        command = `python ${filename}`; // Lambda Node.js runtime doesn't include Python
        break;

      case 'javascript':
        filename = path.join(tmpDir, `${fileId}.js`);
        fs.writeFileSync(filename, code);
        command = `node ${filename}`;
        break;

      case 'curl':
        filename = path.join(tmpDir, `${fileId}.sh`);
        fs.writeFileSync(filename, `#!/bin/bash\n${code}`);
        fs.chmodSync(filename, '755');
        command = `bash ${filename}`;
        break;

      default:
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Unsupported language' })
        };
    }

    // Execute the command with timeout
    try {
      const stdout = execSync(command, {
        timeout: 30000, // 30 second timeout
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      // Clean up temp file
      if (filename && fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          output: stdout,
          error: ''
        })
      };

    } catch (execError) {
      // Clean up temp file
      if (filename && fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }

      let errorMessage = execError.stderr || execError.message || 'Execution failed';

      // Add helpful messages for common errors
      if (errorMessage.includes('ModuleNotFoundError') && errorMessage.includes('requests')) {
        errorMessage += '\n\nNote: The requests module is not available in this execution environment. Please use urllib instead.';
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          output: execError.stdout || '',
          error: errorMessage
        })
      };
    }

  } catch (error) {
    console.error('Error:', error);

    // Clean up temp file if it exists
    if (filename && fs.existsSync(filename)) {
      try {
        fs.unlinkSync(filename);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};
