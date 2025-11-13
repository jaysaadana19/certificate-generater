// Wrapper to start Python FastAPI server from Node.js supervisor
const { spawn } = require('child_process');

console.log('🔄 Starting FastAPI backend via Node.js wrapper...');

// Use the virtual environment Python
const pythonPath = '/root/.venv/bin/python3';

const python = spawn(pythonPath, ['server.py'], {
    cwd: '/app/backend',
    stdio: 'inherit',
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
});

python.on('error', (err) => {
    console.error('❌ Failed to start Python server:', err);
    process.exit(1);
});

python.on('exit', (code) => {
    console.log(`Python server exited with code ${code}`);
    process.exit(code || 0);
});

// Handle termination signals
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down...');
    python.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down...');
    python.kill('SIGINT');
});
