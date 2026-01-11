// Firebase Configuration and Initialization

// Firebase configuration - REPLACE WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDKKAxKTFJcMDmj6j21nKHwlSpwAxsw57k",
  authDomain: "call-breke.firebaseapp.com",
  databaseURL: "https://call-breke-default-rtdb.firebaseio.com",
  projectId: "call-breke",
  storageBucket: "call-breke.firebasestorage.app",
  messagingSenderId: "908751603046",
  appId: "1:908751603046:web:fd30e07b9e6400b35c74a7",
  measurementId: "G-V2D55S47QV
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Make database available globally
window.firebaseDB = database;

// Notify game that Firebase is ready
if (window.game) {
    window.game.firebaseInitialized = true;
}

// Database rules for Firebase Realtime Database
/*
RULES TO PASTE IN FIREBASE CONSOLE (Database -> Rules tab):

{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": "auth != null || newData.child('players').child(auth.uid).exists() || !data.exists()",
        ".validate": "newData.hasChildren(['code', 'created', 'status'])",
        
        "code": {
          ".validate": "newData.isString() && newData.val().length === 6"
        },
        "created": {
          ".validate": "newData.isNumber()"
        },
        "status": {
          ".validate": "newData.isString() && ['waiting', 'bidding', 'playing', 'scoring'].includes(newData.val())"
        },
        "players": {
          "$playerId": {
            ".validate": "newData.hasChildren(['id', 'name', 'ready', 'position'])",
            "id": {
              ".validate": "newData.isString()"
            },
            "name": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 15"
            },
            "ready": {
              ".validate": "newData.isBoolean()"
            },
            "position": {
              ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 3"
            }
          }
        },
        "gameState": {
          ".validate": "newData.hasChildren(['phase', 'players', 'currentPlayer'])",
          "phase": {
            ".validate": "newData.isString() && ['waiting', 'bidding', 'playing', 'scoring'].includes(newData.val())"
          }
        }
      }
    }
  }
}
*/

console.log('Firebase initialized successfully');