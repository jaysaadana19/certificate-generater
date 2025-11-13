// Wrapper to start Python FastAPI server from Node.js supervisor
const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Starting FastAPI backend via Node.js wrapper...');

const python = spawn('python3', ['server.py'], {
    cwd: '/app/backend',
    stdio: 'inherit'
});

python.on('error', (err) => {
    console.error('❌ Failed to start Python server:', err);
    process.exit(1);
});

python.on('exit', (code) => {
    console.log(`Python server exited with code ${code}`);
    process.exit(code);
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
