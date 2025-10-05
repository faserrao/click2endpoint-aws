const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Temporary directory for code execution
const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
}

ensureTempDir();

// Execute code endpoint
app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }

  // Generate unique filename
  const fileId = crypto.randomBytes(8).toString('hex');
  let filename, command;

  try {
    switch (language) {
      case 'python':
        filename = path.join(TEMP_DIR, `${fileId}.py`);
        await fs.writeFile(filename, code);
        command = `python3 "${filename}"`;
        break;
        
      case 'javascript':
        filename = path.join(TEMP_DIR, `${fileId}.js`);
        await fs.writeFile(filename, code);
        command = `node "${filename}"`;
        break;
        
      case 'curl':
        // For cURL, create a shell script and execute it
        // This provides some isolation and allows for better error handling
        filename = path.join(TEMP_DIR, `${fileId}.sh`);
        await fs.writeFile(filename, `#!/bin/bash\n${code}`);
        await fs.chmod(filename, '755');
        command = `bash "${filename}"`;
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported language' });
    }

    // Execute the command with a timeout
    exec(command, { timeout: 30000 }, async (error, stdout, stderr) => {
      // Clean up temp file
      if (filename) {
        try {
          await fs.unlink(filename);
        } catch (err) {
          console.error('Error cleaning up temp file:', err);
        }
      }

      if (error) {
        let errorMessage = stderr || error.message;
        
        // Add helpful messages for common errors
        if (errorMessage.includes('ModuleNotFoundError') && errorMessage.includes('requests')) {
          errorMessage += '\n\nTo fix this error, install the required Python packages:\npip3 install -r requirements.txt';
        }
        
        return res.json({
          success: false,
          output: stdout || '',
          error: errorMessage
        });
      }

      res.json({
        success: true,
        output: stdout,
        error: stderr
      });
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Code execution server running on port ${PORT}`);
});