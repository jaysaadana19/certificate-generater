#!/usr/bin/env python3
# This file is a wrapper to start the Python FastAPI server
# The supervisor config expects server.js, so we use this to launch server.py

import subprocess
import sys
import os

# Change to backend directory
os.chdir('/app/backend')

# Start the FastAPI server
print("🚀 Starting FastAPI backend server...")
subprocess.run([sys.executable, 'server.py'])
