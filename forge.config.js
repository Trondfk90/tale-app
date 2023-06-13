module.exports = {
  packagerConfig: {
  
    asar: {
      unpack: "*.node",
    },
    files: [
      "**/*",
      "key.env" // Include the key.env file in the packaged application
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {iconUrl: 'https://tfkweb.no/wp-content/uploads/2023/06/icon.ico'},
      setupIcon: './assets/icon.ico',
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      setupIcon: './assets/icon.ico',
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
      setupIcon: './assets/icon.ico',
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
      setupIcon: './assets/icon.ico',
    },
  ],
};
