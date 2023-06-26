// Require the necessary modules
const { app, BrowserWindow, dialog, protocol, ipcMain } = require('electron');
const updater = require('update-electron-app');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const path = require('path');
const fs = require('fs');
const iconPath = path.join(__dirname, 'icon.ico');
const msal = require('@azure/msal-node');
const appRoot = require('app-root-path');
const dotenvPath = appRoot.resolve('key.env');
require('dotenv').config({ path: dotenvPath });

let mainWindow = null;

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: process.env.AUTHORITY,
    redirectUri: process.env.REDIRECT_URI,
  },
};

const pca = new msal.PublicClientApplication(msalConfig);
const msalTokenCache = pca.getTokenCache();

// Squirrel
if (process.platform === 'win32') {
  const squirrelEvent = process.argv[1];
  const spawn = require('child_process').spawn;
  const appFolder = path.resolve(process.execPath, '..');
  const updateDotExe = path.resolve(path.join(appFolder, '..', 'Update.exe'));
  const exeName = path.basename(process.execPath);


  const spawnUpdate = function(args) {
    let spawnedProcess;
    
    try {
      spawnedProcess = spawn(updateDotExe, args, { detached: true });
    } catch (error) {}

    return spawnedProcess;
  };

  const handleSquirrelEvent = function() {
    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        // Create desktop and start menu shortcuts
        spawnUpdate(['--createShortcut', exeName]);
        setTimeout(app.quit, 1000);
        return true;

      case '--squirrel-uninstall':
        // Remove desktop and start menu shortcuts
        spawnUpdate(['--removeShortcut', exeName]);
        setTimeout(app.quit, 1000);
        return true;

      case '--squirrel-obsolete':
        app.quit();
        return true;
    }
  };

  function checkSquirrelEvent() {
    if (handleSquirrelEvent()) {
      return;
    }
  }
  
  checkSquirrelEvent();
}


// signIn function
async function signIn() {
  let accounts = await msalTokenCache.getAllAccounts();

  if (accounts.length > 0) {
    const silentRequest = {
      account: accounts[0],
      scopes: ["user.read"],
    };

    pca.acquireTokenSilent(silentRequest).then((response) => {
      isAuthenticated = true;
    }).catch((error) => console.log(error));
    
  } else {
    const {verifier, challenge} = await pca.cryptoProvider.generatePkceCodes();

    const authCodeUrlParameters = {
      scopes: ["User.Read"],
      redirectUri: process.env.REDIRECT_URI,
      codeChallenge: challenge,
      codeChallengeMethod: "S256"
    };

    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
      mainWindow.loadURL(response);
      
      mainWindow.webContents.on('will-redirect', async (event, url) => {
        if (url.startsWith('http://localhost:8000/callback')) {
          event.preventDefault();
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
      
          if (code) {
            const tokenRequest = {
              code: code,
              codeVerifier: verifier,
              redirectUri: 'http://localhost:8000/callback',
              scopes: ["User.Read"],
            };
      
            pca.acquireTokenByCode(tokenRequest).then((response) => {
              isAuthenticated = true;
              mainWindow.loadURL('file://' + __dirname + '/index.html');
              mainWindow.webContents.on('did-finish-load', () => {
                mainWindow.webContents.send('msal:loginSuccess', response);
              });
            }).catch((error) => console.log(error));
            
          }
        }
      });
    }).catch((error) => console.log(JSON.stringify(error)));    
    
  }
}

