import json
import subprocess
import tempfile
import os
import uuid

def lambda_handler(event, context):
    """Lambda handler for code execution"""
    print(f'Received event: {json.dumps(event)}')

    # Parse request body
    try:
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
    except (json.JSONDecodeError, KeyError) as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid request body'})
        }

    code = body.get('code')
    language = body.get('language')

    # Validate input
    if not code or not language:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Code and language are required'})
        }

    # Generate unique filename
    file_id = str(uuid.uuid4().hex[:16])
    tmp_dir = '/tmp'

    try:
        if language == 'python':
            filename = os.path.join(tmp_dir, f'{file_id}.py')
            with open(filename, 'w') as f:
                f.write(code)
            command = ['python3', filename]

        elif language == 'javascript':
            filename = os.path.join(tmp_dir, f'{file_id}.js')
            with open(filename, 'w') as f:
                f.write(code)
            # Node.js is available in Python Lambda runtime
            command = ['node', filename]

        elif language == 'curl':
            filename = os.path.join(tmp_dir, f'{file_id}.sh')
            with open(filename, 'w') as f:
                f.write(f'#!/bin/bash\n{code}')
            os.chmod(filename, 0o755)
            command = ['bash', filename]

        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Unsupported language'})
            }

        # Execute the command with timeout
        try:
            result = subprocess.run(
                command,
                timeout=30,
                capture_output=True,
                text=True,
                check=False
            )

            # Clean up temp file
            if os.path.exists(filename):
                os.unlink(filename)

            if result.returncode == 0:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': True,
                        'output': result.stdout,
                        'error': ''
                    })
                }
            else:
                error_message = result.stderr or result.stdout or 'Execution failed'

                # Add helpful messages for common errors
                if 'ModuleNotFoundError' in error_message and 'requests' in error_message:
                    error_message += '\n\nNote: The requests module is not available in this execution environment. Please use urllib instead.'

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': False,
                        'output': result.stdout or '',
                        'error': error_message
                    })
                }

        except subprocess.TimeoutExpired:
            # Clean up temp file
            if os.path.exists(filename):
                os.unlink(filename)

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'success': False,
                    'output': '',
                    'error': 'Execution timed out after 30 seconds'
                })
            }

    except Exception as e:
        print(f'Error: {str(e)}')

        # Clean up temp file if it exists
        if 'filename' in locals() and os.path.exists(filename):
            try:
                os.unlink(filename)
            except Exception as cleanup_error:
                print(f'Error cleaning up temp file: {str(cleanup_error)}')

        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'error': str(e) or 'Internal server error'
            })
        }
