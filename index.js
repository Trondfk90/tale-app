// Require the necessary modules
const { app, BrowserWindow, dialog } = require('electron'); // Electron modules
const sdk = require("microsoft-cognitiveservices-speech-sdk"); // Microsoft Speech SDK
const ipcMain = require('electron').ipcMain; // Inter-process communication
const path = require('path'); // Path module
if (require('electron-squirrel-startup')) app.quit();

// Set a default folder for saving audio files
let lastUsedFolder = app.getPath('desktop');

// Load environment variables from a .env file
require('dotenv').config();

// Define a function to create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the index.html file into the window
  mainWindow.loadFile('index.html');

  // Define what happens when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Define a function to start the speech synthesizer
  function startSynthesizer(text, voiceName) {
    console.log(`Starting synthesizer for text: "${text}"`);

    // Show a save dialog to let the user choose where to save the audio file
    dialog.showSaveDialog(mainWindow, {
      defaultPath: path.join(lastUsedFolder, `Lydfil-${Date.now()}.wav`)
    }).then(result => {
      if (!result.canceled) {
        const audioFile = result.filePath;
        lastUsedFolder = path.dirname(audioFile);

        // Set up the speech synthesizer with the Microsoft Speech SDK
        const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);
        speechConfig.speechSynthesisVoiceName = voiceName;
        var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        // Start synthesizing the text and handle the result
        synthesizer.speakTextAsync(text,
          function (result) {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              console.log("Synthesis finished.");
            } else {
              console.error("Speech synthesis canceled, " + result.errorDetails +
                "\nDid you set the speech resource key and region values?");
            }
            synthesizer.close();
            synthesizer = null;
          },
          function (err) {
            console.trace("err - " + err);
            synthesizer.close();
            synthesizer = null;
          });
        console.log("Now synthesizing to: " + audioFile);
      }
    }).catch(err => {
      console.error(err);
    });
  }

  // Set up an IPC listener to start the speech synthesizer
  ipcMain.on('synthesize', (event, text, voiceName) => {
    startSynthesizer(text, voiceName);
  });
}

// When the app is ready, create the main window
app.on('ready', function () {
  createWindow();
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// When the app is activated (e.g., when clicking on the dock icon on macOS), create the main window if it doesn't exist
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