// Create the main window
function createWindow() {
  try {
    const platform = process.platform;
    let iconFile;
    
    if (platform === 'win32') {
      iconFile = 'assets/icon.ico';
    } else {
      iconFile = 'assets/icon.png';
    }
    
    const iconPath = path.join(__dirname, iconFile);
    
    mainWindow = new BrowserWindow({
      icon: iconPath,
      width: 900,
      height: 1300,
      frame: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    ipcMain.on('signIn', signIn);

    ipcMain.on('signOut', async () => {
      try {
        const accounts = await pca.getTokenCache().getAllAccounts();
        if (accounts.length > 0) {
          mainWindow.webContents.send('showLogoutModal');
        }
      } catch (error) {
        console.error('Error during sign out:', error);
      }
    });

    ipcMain.on('dialogResponse', async (event, response) => {
      try {
        if (response === 'yes') {
          const accounts = await pca.getTokenCache().getAllAccounts();
          if (accounts.length > 0) {
            await pca.getTokenCache().removeAccount(accounts[0]);
            mainWindow.webContents.send('msal:signOut');
            signIn();  // Initiate a new sign-in process
          }
        }
      } catch (error) {
        console.error('Error during dialog response:', error);
      }
    });
  } catch (error) {
    console.error('Error creating window:', error);
  }

  // Hide the menu bar
  mainWindow.setMenuBarVisibility(false);
  
  // Load the index.html
  mainWindow.loadFile('index.html');

  // When the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Get the path to the log file
const logFilePath = path.join(__dirname, 'log.txt');

ipcMain.on('save-log', (event, arg) => {
  console.log('Received save-log event with arg:', arg);
  fs.writeFileSync(logFilePath, JSON.stringify(arg));
});

ipcMain.on('load-log', (event) => {
  let log = [];
  if (fs.existsSync(logFilePath)) {
    log = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
  }
  event.reply('load-log-reply', log);
});

ipcMain.on('import-log', (event, arg) => {
  let log = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
  event.reply('import-log-reply', log[arg]);
});

ipcMain.on('delete-log', (event, arg) => {
  let log = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
  log.splice(arg, 1);
  fs.writeFileSync(logFilePath, JSON.stringify(log));
  event.reply('delete-log-reply', log);
});


// IPC listener for the synthesize event
ipcMain.on('synthesize', async (event, text, voiceName, pitch, rate, templateContent) => {


  // Show the loading wheel
  mainWindow.webContents.send('loading:show');

//generate the SSML string and synthesize the speech
const ssml = `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="nb-NO">
    <voice name="${voiceName}">
      <prosody pitch="${pitch}%" rate="${rate}">
        ${templateContent}
        ${text}
      </prosody>
    </voice>
  </speak>`;

    // Log the SSML content to the console
    console.log("SSML content:", ssml);

  const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
  speechConfig.speechSynthesisVoiceName = voiceName;
  var synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  synthesizer.speakSsmlAsync(ssml,
    function (result) {

  // Hide the loading wheel
      mainWindow.webContents.send('loading:hide');

      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        console.log("Synthesis finished.");
        const audioData = result.audioData;
        mainWindow.webContents.send('synthesize:done', audioData);
      } else {
        console.error("Speech synthesis canceled, " + result.errorDetails +
          "\nDid you set the speech resource key and region values?");
        mainWindow.webContents.send('synthesize:error', result.errorDetails);
      }      
      synthesizer.close();
      synthesizer = null;
    },
    function (err) {
      console.trace("err - " + err);
      synthesizer.close();
      synthesizer = null;
    });
  console.log("Now synthesizing...");
});

// Function to save the audio file
function saveAudioFile(audioData) {

// Check if audioData is not null
if (!audioData) {
console.error('Audio data is null, cannot save the file.');
return;
}

  // Generate a date stamp string
  const date = new Date();
  const dateStamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;

  dialog.showSaveDialog(mainWindow, {
    title: 'Save Audio File',
    defaultPath: `output_${dateStamp}.wav`,
    filters: [{ name: 'Audio Files', extensions:
    ['wav'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, Buffer.from(audioData));
      console.log('File saved:', result.filePath);
    }
  }).catch(err => {
    console.error(err);
  });
}

// IPC listener to save the audio file
ipcMain.on('save-audio-file', (event, audioData) => {
saveAudioFile(audioData);
});

//Check for updates button
ipcMain.on('check-for-updates', () => {
  updater();
});

// Lock the app to one instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('ready', async () => {
    // Register custom protocol
    protocol.registerHttpProtocol('app', (request, callback) => {
      const url = request.url.substr(7);
      callback({ path: path.normalize(`${__dirname}/${url}`) });
    }, (error) => {
      if (error) console.error('Failed to register protocol');
    });

    // Create the main window
    createWindow();

    try {
      // Start the sign-in process
      await signIn();
    } catch (error) {
      console.error('Sign-in process failed:', error);
    }

    // Call the updater
    updater();
  });

  // Set a default folder for saving audio files
  let lastUsedFolder = app.getPath('desktop');

  // Quit when all windows are closed (except on macOS)
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // When the app is activated create the main window if it doesn't exist
  app.on('activate', function () {
    if (mainWindow === null) {
      createWindow();
    }
  });
}