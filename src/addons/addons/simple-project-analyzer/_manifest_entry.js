const manifest = {
  "editorOnly": true,
  "name": "Simple Project Analyzer",
  "description": "Analyses your Scratch project and shows detailed statistics including Dr.Scratch scoring, block distribution and more.",
  "credits": [
    {
      name: "Cyberexplorer",
      link: "https://github.com/LanwyWriteXU"
    },
    {
      name: "KOSHINO",
      link: "https://github.com/KOSHINOawa"
    }
  ],
  "info": [
    {
      "type": "warning",
      "text": "This addon is still in development. Some features may not work as expected.",
      "id": "warning"
    }
  ],
  "tags": [
    "recommended",
    "new",
    "development"
  ],
  "dynamicDisable": true,
  "userscripts": [
    {
      url: "userscript.js"
    }
  ],
  "userstyles": [
    {
      url: "userstyle.css"
    }
  ],
  "enabledByDefault": false
};
export default manifest;