module.exports = {
  packagerConfig: {
    asar: {
      unpack: "*.node",
      files: [
        "**/*",
        ".env" // Include the .env file in the packaged application
      ],
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
      setupIcon: 'D:/Tale-app-v3/Tale app/icon2.ico',
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      setupIcon: 'D:/Tale-app-v3/Tale app/icon2.ico',
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
      setupIcon: 'D:/Tale-app-v3/Tale app/icon2.ico',
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
      setupIcon: 'D:/Tale-app-v3/Tale app/icon2.ico',
    },
  ],
};
