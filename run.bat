@echo off
echo Setting up Virtual Community Manager...

:: Create virtual environment
python -m venv venv
call venv\Scripts\activate

:: Install dependencies
pip install -r requirements.txt

:: Create necessary directories
mkdir -p static\js
mkdir -p data

:: Start the application
echo Starting the application...
uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
