@echo off
setlocal
title Wrath Site Starter

echo ========================================
echo        Wrath Site - Local Starter
echo ========================================

:: Check for Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is NOT installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for NPM
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] NPM was not found. Please reinstall Node.js.
    pause
    exit /b 1
)

:: Auto-install dependencies if node_modules is missing
if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [INFO] Starting Wrath Site on http://localhost:3000...
echo [INFO] Press Ctrl+C to stop the server.
echo.

:: Start the server and keep window open on crash
node server.js
if errorlevel 1 (
    echo.
    echo [CRITICAL] The site server has stopped or crashed.
    pause
)
