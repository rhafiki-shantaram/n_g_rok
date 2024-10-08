import { execSync, exec } from 'child_process';
import robot from 'robotjs';
import clipboardy from 'clipboardy';
import util from 'util';

// Configuration
const TEAMVIEWER_PATH = 'C:\\Program Files\\TeamViewer\\TeamViewer.exe';
const CHECK_INTERVAL = 1000; // Check every second
const INTERACT_CHECK_INTERVAL = 5000; // Try interactivity check every 5 seconds
const EXPECTED_VALUE = 'a'; // The expected value to be typed and checked

// Function to check if TeamViewer is running
function isTeamViewerRunning() {
    try {
        execSync('tasklist | findstr /I "TeamViewer.exe"');
        console.log('TeamViewer is running.');
        return true;  // TeamViewer is running
    } catch {
        console.log('TeamViewer is not running.');
        return false;  // TeamViewer is not running
    }
}

// Function to terminate TeamViewer process
function terminateTeamViewer() {
    try {
        console.log('Terminating TeamViewer...');
        execSync('taskkill /F /IM TeamViewer.exe');  // Force terminate TeamViewer
        console.log('TeamViewer terminated.');
    } catch (error) {
        console.error('Error terminating TeamViewer:', error);
    }
}

// Function to launch TeamViewer
function launchTeamViewer() {
    console.log('Launching TeamViewer...');
    exec(`"${TEAMVIEWER_PATH}"`, (err) => {
        if (err) {
            console.error('Error launching TeamViewer:', err);
        } else {
            console.log('TeamViewer launch initiated...');
            // Start the interactivity check loop immediately
            startInteractivityCheckLoop();
        }
    });
}

// Function to click on the middle-left of the screen
function clickAtLeftEdge() {
    const screenSize = robot.getScreenSize();
    const x = 0; // Left edge of the screen
    const y = Math.floor(screenSize.height / 2); // Middle of the screen vertically
    robot.moveMouse(x, y);
    robot.mouseClick();
    console.log(`Clicked at (${x}, ${y})`);
}

// Function to perform the Shift+Tab action eight times
function shiftTabMultipleTimes(count) {
    for (let i = 0; i < count; i++) {
        robot.keyTap('tab', 'shift');  // Simulate Shift+Tab
        robot.setKeyboardDelay(100);  // Add a small delay between actions
    }
    console.log(`Performed Shift+Tab ${count} times`);
}

// Backup function to read clipboard using Powershell
async function getClipboardFallback() {
    try {
        const { stdout } = await util.promisify(exec)(
            'powershell Get-Clipboard'
        );
        return stdout.trim();
    } catch (error) {
        console.error('Backup clipboard read failed:', error);
        return null;
    }
}

// Function to perform the interactivity check (click, type, copy, check)
async function performInteractionCheck() {
    console.log('Performing interactivity check...');

    // Step 1: Click at the middle-left of the screen
    clickAtLeftEdge();

    // Step 2: Perform Shift+Tab eight times
    shiftTabMultipleTimes(8);

    // Step 3: Type the letter "a"
    robot.typeString("a");
    console.log('Typed "a" into the input field');

    // Step 4: Copy the input value to clipboard (Ctrl + A, Ctrl + C)
    robot.keyTap('a', 'control');  // Select all
    robot.keyTap('c', 'control');  // Copy to clipboard

    // Step 5: Wait for a moment to ensure clipboard is updated
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay

    // Step 6: Check the clipboard value using clipboardy, fallback to Powershell if needed
    let clipboardValue;
    try {
        clipboardValue = await clipboardy.read();
        console.log(`Clipboard content: "${clipboardValue.trim()}"`);
    } catch (error) {
        console.error('Error reading clipboard with clipboardy, trying backup method...');
        clipboardValue = await getClipboardFallback();
        console.log(`Backup clipboard content: "${clipboardValue}"`);
    }

    // Step 7: Check if the clipboard value matches the expected value
    if (clipboardValue && clipboardValue.trim() === EXPECTED_VALUE) {
        console.log('Check passed: Clipboard content matches the expected value.');
        return true;  // Interaction check passed
    } else {
        console.log('Check failed: Clipboard content does not match the expected value.');
        return false;  // Interaction check failed
    }
}

// Function to start the interactivity check loop every 5 seconds
function startInteractivityCheckLoop() {
    const checkInterval = setInterval(async () => {
        const success = await performInteractionCheck();
        if (success) {
            clearInterval(checkInterval);  // Stop checking once it passes
            console.log('Interactivity check passed. No further checks needed.');
        } else {
            console.log('Interactivity check failed. Will retry in 5 seconds...');
        }
    }, INTERACT_CHECK_INTERVAL);  // Check every 5 seconds
}

// Function to continuously check if TeamViewer is running and take action
function checkIfTeamViewerIsRunning() {
    const checkInterval = setInterval(() => {
        const running = isTeamViewerRunning();
        if (running) {
            console.log('TeamViewer is detected. Terminating and relaunching...');
            terminateTeamViewer();  // Terminate TeamViewer if running
            launchTeamViewer();  // Relaunch after termination
            startInteractivityCheckLoop();
            clearInterval(checkInterval);  // Stop the loop
        } else {
            console.log('TeamViewer is not running. Launching...');
            launchTeamViewer();  // Launch TeamViewer if it's not running
            startInteractivityCheckLoop();
            clearInterval(checkInterval);  // Stop the loop after launching
        }
    }, CHECK_INTERVAL);
}

// Start checking for TeamViewer
checkIfTeamViewerIsRunning();
